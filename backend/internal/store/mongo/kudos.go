package mongo

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"github.com/BananaOps/kudo/backend/internal/kudos"
)

type kudoDoc struct {
	ID           bson.ObjectID `bson:"_id,omitempty"`
	WorkspaceID  string        `bson:"workspace_id"`
	FromUserID   string        `bson:"from_user_id"`
	FromUserName string        `bson:"from_user_name"`
	ToUserID     string        `bson:"to_user_id"`
	ToUserName   string        `bson:"to_user_name"`
	Message      string        `bson:"message"`
	Channel      string        `bson:"channel"`
	EmojiCount   int           `bson:"emoji_count"`
	CreatedAt    time.Time     `bson:"created_at"`
}

func docToKudo(d kudoDoc) *kudos.Kudo {
	return &kudos.Kudo{
		ID:           d.ID.Hex(),
		WorkspaceID:  d.WorkspaceID,
		FromUserID:   d.FromUserID,
		FromUserName: d.FromUserName,
		ToUserID:     d.ToUserID,
		ToUserName:   d.ToUserName,
		Message:      d.Message,
		Channel:      d.Channel,
		EmojiCount:   d.EmojiCount,
		CreatedAt:    d.CreatedAt,
	}
}

type KudosRepository struct {
	col *mongo.Collection
}

func (r *KudosRepository) EnsureIndexes(ctx context.Context) error {
	indexes := []mongo.IndexModel{
		{Keys: bson.D{
			{Key: "workspace_id", Value: 1},
			{Key: "from_user_id", Value: 1},
			{Key: "created_at", Value: 1},
		}},
		{Keys: bson.D{
			{Key: "workspace_id", Value: 1},
			{Key: "to_user_id", Value: 1},
			{Key: "created_at", Value: 1},
		}},
		{Keys: bson.D{
			{Key: "workspace_id", Value: 1},
			{Key: "channel", Value: 1},
		}},
	}
	_, err := r.col.Indexes().CreateMany(ctx, indexes)
	return err
}

func (r *KudosRepository) Save(kudo *kudos.Kudo) (*kudos.Kudo, error) {
	emojiCount := kudo.EmojiCount
	if emojiCount == 0 {
		emojiCount = 1
	}
	doc := kudoDoc{
		WorkspaceID:  kudo.WorkspaceID,
		FromUserID:   kudo.FromUserID,
		FromUserName: kudo.FromUserName,
		ToUserID:     kudo.ToUserID,
		ToUserName:   kudo.ToUserName,
		Message:      kudo.Message,
		Channel:      kudo.Channel,
		EmojiCount:   emojiCount,
		CreatedAt:    time.Now().UTC(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := r.col.InsertOne(ctx, doc)
	if err != nil {
		return nil, fmt.Errorf("kudos save: %w", err)
	}
	doc.ID = res.InsertedID.(bson.ObjectID)
	return docToKudo(doc), nil
}

// wsFilter returns a workspace_id filter element, or nothing when workspaceID
// is empty (single-tenant mode: query across all workspaces).
func wsFilter(workspaceID string) bson.D {
	if workspaceID == "" {
		return bson.D{}
	}
	return bson.D{{Key: "workspace_id", Value: workspaceID}}
}

func (r *KudosRepository) CountGivenToday(workspaceID, fromUserID string, day time.Time) (int, error) {
	start := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, day.Location())
	end := start.Add(24 * time.Hour)

	filter := wsFilter(workspaceID)
	filter = append(filter,
		bson.E{Key: "from_user_id", Value: fromUserID},
		bson.E{Key: "created_at", Value: bson.D{
			{Key: "$gte", Value: start},
			{Key: "$lt", Value: end},
		}},
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	n, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return 0, fmt.Errorf("kudos count today: %w", err)
	}
	return int(n), nil
}

func (r *KudosRepository) ListByRecipient(workspaceID, toUserID string) ([]kudos.Kudo, error) {
	f := wsFilter(workspaceID)
	f = append(f, bson.E{Key: "to_user_id", Value: toUserID})
	return r.list(f)
}

func (r *KudosRepository) ListBySender(workspaceID, fromUserID string) ([]kudos.Kudo, error) {
	f := wsFilter(workspaceID)
	f = append(f, bson.E{Key: "from_user_id", Value: fromUserID})
	return r.list(f)
}

func (r *KudosRepository) list(filter bson.D) ([]kudos.Kudo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cur, err := r.col.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("kudos list: %w", err)
	}
	defer cur.Close(ctx)

	var docs []kudoDoc
	if err := cur.All(ctx, &docs); err != nil {
		return nil, fmt.Errorf("kudos decode: %w", err)
	}

	result := make([]kudos.Kudo, len(docs))
	for i, d := range docs {
		result[i] = *docToKudo(d)
	}
	return result, nil
}

