// Package slack handles incoming Slack events and slash commands.
package slack

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/BananaOps/kudo/backend/internal/kudos"
	"github.com/BananaOps/kudo/backend/internal/workspace"
)

// Handler handles Slack Events API and slash commands.
type Handler struct {
	kudos         kudos.Repository
	workspaces    workspace.Service
	signingSecret string
	botToken      string
	wsID          string // default workspace ID
}

// NewHandler creates a Handler with the given dependencies.
func NewHandler(
	kudosRepo kudos.Repository,
	workspaceRepo workspace.Service,
	signingSecret, botToken, wsID string,
) *Handler {
	return &Handler{
		kudos:         kudosRepo,
		workspaces:    workspaceRepo,
		signingSecret: signingSecret,
		botToken:      botToken,
		wsID:          wsID,
	}
}

// ── Slack Events API payload types ───────────────────────────────────────────

type eventPayload struct {
	Type      string       `json:"type"`
	Challenge string       `json:"challenge"`
	TeamID    string       `json:"team_id"`
	EventID   string       `json:"event_id"`
	Event     messageEvent `json:"event"`
}

type messageEvent struct {
	Type        string `json:"type"`
	Subtype     string `json:"subtype"`   // "message_changed", "bot_message", etc.
	Channel     string `json:"channel"`   // Slack channel ID, e.g. "C12345"
	User        string `json:"user"`      // Slack user ID of the sender
	Text        string `json:"text"`
	BotID       string `json:"bot_id"`    // non-empty for bot messages — skip these
	ChannelName string `json:"channel_name"` // populated in some payloads
}

// HandleEvent handles POST /slack/events.
func (h *Handler) HandleEvent(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20)) // 1 MB limit
	if err != nil {
		http.Error(w, "read error", http.StatusBadRequest)
		return
	}

	if err := h.verifySignature(r, body); err != nil {
		slog.Warn("slack signature verification failed", "err", err)
		http.Error(w, "invalid signature", http.StatusUnauthorized)
		return
	}

	var payload eventPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	// Slack URL verification (called once when registering the endpoint).
	if payload.Type == "url_verification" {
		w.Header().Set("Content-Type", "text/plain")
		_, _ = w.Write([]byte(payload.Challenge))
		return
	}

	// Respond immediately — Slack requires a 200 within 3 seconds.
	w.WriteHeader(http.StatusOK)

	if payload.Type != "event_callback" {
		return
	}

	go h.processMessageEvent(payload)
}

// processMessageEvent runs in a goroutine after the 200 is sent.
func (h *Handler) processMessageEvent(payload eventPayload) {
	ev := payload.Event
	slog.Info("slack processing event",
		"event_type", ev.Type,
		"subtype", ev.Subtype,
		"user", ev.User,
		"bot_id", ev.BotID,
		"channel", ev.Channel,
		"text", ev.Text,
	)

	if ev.Type != "message" {
		slog.Info("slack event skipped: not a message", "event_type", ev.Type)
		return
	}
	// Skip bot messages and edited/deleted subtypes.
	if ev.BotID != "" || ev.Subtype != "" {
		slog.Info("slack event skipped", "bot_id", ev.BotID, "subtype", ev.Subtype)
		return
	}

	wsID := payload.TeamID
	if wsID == "" {
		wsID = h.wsID
	}

	// Load the workspace emoji setting.
	emoji := "⚡"
	ws, err := h.workspaces.GetByID(wsID)
	if err == nil && ws.KudoEmoji != "" {
		emoji = ws.KudoEmoji
	}

	result, err := ParseKudo(ev.User, ev.Text, ParseConfig{CurrencyEmoji: emoji})
	if err != nil {
		slog.Info("slack message is not a kudo", "reason", err.Error(), "text", ev.Text)
		return
	}

	// Resolve display names via Slack API when the bot token is available.
	fromName := h.resolveUserName(ev.User)
	toName := h.resolveUserName(result.RecipientID)

	// Resolve channel name.
	channelName := ev.ChannelName
	if channelName == "" {
		channelName = h.resolveChannelName(ev.Channel)
	}

	kudo := &kudos.Kudo{
		WorkspaceID:  wsID,
		FromUserID:   ev.User,
		FromUserName: fromName,
		ToUserID:     result.RecipientID,
		ToUserName:   toName,
		Message:      result.Message,
		Channel:      channelName,
		EmojiCount:   result.KudoCount,
	}

	saved, err := h.kudos.Save(kudo)
	if err != nil {
		slog.Error("save kudo failed", "err", err)
		return
	}

	slog.Info("kudo saved",
		"id", saved.ID,
		"from", fromName,
		"to", toName,
		"count", result.KudoCount,
		"channel", channelName,
	)
}

