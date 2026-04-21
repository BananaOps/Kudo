package slack

import (
	"errors"
	"regexp"
	"strings"
)

// mentionRe matches a Slack user mention in its two forms:
//   - <@U12345>          (ID only)
//   - <@U12345|username> (ID + display name, sent in some API payloads)
var mentionRe = regexp.MustCompile(`<@([A-Z0-9]+)(?:\|[^>]*)?>`)

// Sentinel errors returned by ParseKudo.
var (
	ErrNoMention   = errors.New("message contains no user mention")
	ErrNoEmoji     = errors.New("message contains no currency emoji")
	ErrSelfMention = errors.New("cannot give a kudo to yourself")
)

// emojiToShortcode maps common Unicode emoji characters to their Slack
// shortcode equivalents (e.g. ":zap:"). Slack sends the shortcode form when
// the user picks an emoji from the picker; the raw character when typed directly.
// Both forms must be detected so that kudos are counted regardless of input method.
var emojiToShortcode = map[string]string{
	"⚡": ":zap:",
	"🌮": ":taco:",
	"🎉": ":tada:",
	"💪": ":muscle:",
	"❤️": ":heart:",
	"🙏": ":pray:",
	"⭐": ":star:",
	"🔥": ":fire:",
	"👏": ":clap:",
	"🚀": ":rocket:",
}

// emojiPatterns returns all string forms to search for a given emoji:
// the raw Unicode character plus its Slack :shortcode: if known.
func emojiPatterns(emoji string) []string {
	patterns := []string{emoji}
	if shortcode, ok := emojiToShortcode[emoji]; ok {
		patterns = append(patterns, shortcode)
	}
	return patterns
}

// ParseConfig controls how kudos are detected inside a Slack message.
type ParseConfig struct {
	// CurrencyEmoji is the emoji that counts as one kudo unit.
	// Accepts the Unicode character (e.g. "⚡") or a Slack shortcode (e.g. ":zap:").
	// Falls back to "⚡" when empty.
	CurrencyEmoji string
}

// ParseResult is the structured output of a successful ParseKudo call.
type ParseResult struct {
	RecipientID string
	KudoCount   int
	// Message is the recognition text with mentions and emoji stripped.
	Message string
}

// ParseKudo inspects a raw Slack message text and extracts kudo intent.
//
// Slack sends emoji in two forms depending on the client:
//   - Unicode character: user typed ⚡ directly on the keyboard.
//   - Slack shortcode:   user picked from the emoji picker → Slack sends :zap:
//
// Both forms are detected. The count is the sum across all matching patterns.
func ParseKudo(authorID, text string, cfg ParseConfig) (*ParseResult, error) {
	emoji := cfg.CurrencyEmoji
	if emoji == "" {
		emoji = "⚡"
	}

	patterns := emojiPatterns(emoji)

	// ── 1. Find all user mentions ────────────────────────────────────────────
	allMatches := mentionRe.FindAllStringSubmatch(text, -1)
	if len(allMatches) == 0 {
		return nil, ErrNoMention
	}

	// ── 2. Pick the first non-self mention as the recipient ──────────────────
	recipientID := ""
	for _, m := range allMatches {
		if m[1] != authorID {
			recipientID = m[1]
			break
		}
	}
	if recipientID == "" {
		return nil, ErrSelfMention
	}

	// ── 3. Count emoji — sum across all patterns (Unicode + shortcode) ────────
	kudoCount := 0
	for _, p := range patterns {
		kudoCount += strings.Count(text, p)
	}
	if kudoCount == 0 {
		return nil, ErrNoEmoji
	}

	// ── 4. Build cleaned message ─────────────────────────────────────────────
	cleaned := mentionRe.ReplaceAllString(text, "")
	for _, p := range patterns {
		cleaned = strings.ReplaceAll(cleaned, p, "")
	}
	cleaned = strings.Join(strings.Fields(cleaned), " ")

	return &ParseResult{
		RecipientID: recipientID,
		KudoCount:   kudoCount,
		Message:     cleaned,
	}, nil
}
