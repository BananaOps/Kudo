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

// ── Documents ─────────────────────────────────────────────────────────────────

type challengeDoc struct {
	ID            bson.ObjectID `bson:"_id,omitempty"`
	WorkspaceID   string        `bson:"workspace_id"`
	Title         string        `bson:"title"`
	Description   string        `bson:"description"`
	KudoReward    int           `bson:"kudo_reward"`
	ExpiresAt     *time.Time    `bson:"expires_at,omitempty"`
	IsActive      bool          `bson:"is_active"`
	CreatedByID   string        `bson:"created_by_id"`
	CreatedByName string        `bson:"created_by_name"`
	CreatedAt     time.Time     `bson:"created_at"`
}

type completionDoc struct {
	ID             bson.ObjectID            `bson:"_id,omitempty"`
	ChallengeID    string                   `bson:"challenge_id"`
	ChallengeTitle string                   `bson:"challenge_title"`
	WorkspaceID    string                   `bson:"workspace_id"`
	UserID         string                   `bson:"user_id"`
	UserName       string                   `bson:"user_name"`
	Note           string                   `bson:"note"`
	Status         kudos.ChallengeStatus    `bson:"status"`
	RequestedAt    time.Time                `bson:"requested_at"`
	ReviewedAt     *time.Time               `bson:"reviewed_at,omitempty"`
	ReviewedByID   string                   `bson:"reviewed_by_id,omitempty"`
	ReviewedByName string                   `bson:"reviewed_by_name,omitempty"`
}

func docToChallenge(d challengeDoc) *kudos.Challenge {
	return &kudos.Challenge{
		ID:            d.ID.Hex(),
		WorkspaceID:   d.WorkspaceID,
		Title:         d.Title,
		Description:   d.Description,
		KudoReward:    d.KudoReward,
		ExpiresAt:     d.ExpiresAt,
		IsActive:      d.IsActive,
		CreatedByID:   d.CreatedByID,
		CreatedByName: d.CreatedByName,
		CreatedAt:     d.CreatedAt,
	}
}

func docToCompletion(d completionDoc) *kudos.ChallengeCompletion {
	return &kudos.ChallengeCompletion{
		ID:             d.ID.Hex(),
		ChallengeID:    d.ChallengeID,
		ChallengeTitle: d.ChallengeTitle,
		WorkspaceID:    d.WorkspaceID,
		UserID:         d.UserID,
		UserName:       d.UserName,
		Note:           d.Note,
		Status:         d.Status,
		RequestedAt:    d.RequestedAt,
		ReviewedAt:     d.ReviewedAt,
		ReviewedByID:   d.ReviewedByID,
		ReviewedByName: d.ReviewedByName,
	}
}

// ── Repository ────────────────────────────────────────────────────────────────

type ChallengesRepository struct {
	challenges  *mongo.Collection
	completions *mongo.Collection
}

func (r *ChallengesRepository) EnsureIndexes(ctx context.Context) error {
	_, err := r.challenges.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "workspace_id", Value: 1}, {Key: "is_active", Value: 1}}},
	})
	if err != nil {
		return err
	}
	_, err = r.completions.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "workspace_id", Value: 1}, {Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "workspace_id", Value: 1}, {Key: "challenge_id", Value: 1}, {Key: "user_id", Value: 1}}},
	})
	return err
}

// ── Challenges ────────────────────────────────────────────────────────────────

