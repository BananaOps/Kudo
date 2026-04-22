package kudos_test

import (
	"errors"
	"testing"
	"time"

	"github.com/BananaOps/kudo/backend/internal/kudos"
)

type stubRepo struct {
	givenToday int
	err        error
}

func (s *stubRepo) CountGivenToday(_, _ string, _ time.Time) (int, error) {
	return s.givenToday, s.err
}

func (s *stubRepo) Save(_ *kudos.Kudo) (*kudos.Kudo, error)           { panic("not implemented") }
func (s *stubRepo) ListByRecipient(_, _ string) ([]kudos.Kudo, error) { panic("not implemented") }
func (s *stubRepo) ListBySender(_, _ string) ([]kudos.Kudo, error)    { panic("not implemented") }
func (s *stubRepo) TopRecipients(_ string, _ int, _ *time.Time) ([]kudos.LeaderboardEntry, error) {
	panic("not implemented")
}
func (s *stubRepo) TopSenders(_ string, _ int, _ *time.Time) ([]kudos.LeaderboardEntry, error) {
	panic("not implemented")
}
func (s *stubRepo) StatsForUser(_, _ string, _ int) (*kudos.Stats, error) {
	panic("not implemented")
}
func (s *stubRepo) ChannelStats(_ string) ([]kudos.ChannelStat, error) {
	panic("not implemented")
}
func (s *stubRepo) ListUsers(_ string) ([]kudos.UserProfile, error) { panic("not implemented") }

func TestCheckQuota(t *testing.T) {
	today := time.Date(2024, 1, 15, 9, 0, 0, 0, time.UTC)

	tests := []struct {
		name       string
		daily      int
		givenToday int
		repoErr    error
		wantErr    error
	}{
		{name: "below quota", daily: 5, givenToday: 2, wantErr: nil},
		{name: "one below quota", daily: 5, givenToday: 4, wantErr: nil},
		{name: "exactly at quota", daily: 5, givenToday: 5, wantErr: kudos.ErrQuotaExceeded},
		{name: "above quota", daily: 5, givenToday: 9, wantErr: kudos.ErrQuotaExceeded},
		{name: "zero given", daily: 5, givenToday: 0, wantErr: nil},
		{name: "unlimited quota skips repo", daily: 0, givenToday: 999, wantErr: nil},
		{name: "negative quota treated as unlimited", daily: -1, givenToday: 999, wantErr: nil},
		{
			name:       "repo error is propagated",
			daily:      5,
			givenToday: 0,
			repoErr:    errors.New("db connection lost"),
			wantErr:    errors.New("db connection lost"),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			repo := &stubRepo{givenToday: tc.givenToday, err: tc.repoErr}
			cfg := kudos.QuotaConfig{Daily: tc.daily}

			err := kudos.CheckQuota(repo, cfg, "W_acme", "U_alice", today)

			switch {
			case tc.repoErr != nil:
				if err == nil {
					t.Fatal("expected wrapped repo error, got nil")
				}
				if !errors.Is(err, tc.repoErr) {
					t.Errorf("want repo error wrapped, got: %v", err)
				}
			case tc.wantErr != nil:
				if !errors.Is(err, tc.wantErr) {
					t.Errorf("want %v, got %v", tc.wantErr, err)
				}
			default:
				if err != nil {
					t.Errorf("want nil error, got %v", err)
				}
			}
		})
	}
}

func TestRemainingToday(t *testing.T) {
	today := time.Date(2024, 1, 15, 9, 0, 0, 0, time.UTC)

	tests := []struct {
		name          string
		daily         int
		givenToday    int
		repoErr       error
		wantRemaining int
		wantErr       bool
	}{
		{name: "none given", daily: 5, givenToday: 0, wantRemaining: 5},
		{name: "some given", daily: 5, givenToday: 3, wantRemaining: 2},
		{name: "all used", daily: 5, givenToday: 5, wantRemaining: 0},
		{name: "over limit clamps to zero", daily: 5, givenToday: 7, wantRemaining: 0},
		{name: "unlimited returns -1", daily: 0, givenToday: 0, wantRemaining: -1},
		{name: "repo error", daily: 5, repoErr: errors.New("db down"), wantErr: true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			repo := &stubRepo{givenToday: tc.givenToday, err: tc.repoErr}
			cfg := kudos.QuotaConfig{Daily: tc.daily}

			got, err := kudos.RemainingToday(repo, cfg, "W_acme", "U_alice", today)

			if tc.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tc.wantRemaining {
				t.Errorf("remaining: want %d, got %d", tc.wantRemaining, got)
			}
		})
	}
}

