package config

import (
	"fmt"
	"os"
	"strings"
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

	// Slack OAuth ("Sign in with Slack")
	SlackClientID     string
	SlackClientSecret string

	// Session
	SessionSecret string
	AppURL        string

	// Admin access — comma-separated Slack user IDs
	AdminUserIDs []string
}

// SecureCookies returns true when the app is served over HTTPS.
func (c *Config) SecureCookies() bool {
	return strings.HasPrefix(c.AppURL, "https://")
}

// CallbackURL returns the full OAuth redirect URI.
func (c *Config) CallbackURL() string {
	return c.AppURL + "/auth/slack/callback"
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
		SlackClientID:      getEnv("SLACK_CLIENT_ID", ""),
		SlackClientSecret:  getEnv("SLACK_CLIENT_SECRET", ""),
		SessionSecret:      getEnv("SESSION_SECRET", "dev-secret-change-in-production"),
		AppURL:             getEnv("APP_URL", "http://localhost:8080"),
		AdminUserIDs:       parseList(getEnv("ADMIN_USER_IDS", "")),
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

// parseList splits a comma-separated string into trimmed, non-empty entries.
func parseList(s string) []string {
	var out []string
	for _, part := range strings.Split(s, ",") {
		if t := strings.TrimSpace(part); t != "" {
			out = append(out, t)
		}
	}
	return out
}

// IsAdmin returns true when the given user ID is in the admin list.
// When no admin IDs are configured, everyone is considered admin (dev mode).
func (c *Config) IsAdmin(userID string) bool {
	if len(c.AdminUserIDs) == 0 {
		return true
	}
	for _, id := range c.AdminUserIDs {
		if id == userID {
			return true
		}
	}
	return false
}