func (r *KudosRepository) TopRecipients(workspaceID string, limit int, since *time.Time) ([]kudos.LeaderboardEntry, error) {
	return r.topByField(workspaceID, "to_user_id", "to_user_name", limit, since)
}

func (r *KudosRepository) TopSenders(workspaceID string, limit int, since *time.Time) ([]kudos.LeaderboardEntry, error) {
	return r.topByField(workspaceID, "from_user_id", "from_user_name", limit, since)
}

func (r *KudosRepository) topByField(workspaceID, idField, nameField string, limit int, since *time.Time) ([]kudos.LeaderboardEntry, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	matchFilter := wsFilter(workspaceID)
	if since != nil {
		matchFilter = append(matchFilter, bson.E{Key: "created_at", Value: bson.D{{Key: "$gte", Value: *since}}})
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: matchFilter}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$" + idField},
			{Key: "total", Value: bson.D{{Key: "$sum", Value: "$emoji_count"}}},
			{Key: "name", Value: bson.D{{Key: "$last", Value: "$" + nameField}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "total", Value: -1}}}},
		{{Key: "$limit", Value: limit}},
	}

	cur, err := r.col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("kudos leaderboard: %w", err)
	}
	defer cur.Close(ctx)

	type aggResult struct {
		UserID string `bson:"_id"`
		Total  int    `bson:"total"`
		Name   string `bson:"name"`
	}

	var rows []aggResult
	if err := cur.All(ctx, &rows); err != nil {
		return nil, fmt.Errorf("kudos leaderboard decode: %w", err)
	}

	entries := make([]kudos.LeaderboardEntry, len(rows))
	for i, row := range rows {
		entries[i] = kudos.LeaderboardEntry{
			Rank:        i + 1,
			UserID:      row.UserID,
			UserName:    row.Name,
			WorkspaceID: workspaceID,
			Total:       row.Total,
		}
	}
	return entries, nil
}

func (r *KudosRepository) StatsForUser(workspaceID, userID string, dailyQuota int) (*kudos.Stats, error) {
	now := time.Now().UTC()

	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	startOfWeek := time.Date(now.Year(), now.Month(), now.Day()-weekday+1, 0, 0, 0, 0, time.UTC)
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	receivedThisWeek, err := r.countByFilter(append(wsFilter(workspaceID),
		bson.E{Key: "to_user_id", Value: userID},
		bson.E{Key: "created_at", Value: bson.D{{Key: "$gte", Value: startOfWeek}}},
	))
	if err != nil {
		return nil, err
	}

	receivedThisMonth, err := r.countByFilter(append(wsFilter(workspaceID),
		bson.E{Key: "to_user_id", Value: userID},
		bson.E{Key: "created_at", Value: bson.D{{Key: "$gte", Value: startOfMonth}}},
	))
	if err != nil {
		return nil, err
	}

	givenThisWeek, err := r.countByFilter(append(wsFilter(workspaceID),
		bson.E{Key: "from_user_id", Value: userID},
		bson.E{Key: "created_at", Value: bson.D{{Key: "$gte", Value: startOfWeek}}},
	))
	if err != nil {
		return nil, err
	}

	givenThisMonth, err := r.countByFilter(append(wsFilter(workspaceID),
		bson.E{Key: "from_user_id", Value: userID},
		bson.E{Key: "created_at", Value: bson.D{{Key: "$gte", Value: startOfMonth}}},
	))
	if err != nil {
		return nil, err
	}

	givenToday, err := r.CountGivenToday(workspaceID, userID, now)
	if err != nil {
		return nil, err
	}

	quotaRemaining := dailyQuota - givenToday
	if quotaRemaining < 0 {
		quotaRemaining = 0
	}

	return &kudos.Stats{
		ReceivedThisWeek:  receivedThisWeek,
		ReceivedThisMonth: receivedThisMonth,
		GivenThisWeek:     givenThisWeek,
		GivenThisMonth:    givenThisMonth,
		Streak:            0,
		QuotaRemaining:    quotaRemaining,
	}, nil
}