// HandleCommand handles POST /slack/commands.
func (h *Handler) HandleCommand(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		http.Error(w, "read error", http.StatusBadRequest)
		return
	}
	r.Body = io.NopCloser(bytes.NewReader(body))

	if err := h.verifySignature(r, body); err != nil {
		slog.Warn("slack signature verification failed", "err", err)
		http.Error(w, "invalid signature", http.StatusUnauthorized)
		return
	}

	if err := r.ParseForm(); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	command  := r.FormValue("command")
	text     := strings.TrimSpace(r.FormValue("text"))
	userID   := r.FormValue("user_id")
	teamID   := r.FormValue("team_id")
	channel  := r.FormValue("channel_name")

	if teamID == "" {
		teamID = h.wsID
	}

	slog.Info("slash command received", "command", command, "user", userID, "text", text)

	w.Header().Set("Content-Type", "application/json")

	switch command {
	case "/kudo":
		h.handleKudoCommand(w, teamID, userID, channel, text)
	case "/leaderboard":
		h.handleLeaderboardCommand(w, teamID, text)
	default:
		slackReply(w, "ephemeral", "Commande inconnue : "+command)
	}
}

// handleKudoCommand implements /kudo @user [message].
func (h *Handler) handleKudoCommand(w http.ResponseWriter, wsID, fromUserID, channel, text string) {
	if text == "" {
		slackReply(w, "ephemeral",
			"*Usage :* `/kudo @collègue super boulot !`\nMentionnez un collègue suivi de votre message.")
		return
	}

	// Load workspace emoji config.
	emoji := "⚡"
	ws, err := h.workspaces.GetByID(wsID)
	if err == nil && ws.KudoEmoji != "" {
		emoji = ws.KudoEmoji
	}

	// Slash-command text may not contain the currency emoji — add one
	// so ParseKudo can find it, unless the user already included some.
	patterns := emojiPatterns(emoji)
	hasEmoji := false
	for _, p := range patterns {
		if strings.Contains(text, p) {
			hasEmoji = true
			break
		}
	}
	parseText := text
	if !hasEmoji {
		parseText = emoji + " " + text
	}

	result, err := ParseKudo(fromUserID, parseText, ParseConfig{CurrencyEmoji: emoji})
	if err != nil {
		switch {
		case errors.Is(err, ErrNoMention):
			slackReply(w, "ephemeral", "Mentionnez un collègue avec `@nom` dans votre message.")
		case errors.Is(err, ErrSelfMention):
			slackReply(w, "ephemeral", "Vous ne pouvez pas vous envoyer un spark à vous-même 😅")
		default:
			slackReply(w, "ephemeral", "Impossible de traiter la commande : "+err.Error())
		}
		return
	}

	// Quota check.
	dailyQuota := 5
	if ws != nil && ws.DailyQuota > 0 {
		dailyQuota = ws.DailyQuota
	}
	if err := kudos.CheckQuota(h.kudos, kudos.QuotaConfig{Daily: dailyQuota}, wsID, fromUserID, time.Now().UTC()); err != nil {
		if errors.Is(err, kudos.ErrQuotaExceeded) {
			slackReply(w, "ephemeral", "⛔ Quota journalier atteint — revenez demain !")
			return
		}
		slackReply(w, "ephemeral", "Erreur interne. Réessayez.")
		return
	}

	fromName := h.resolveUserName(fromUserID)
	toName   := h.resolveUserName(result.RecipientID)

	kudo := &kudos.Kudo{
		WorkspaceID:  wsID,
		FromUserID:   fromUserID,
		FromUserName: fromName,
		ToUserID:     result.RecipientID,
		ToUserName:   toName,
		Message:      result.Message,
		Channel:      channel,
		EmojiCount:   result.KudoCount,
		CreatedAt:    time.Now().UTC(),
	}

	saved, err := h.kudos.Save(kudo)
	if err != nil {
		slog.Error("slash /kudo save failed", "err", err)
		slackReply(w, "ephemeral", "Erreur lors de l'enregistrement. Réessayez.")
		return
	}

	slog.Info("kudo saved via slash command", "id", saved.ID, "from", fromName, "to", toName)

	sparks := strings.Repeat(emoji, result.KudoCount)
	msg := fmt.Sprintf("%s *%s* → *<@%s>* %s\n_%s_",
		sparks, fromName, result.RecipientID, sparks, result.Message)
	slackReply(w, "in_channel", msg)
}

