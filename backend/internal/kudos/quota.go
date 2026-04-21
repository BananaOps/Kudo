package kudos

import (
	"fmt"
	"time"
)

// QuotaConfig holds the quota settings for a workspace.
// It is intentionally decoupled from workspace.Workspace so that the kudos
// package does not import the workspace package (no circular dependency).
type QuotaConfig struct {
	// Daily is the maximum number of kudos a user may give per calendar day.
	// A value ≤ 0 is treated as unlimited.
	Daily int
}

// CheckQuota verifies that fromUserID can still give at least one kudo in
// workspaceID on the given day, according to cfg.
//
// It returns ErrQuotaExceeded when the sender has reached or surpassed the
// daily limit. Any repository error is returned as-is.
func CheckQuota(repo Repository, cfg QuotaConfig, workspaceID, fromUserID string, day time.Time) error {
	if cfg.Daily <= 0 {
		// Unlimited workspace — skip the DB round-trip.
		return nil
	}

	given, err := repo.CountGivenToday(workspaceID, fromUserID, day)
	if err != nil {
		return fmt.Errorf("quota check: %w", err)
	}

	if given >= cfg.Daily {
		return ErrQuotaExceeded
	}

	return nil
}

// RemainingToday returns how many kudos fromUserID can still give today.
// It never returns a negative value.
func RemainingToday(repo Repository, cfg QuotaConfig, workspaceID, fromUserID string, day time.Time) (int, error) {
	if cfg.Daily <= 0 {
		// Sentinel value: -1 means unlimited.
		return -1, nil
	}

	given, err := repo.CountGivenToday(workspaceID, fromUserID, day)
	if err != nil {
		return 0, fmt.Errorf("remaining quota: %w", err)
	}

	remaining := cfg.Daily - given
	if remaining < 0 {
		remaining = 0
	}
	return remaining, nil
}