func (r *ChallengesRepository) SaveChallenge(c *kudos.Challenge) (*kudos.Challenge, error) {
	doc := challengeDoc{
		WorkspaceID:   c.WorkspaceID,
		Title:         c.Title,
		Description:   c.Description,
		KudoReward:    c.KudoReward,
		ExpiresAt:     c.ExpiresAt,
		IsActive:      true,
		CreatedByID:   c.CreatedByID,
		CreatedByName: c.CreatedByName,
		CreatedAt:     time.Now().UTC(),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := r.challenges.InsertOne(ctx, doc)
	if err != nil {
		return nil, fmt.Errorf("save challenge: %w", err)
	}
	doc.ID = res.InsertedID.(bson.ObjectID)
	return docToChallenge(doc), nil
}

func (r *ChallengesRepository) UpdateChallenge(c *kudos.Challenge) (*kudos.Challenge, error) {
	oid, err := bson.ObjectIDFromHex(c.ID)
	if err != nil {
		return nil, kudos.ErrChallengeNotFound
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.D{{Key: "$set", Value: bson.D{
		{Key: "title", Value: c.Title},
		{Key: "description", Value: c.Description},
		{Key: "kudo_reward", Value: c.KudoReward},
		{Key: "expires_at", Value: c.ExpiresAt},
		{Key: "is_active", Value: c.IsActive},
	}}}
	filter := bson.D{{Key: "_id", Value: oid}, {Key: "workspace_id", Value: c.WorkspaceID}}
	res, err := r.challenges.UpdateOne(ctx, filter, update)
	if err != nil {
		return nil, fmt.Errorf("update challenge: %w", err)
	}
	if res.MatchedCount == 0 {
		return nil, kudos.ErrChallengeNotFound
	}
	return r.GetChallenge(c.WorkspaceID, c.ID)
}

func (r *ChallengesRepository) GetChallenge(workspaceID, id string) (*kudos.Challenge, error) {
	oid, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, kudos.ErrChallengeNotFound
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var doc challengeDoc
	err = r.challenges.FindOne(ctx, bson.D{
		{Key: "_id", Value: oid},
		{Key: "workspace_id", Value: workspaceID},
	}).Decode(&doc)
	if err == mongo.ErrNoDocuments {
		return nil, kudos.ErrChallengeNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get challenge: %w", err)
	}
	return docToChallenge(doc), nil
}

func (r *ChallengesRepository) ListChallenges(workspaceID string, activeOnly bool) ([]kudos.Challenge, error) {
	filter := bson.D{{Key: "workspace_id", Value: workspaceID}}
	if activeOnly {
		filter = append(filter, bson.E{Key: "is_active", Value: true})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	cur, err := r.challenges.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("list challenges: %w", err)
	}
	defer cur.Close(ctx)

	var docs []challengeDoc
	if err := cur.All(ctx, &docs); err != nil {
		return nil, fmt.Errorf("decode challenges: %w", err)
	}
	result := make([]kudos.Challenge, len(docs))
	for i, d := range docs {
		result[i] = *docToChallenge(d)
	}
	return result, nil
}

// ── Completions ───────────────────────────────────────────────────────────────

func (r *ChallengesRepository) SaveCompletion(comp *kudos.ChallengeCompletion) (*kudos.ChallengeCompletion, error) {
	doc := completionDoc{
		ChallengeID:    comp.ChallengeID,
		ChallengeTitle: comp.ChallengeTitle,
		WorkspaceID:    comp.WorkspaceID,
		UserID:         comp.UserID,
		UserName:       comp.UserName,
		Note:           comp.Note,
		Status:         kudos.CompletionPending,
		RequestedAt:    time.Now().UTC(),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := r.completions.InsertOne(ctx, doc)
	if err != nil {
		return nil, fmt.Errorf("save completion: %w", err)
	}
	doc.ID = res.InsertedID.(bson.ObjectID)
	return docToCompletion(doc), nil
}

func (r *ChallengesRepository) GetCompletion(workspaceID, id string) (*kudos.ChallengeCompletion, error) {
	oid, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, kudos.ErrCompletionNotFound
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var doc completionDoc
	err = r.completions.FindOne(ctx, bson.D{
		{Key: "_id", Value: oid},
		{Key: "workspace_id", Value: workspaceID},
	}).Decode(&doc)
	if err == mongo.ErrNoDocuments {
		return nil, kudos.ErrCompletionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get completion: %w", err)
	}
	return docToCompletion(doc), nil
}

func (r *ChallengesRepository) UpdateCompletionStatus(
	workspaceID, id string,
	status kudos.ChallengeStatus,
	reviewerID, reviewerName string,
) (*kudos.ChallengeCompletion, error) {
	oid, err := bson.ObjectIDFromHex(id)
	if err != nil {
		return nil, kudos.ErrCompletionNotFound
	}
	now := time.Now().UTC()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.D{{Key: "$set", Value: bson.D{
		{Key: "status", Value: status},
		{Key: "reviewed_at", Value: now},
		{Key: "reviewed_by_id", Value: reviewerID},
		{Key: "reviewed_by_name", Value: reviewerName},
	}}}
	filter := bson.D{{Key: "_id", Value: oid}, {Key: "workspace_id", Value: workspaceID}}
	res, err := r.completions.UpdateOne(ctx, filter, update)
	if err != nil {
		return nil, fmt.Errorf("update completion: %w", err)
	}
	if res.MatchedCount == 0 {
		return nil, kudos.ErrCompletionNotFound
	}
	return r.GetCompletion(workspaceID, id)
}

func (r *ChallengesRepository) ListCompletions(workspaceID string, status *kudos.ChallengeStatus) ([]kudos.ChallengeCompletion, error) {
	filter := bson.D{{Key: "workspace_id", Value: workspaceID}}
	if status != nil {
		filter = append(filter, bson.E{Key: "status", Value: *status})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().SetSort(bson.D{{Key: "requested_at", Value: -1}})
	cur, err := r.completions.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("list completions: %w", err)
	}
	defer cur.Close(ctx)

	var docs []completionDoc
	if err := cur.All(ctx, &docs); err != nil {
		return nil, fmt.Errorf("decode completions: %w", err)
	}
	result := make([]kudos.ChallengeCompletion, len(docs))
	for i, d := range docs {
		result[i] = *docToCompletion(d)
	}
	return result, nil
}

func (r *ChallengesRepository) HasPendingOrApprovedCompletion(workspaceID, challengeID, userID string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	n, err := r.completions.CountDocuments(ctx, bson.D{
		{Key: "workspace_id", Value: workspaceID},
		{Key: "challenge_id", Value: challengeID},
		{Key: "user_id", Value: userID},
		{Key: "status", Value: bson.D{{Key: "$in", Value: bson.A{
			kudos.CompletionPending, kudos.CompletionApproved,
		}}}},
	})
	return n > 0, err
}