func (r *KudosRepository) countByFilter(filter bson.D) (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	n, err := r.col.CountDocuments(ctx, filter)
	if err != nil {
		return 0, fmt.Errorf("count: %w", err)
	}
	return int(n), nil
}

func (r *KudosRepository) ChannelStats(workspaceID string) ([]kudos.ChannelStat, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: wsFilter(workspaceID)}},
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$channel"},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "count", Value: -1}}}},
		{{Key: "$limit", Value: 10}},
	}

	cur, err := r.col.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("channel stats: %w", err)
	}
	defer cur.Close(ctx)

	type aggResult struct {
		Channel string `bson:"_id"`
		Count   int    `bson:"count"`
	}

	var rows []aggResult
	if err := cur.All(ctx, &rows); err != nil {
		return nil, fmt.Errorf("channel stats decode: %w", err)
	}

	stats := make([]kudos.ChannelStat, len(rows))
	for i, row := range rows {
		stats[i] = kudos.ChannelStat{Name: row.Channel, Count: row.Count}
	}
	return stats, nil
}

// ListUsers returns all distinct users (senders + recipients) who appear in kudos.
func (r *KudosRepository) ListUsers(workspaceID string) ([]kudos.UserProfile, error) {
senders, err := r.distinctUsers(workspaceID, "from_user_id", "from_user_name")
if err != nil {
return nil, err
}
recipients, err := r.distinctUsers(workspaceID, "to_user_id", "to_user_name")
if err != nil {
return nil, err
}

seen := make(map[string]string, len(senders)+len(recipients))
for _, u := range append(senders, recipients...) {
if u.UserName != "" {
seen[u.UserID] = u.UserName
} else if _, exists := seen[u.UserID]; !exists {
seen[u.UserID] = u.UserID
}
}

result := make([]kudos.UserProfile, 0, len(seen))
for id, name := range seen {
result = append(result, kudos.UserProfile{UserID: id, UserName: name})
}
for i := 1; i < len(result); i++ {
for j := i; j > 0 && result[j].UserName < result[j-1].UserName; j-- {
result[j], result[j-1] = result[j-1], result[j]
}
}
return result, nil
}

func (r *KudosRepository) distinctUsers(workspaceID, idField, nameField string) ([]kudos.UserProfile, error) {
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

pipeline := mongo.Pipeline{
{{Key: "$match", Value: wsFilter(workspaceID)}},
{{Key: "$group", Value: bson.D{
{Key: "_id", Value: "$" + idField},
{Key: "name", Value: bson.D{{Key: "$last", Value: "$" + nameField}}},
}}},
}

cur, err := r.col.Aggregate(ctx, pipeline)
if err != nil {
return nil, fmt.Errorf("distinct users: %w", err)
}
defer cur.Close(ctx)

type row struct {
ID   string `bson:"_id"`
Name string `bson:"name"`
}
var rows []row
if err := cur.All(ctx, &rows); err != nil {
return nil, fmt.Errorf("distinct users decode: %w", err)
}

users := make([]kudos.UserProfile, len(rows))
for i, r := range rows {
users[i] = kudos.UserProfile{UserID: r.ID, UserName: r.Name}
}
return users, nil
}
