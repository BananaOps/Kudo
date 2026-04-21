package mongo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"github.com/BananaOps/kudo/backend/internal/workspace"
)

type workspaceDoc struct {
	ID               string `bson:"_id"`
	Name             string `bson:"name"`
	BotToken         string `bson:"bot_token"`
	DailyQuota       int    `bson:"daily_quota"`
	KudoEmoji        string `bson:"kudo_emoji"`
	CurrencySingular string `bson:"currency_singular"`
	CurrencyPlural   string `bson:"currency_plural"`
	InstalledAt      string `bson:"installed_at"`
}

func docToWorkspace(d workspaceDoc) *workspace.Workspace {
	return &workspace.Workspace{
		ID:               d.ID,
		Name:             d.Name,
		BotToken:         d.BotToken,
		DailyQuota:       d.DailyQuota,
		KudoEmoji:        d.KudoEmoji,
		CurrencySingular: d.CurrencySingular,
		CurrencyPlural:   d.CurrencyPlural,
		InstalledAt:      d.InstalledAt,
	}
}

type WorkspaceRepository struct {
	col *mongo.Collection
}

func (r *WorkspaceRepository) GetByID(id string) (*workspace.Workspace, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var doc workspaceDoc
	err := r.col.FindOne(ctx, bson.D{{Key: "_id", Value: id}}).Decode(&doc)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, workspace.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("workspace get: %w", err)
	}
	return docToWorkspace(doc), nil
}

func (r *WorkspaceRepository) Upsert(ws *workspace.Workspace) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	doc := workspaceDoc{
		ID:               ws.ID,
		Name:             ws.Name,
		BotToken:         ws.BotToken,
		DailyQuota:       ws.DailyQuota,
		KudoEmoji:        ws.KudoEmoji,
		CurrencySingular: ws.CurrencySingular,
		CurrencyPlural:   ws.CurrencyPlural,
		InstalledAt:      ws.InstalledAt,
	}

	filter := bson.D{{Key: "_id", Value: ws.ID}}
	update := bson.D{{Key: "$set", Value: doc}}
	opts := options.UpdateOne().SetUpsert(true)

	if _, err := r.col.UpdateOne(ctx, filter, update, opts); err != nil {
		return fmt.Errorf("workspace upsert: %w", err)
	}
	return nil
}
