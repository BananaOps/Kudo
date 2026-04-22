package kudos

import (
	"errors"
	"time"
)

var ErrChallengeNotFound = errors.New("challenge not found")
var ErrAlreadyClaimed = errors.New("challenge already claimed by this user")
var ErrChallengeExpired = errors.New("challenge has expired")
var ErrCompletionNotFound = errors.New("completion request not found")

type ChallengeStatus string

const (
	CompletionPending  ChallengeStatus = "pending"
	CompletionApproved ChallengeStatus = "approved"
	CompletionRejected ChallengeStatus = "rejected"
)

// Challenge is a goal admins publish. Users claim it when done; admins validate.
type Challenge struct {
	ID            string     `json:"id"`
	WorkspaceID   string     `json:"workspaceId"`
	Title         string     `json:"title"`
	Description   string     `json:"description"`
	KudoReward    int        `json:"kudoReward"`
	ExpiresAt     *time.Time `json:"expiresAt,omitempty"`
	IsActive      bool       `json:"isActive"`
	CreatedByID   string     `json:"createdById"`
	CreatedByName string     `json:"createdByName"`
	CreatedAt     time.Time  `json:"createdAt"`
}

// IsExpired returns true when the challenge has a deadline that has passed.
func (c *Challenge) IsExpired() bool {
	return c.ExpiresAt != nil && time.Now().UTC().After(*c.ExpiresAt)
}

// ChallengeCompletion is a user's request to have a challenge validated.
type ChallengeCompletion struct {
	ID              string          `json:"id"`
	ChallengeID     string          `json:"challengeId"`
	ChallengeTitle  string          `json:"challengeTitle"`
	WorkspaceID     string          `json:"workspaceId"`
	UserID          string          `json:"userId"`
	UserName        string          `json:"userName"`
	Note            string          `json:"note"`
	Status          ChallengeStatus `json:"status"`
	RequestedAt     time.Time       `json:"requestedAt"`
	ReviewedAt      *time.Time      `json:"reviewedAt,omitempty"`
	ReviewedByID    string          `json:"reviewedById,omitempty"`
	ReviewedByName  string          `json:"reviewedByName,omitempty"`
}

// ChallengeRepository persists challenges and completions.
type ChallengeRepository interface {
	// Challenges
	SaveChallenge(c *Challenge) (*Challenge, error)
	UpdateChallenge(c *Challenge) (*Challenge, error)
	GetChallenge(workspaceID, id string) (*Challenge, error)
	ListChallenges(workspaceID string, activeOnly bool) ([]Challenge, error)

	// Completions
	SaveCompletion(comp *ChallengeCompletion) (*ChallengeCompletion, error)
	GetCompletion(workspaceID, id string) (*ChallengeCompletion, error)
	UpdateCompletionStatus(workspaceID, id string, status ChallengeStatus, reviewerID, reviewerName string) (*ChallengeCompletion, error)
	ListCompletions(workspaceID string, status *ChallengeStatus) ([]ChallengeCompletion, error)
	HasPendingOrApprovedCompletion(workspaceID, challengeID, userID string) (bool, error)
}