// handleLeaderboardCommand implements /leaderboard [week|month|all].
func (h *Handler) handleLeaderboardCommand(w http.ResponseWriter, wsID, text string) {
	period := strings.ToLower(strings.TrimSpace(text))
	if period == "" {
		period = "week"
	}

	var since *time.Time
	now := time.Now().UTC()
	label := ""
	switch period {
	case "week":
		t := weekStartCmd(now)
		since = &t
		label = "cette semaine"
	case "month":
		t := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		since = &t
		label = "ce mois"
	case "all":
		since = nil
		label = "de tous les temps"
	default:
		slackReply(w, "ephemeral", "Usage : `/leaderboard [week|month|all]`")
		return
	}

	entries, err := h.kudos.TopRecipients(wsID, 10, since)
	if err != nil {
		slackReply(w, "ephemeral", "Impossible de charger le leaderboard.")
		return
	}

	if len(entries) == 0 {
		slackReply(w, "ephemeral", "Aucun kudo enregistré "+label+".")
		return
	}

	medals := []string{"🥇", "🥈", "🥉"}
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("*⚡ Top sparks reçus — %s*\n", label))
	for i, e := range entries {
		medal := ""
		if i < len(medals) {
			medal = medals[i] + " "
		} else {
			medal = fmt.Sprintf("%2d. ", e.Rank)
		}
		sb.WriteString(fmt.Sprintf("%s*%s* — %d ⚡\n", medal, e.UserName, e.Total))
	}

	slackReply(w, "ephemeral", sb.String())
}

// slackReply writes a simple Slack slash-command response.
func slackReply(w http.ResponseWriter, responseType, text string) {
	_ = json.NewEncoder(w).Encode(map[string]string{
		"response_type": responseType,
		"text":          text,
	})
}

func weekStartCmd(t time.Time) time.Time {
	weekday := int(t.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	return time.Date(t.Year(), t.Month(), t.Day()-weekday+1, 0, 0, 0, 0, time.UTC)
}

// ── Slack signature verification ─────────────────────────────────────────────

func (h *Handler) verifySignature(r *http.Request, body []byte) error {
	if h.signingSecret == "" {
		return nil // no secret configured — skip in dev
	}

	tsStr := r.Header.Get("X-Slack-Request-Timestamp")
	if tsStr == "" {
		return errors.New("missing X-Slack-Request-Timestamp")
	}

	ts, err := strconv.ParseInt(tsStr, 10, 64)
	if err != nil {
		return fmt.Errorf("invalid timestamp: %w", err)
	}

	// Reject requests older than 5 minutes to prevent replay attacks.
	if time.Since(time.Unix(ts, 0)).Abs() > 5*time.Minute {
		return errors.New("timestamp too old")
	}

	sigBase := fmt.Sprintf("v0:%s:%s", tsStr, body)
	mac := hmac.New(sha256.New, []byte(h.signingSecret))
	mac.Write([]byte(sigBase))
	computed := "v0=" + hex.EncodeToString(mac.Sum(nil))

	provided := r.Header.Get("X-Slack-Signature")
	if !hmac.Equal([]byte(computed), []byte(provided)) {
		return errors.New("signature mismatch")
	}
	return nil
}

// ── Slack API helpers ─────────────────────────────────────────────────────────

// resolveUserName calls users.info to get the display name for a Slack user ID.
// Falls back to the raw ID if the call fails or no bot token is configured.
func (h *Handler) resolveUserName(userID string) string {
	if h.botToken == "" {
		return userID
	}

	req, _ := http.NewRequest(http.MethodGet,
		"https://slack.com/api/users.info?user="+userID, nil)
	req.Header.Set("Authorization", "Bearer "+h.botToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return userID
	}
	defer resp.Body.Close()

	var result struct {
		OK   bool `json:"ok"`
		User struct {
			Profile struct {
				DisplayName string `json:"display_name"`
				RealName    string `json:"real_name"`
			} `json:"profile"`
		} `json:"user"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil || !result.OK {
		return userID
	}

	if name := result.User.Profile.DisplayName; name != "" {
		return name
	}
	if name := result.User.Profile.RealName; name != "" {
		return name
	}
	return userID
}

// resolveChannelName calls conversations.info to get the channel name.
// Falls back to the raw channel ID (without the leading "C") if it fails.
func (h *Handler) resolveChannelName(channelID string) string {
	if h.botToken == "" {
		// Strip the leading letter (e.g. "C" or "G") to get a readable-ish fallback.
		return strings.ToLower(channelID)
	}

	req, _ := http.NewRequest(http.MethodGet,
		"https://slack.com/api/conversations.info?channel="+channelID, nil)
	req.Header.Set("Authorization", "Bearer "+h.botToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return channelID
	}
	defer resp.Body.Close()

	var result struct {
		OK      bool `json:"ok"`
		Channel struct {
			Name string `json:"name"`
		} `json:"channel"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil || !result.OK {
		return channelID
	}
	return result.Channel.Name
}
