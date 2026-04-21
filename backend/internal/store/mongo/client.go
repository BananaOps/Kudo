// Package mongo provides MongoDB implementations of the kudos domain repositories.
package mongo

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const (
	ColKudos      = "kudos"
	ColWorkspaces = "workspaces"
)

// Client wraps a connected mongo.Client and exposes typed collection accessors.
type Client struct {
	client *mongo.Client
	db     *mongo.Database
}

// Connect dials MongoDB, pings it to confirm the connection, and returns a Client.
// The caller must defer Client.Disconnect.
func Connect(ctx context.Context, uri, dbName string) (*Client, error) {
	opts := options.Client().ApplyURI(uri)

	client, err := mongo.Connect(opts)
	if err != nil {
		return nil, fmt.Errorf("mongo connect: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := client.Ping(pingCtx, nil); err != nil {
		return nil, fmt.Errorf("mongo ping: %w", err)
	}

	return &Client{client: client, db: client.Database(dbName)}, nil
}

// Disconnect closes the underlying connection pool.
func (c *Client) Disconnect(ctx context.Context) error {
	return c.client.Disconnect(ctx)
}

// KudosRepo returns a KudosRepository backed by the kudos collection.
func (c *Client) KudosRepo() *KudosRepository {
	return &KudosRepository{col: c.db.Collection(ColKudos)}
}

// WorkspaceRepo returns a WorkspaceRepository backed by the workspaces collection.
func (c *Client) WorkspaceRepo() *WorkspaceRepository {
	return &WorkspaceRepository{col: c.db.Collection(ColWorkspaces)}
}
