package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port               string
	MongoURI           string
	MongoDB            string
	SlackSigningSecret string
	SlackBotToken      string
	DefaultWorkspaceID string
	DefaultUserID      string
	DefaultUserName    string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		MongoURI:           getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		MongoDB:            getEnv("MONGODB_DB", "kudo"),
		SlackSigningSecret: getEnv("SLACK_SIGNING_SECRET", ""),
		SlackBotToken:      getEnv("SLACK_BOT_TOKEN", ""),
		DefaultWorkspaceID: getEnv("DEFAULT_WORKSPACE_ID", ""),
		DefaultUserID:      getEnv("DEFAULT_USER_ID", "U001"),
		DefaultUserName:    getEnv("DEFAULT_USER_NAME", "Alex"),
	}

	if cfg.SlackSigningSecret == "" {
		return nil, fmt.Errorf("SLACK_SIGNING_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
