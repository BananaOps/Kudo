package slack_test

import (
	"errors"
	"testing"

	"github.com/BananaOps/kudo/backend/internal/slack"
)

const (
	author    = "UALICE01"
	recipient = "UBOB0001"
	third     = "UCAROL01"
)

// defaultCfg uses the default ⚡ emoji.
var defaultCfg = slack.ParseConfig{}

func TestParseKudo(t *testing.T) {
	tests := []struct {
		name     string
		authorID string
		text     string
		cfg      slack.ParseConfig
		// expected success fields (ignored when wantErr != nil)
		wantRecipient string
		wantCount     int
		wantMessage   string
		wantErr       error
	}{
		// ── Happy paths ──────────────────────────────────────────────────────
		{
			name:          "single kudo",
			authorID:      author,
			text:          "<@UBOB0001> ⚡ great work on the release!",
			cfg:           defaultCfg,
			wantRecipient: recipient,
			wantCount:     1,
			wantMessage:   "great work on the release!",
		},
		{
			name:          "three kudos in one message",
			authorID:      author,
			text:          "<@UBOB0001> ⚡⚡⚡ absolutely crushed it",
			cfg:           defaultCfg,
			wantRecipient: recipient,
			wantCount:     3,
			wantMessage:   "absolutely crushed it",
		},
		{
			name:          "emoji spread across text",
			authorID:      author,
			text:          "⚡ thank you <@UBOB0001> for the ⚡ help today",
			cfg:           defaultCfg,
			wantRecipient: recipient,
			wantCount:     2,
			wantMessage:   "thank you for the help today",
		},
		{
			name:          "mention with display name",
			authorID:      author,
			text:          "<@UBOB0001|bob> ⚡ nice PR",
			cfg:           defaultCfg,
			wantRecipient: recipient,
			wantCount:     1,
			wantMessage:   "nice PR",
		},
		{
			name:          "custom currency emoji",
			authorID:      author,
			text:          "<@UBOB0001> 🌮 taco time!",
			cfg:           slack.ParseConfig{CurrencyEmoji: "🌮"},
			wantRecipient: recipient,
			wantCount:     1,
			wantMessage:   "taco time!",
		},
		{
			name:          "slack picker shortcode :zap: instead of unicode ⚡",
			authorID:      author,
			text:          "<@UBOB0001> :zap: great work on the release!",
			cfg:           defaultCfg,
			wantRecipient: recipient,
			wantCount:     1,
			wantMessage:   "great work on the release!",
		},
		{
			name:          "mix of unicode and shortcode in same message",
			authorID:      author,
			text:          "<@UBOB0001> ⚡ amazing job :zap:",
			cfg:           defaultCfg,
			wantRecipient: recipient,
			wantCount:     2, // both forms counted
			wantMessage:   "amazing job",
		},
		{
			name:          "three shortcodes via emoji picker",
			authorID:      author,
			text:          "<@UBOB0001> :zap::zap::zap: absolutely crushed it",
			cfg:           defaultCfg,
			wantRecipient: recipient,
			wantCount:     3,
			wantMessage:   "absolutely crushed it",
		},
		{
			name:          "taco shortcode with custom config",
			authorID:      author,
			text:          "<@UBOB0001> :taco: taco time!",
			cfg:           slack.ParseConfig{CurrencyEmoji: "🌮"},
			wantRecipient: recipient,
			wantCount:     1,
			wantMessage:   "taco time!",
		},
		{
			name:          "multiple mentions — first non-self wins",
			authorID:      author,
			text:          "<@UBOB0001> <@UCAROL01> ⚡ both of you rocked the demo",
			cfg:           defaultCfg,
			wantRecipient: recipient, // U_BOB is first
			wantCount:     1,
			wantMessage:   "both of you rocked the demo",
		},
		{
			name: "self mention alongside another user — other user is recipient",
			// Author mentions themselves AND a colleague; the colleague gets the kudo.
			authorID:      author,
			text:          "<@UALICE01> and <@UBOB0001> ⚡ pair-programmed this",
			cfg:           defaultCfg,
			wantRecipient: recipient,
			wantCount:     1,
			wantMessage:   "and pair-programmed this",
		},
		{
			name:          "message text is empty after cleaning",
			authorID:      author,
			text:          "<@UBOB0001> ⚡",
			cfg:           defaultCfg,
			wantRecipient: recipient,
			wantCount:     1,
			wantMessage:   "",
		},

		// ── Error paths ──────────────────────────────────────────────────────
		{
			name:     "no mention at all",
			authorID: author,
			text:     "⚡ great work today",
			cfg:      defaultCfg,
			wantErr:  slack.ErrNoMention,
		},
		{
			name:     "mention present but no emoji",
			authorID: author,
			text:     "<@UBOB0001> well done!",
			cfg:      defaultCfg,
			wantErr:  slack.ErrNoEmoji,
		},
		{
			name:     "self-kudo — only self mention",
			authorID: author,
			text:     "<@UALICE01> ⚡ I did it",
			cfg:      defaultCfg,
			wantErr:  slack.ErrSelfMention,
		},
		{
			name:     "multiple self-mentions, no other user",
			authorID: author,
			text:     "<@UALICE01> <@UALICE01> ⚡ look at me",
			cfg:      defaultCfg,
			wantErr:  slack.ErrSelfMention,
		},
		{
			name:     "empty message",
			authorID: author,
			text:     "",
			cfg:      defaultCfg,
			wantErr:  slack.ErrNoMention,
		},
		{
			name:     "wrong currency emoji — default emoji absent",
			authorID: author,
			text:     "<@UBOB0001> 🌮 great",       // message has taco
			cfg:      defaultCfg,                // but config expects ⚡
			wantErr:  slack.ErrNoEmoji,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := slack.ParseKudo(tc.authorID, tc.text, tc.cfg)

			// ── Error assertion ──────────────────────────────────────────────
			if tc.wantErr != nil {
				if !errors.Is(err, tc.wantErr) {
					t.Errorf("error: want %v, got %v", tc.wantErr, err)
				}
				if got != nil {
					t.Errorf("expected nil result on error, got %+v", got)
				}
				return
			}

			// ── Success assertion ────────────────────────────────────────────
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got == nil {
				t.Fatal("expected non-nil ParseResult")
			}
			if got.RecipientID != tc.wantRecipient {
				t.Errorf("RecipientID: want %q, got %q", tc.wantRecipient, got.RecipientID)
			}
			if got.KudoCount != tc.wantCount {
				t.Errorf("KudoCount: want %d, got %d", tc.wantCount, got.KudoCount)
			}
			if got.Message != tc.wantMessage {
				t.Errorf("Message: want %q, got %q", tc.wantMessage, got.Message)
			}
		})
	}
}

// TestParseKudo_DefaultEmoji checks that an empty ParseConfig falls back to ⚡.
func TestParseKudo_DefaultEmoji(t *testing.T) {
	res, err := slack.ParseKudo(author, "<@UBOB0001> ⚡ implicit default", slack.ParseConfig{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.KudoCount != 1 {
		t.Errorf("want 1, got %d", res.KudoCount)
	}
}

// TestParseKudo_ThirdRecipient verifies the correct recipient is selected
// when the first non-self mention is not the first mention overall.
func TestParseKudo_ThirdRecipient(t *testing.T) {
	// Author is U_BOB; U_ALICE is mentioned first but is the author — U_CAROL wins.
	res, err := slack.ParseKudo(recipient, "<@UBOB0001> <@UCAROL01> ⚡ good catch", defaultCfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.RecipientID != third {
		t.Errorf("want %q, got %q", third, res.RecipientID)
	}
}
