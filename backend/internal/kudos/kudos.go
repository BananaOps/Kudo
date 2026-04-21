package kudos

import (
	"errors"
	"time"
)

var ErrSelfKudo = errors.New("cannot give a kudo to yourself")
var ErrQuotaExceeded = errors.New("daily kudo quota exceeded")

type Kudo struct {
	ID           string    `json:"id"`
	WorkspaceID  string    `json:"workspaceId"`
	FromUserID   string    `json:"fromUserId"`
	FromUserName string    `json:"fromUserName"`
	ToUserID     string    `json:"toUserId"`
	ToUserName   string    `json:"toUserName"`
	Message      string    `json:"message"`
	Channel      string    `json:"channel"`
	EmojiCount   int       `json:"kudosCount"`
	CreatedAt    time.Time `json:"createdAt"`
}

type LeaderboardEntry struct {
	Rank        int    `json:"rank"`
	UserID      string `json:"userId"`
	UserName    string `json:"name"`
	WorkspaceID string `json:"workspaceId"`
	Total       int    `json:"kudosCount"`
}

// UserProfile is a lightweight user summary derived from kudo history.
type UserProfile struct {
	UserID   string `json:"userId"`
	UserName string `json:"name"`
}

type Stats struct {
	ReceivedThisWeek  int `json:"receivedThisWeek"`
	ReceivedThisMonth int `json:"receivedThisMonth"`
	GivenThisWeek     int `json:"givenThisWeek"`
	GivenThisMonth    int `json:"givenThisMonth"`
	Streak            int `json:"streak"`
	QuotaRemaining    int `json:"quotaRemaining"`
}

type ChannelStat struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

type Service interface {
	Give(workspaceID, fromUserID, fromUserName, toUserID, toUserName, message, channel string, emojiCount int) (*Kudo, error)
	Leaderboard(workspaceID string, limit int, since *time.Time) ([]LeaderboardEntry, error)
	Received(workspaceID, userID string) ([]Kudo, error)
	Given(workspaceID, userID string) ([]Kudo, error)
}
