package kudos

import "time"

type Repository interface {
	Save(kudo *Kudo) (*Kudo, error)
	CountGivenToday(workspaceID, fromUserID string, day time.Time) (int, error)
	ListByRecipient(workspaceID, toUserID string) ([]Kudo, error)
	ListBySender(workspaceID, fromUserID string) ([]Kudo, error)
	TopRecipients(workspaceID string, limit int, since *time.Time) ([]LeaderboardEntry, error)
	TopSenders(workspaceID string, limit int, since *time.Time) ([]LeaderboardEntry, error)
	StatsForUser(workspaceID, userID string, dailyQuota int) (*Stats, error)
	ChannelStats(workspaceID string) ([]ChannelStat, error)
	ListUsers(workspaceID string) ([]UserProfile, error)
}
