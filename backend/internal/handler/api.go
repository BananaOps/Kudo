package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/BananaOps/kudo/backend/internal/kudos"
	"github.com/BananaOps/kudo/backend/internal/workspace"
)

// resolveUserID returns the user ID from the ?userId= query param, falling back to the default.
func (h *Handler) resolveUserID(r *http.Request) string {
	if uid := r.URL.Query().Get("userId"); uid != "" {
		return uid
	}
	return h.userID
}

// GetHome handles GET /api/home?userId=<id>.
func (h *Handler) GetHome(w http.ResponseWriter, r *http.Request) {
	userID := h.resolveUserID(r)

	ws, err := h.workspaces.GetByID(h.wsID)
	if err != nil && !errors.Is(err, workspace.ErrNotFound) {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "workspace error"})
		return
	}

	dailyQuota := 5
	if ws != nil && ws.DailyQuota > 0 {
		dailyQuota = ws.DailyQuota
	}

	stats, err := h.kudos.StatsForUser(h.wsID, userID, dailyQuota)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "stats error"})
		return
	}

	received, err := h.kudos.ListByRecipient(h.wsID, userID)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "kudos error"})
		return
	}

	recent := received
	if len(recent) > 5 {
		recent = recent[:5]
	}

	startOfWeek := weekStart(time.Now().UTC())
	topUsers, err := h.kudos.TopRecipients(h.wsID, 4, &startOfWeek)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "leaderboard error"})
		return
	}

	channelStats, err := h.kudos.ChannelStats(h.wsID)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "channel stats error"})
		return
	}

	JSON(w, http.StatusOK, map[string]any{
		"stats":        stats,
		"recentKudos":  recent,
		"topUsers":     topUsers,
		"channelStats": channelStats,
	})
}

// GetMyKudos handles GET /api/me/kudos?userId=<id>.
func (h *Handler) GetMyKudos(w http.ResponseWriter, r *http.Request) {
	userID := h.resolveUserID(r)

	ws, err := h.workspaces.GetByID(h.wsID)
	if err != nil && !errors.Is(err, workspace.ErrNotFound) {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "workspace error"})
		return
	}

	dailyQuota := 5
	if ws != nil && ws.DailyQuota > 0 {
		dailyQuota = ws.DailyQuota
	}

	received, err := h.kudos.ListByRecipient(h.wsID, userID)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "fetch received"})
		return
	}

	given, err := h.kudos.ListBySender(h.wsID, userID)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "fetch given"})
		return
	}

	stats, err := h.kudos.StatsForUser(h.wsID, userID, dailyQuota)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "stats error"})
		return
	}

	JSON(w, http.StatusOK, map[string]any{
		"received": received,
		"given":    given,
		"stats":    stats,
	})
}

// GetUsers handles GET /api/users — returns all distinct users from the kudo history.
func (h *Handler) GetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.kudos.ListUsers(h.wsID)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "users error"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"users": users})
}

// GetLeaderboard handles GET /api/leaderboard?period=week|month|all&tab=received|given.
func (h *Handler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "week"
	}
	tab := r.URL.Query().Get("tab")
	if tab == "" {
		tab = "received"
	}

	var since *time.Time
	now := time.Now().UTC()
	switch period {
	case "week":
		t := weekStart(now)
		since = &t
	case "month":
		t := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		since = &t
	case "all":
		since = nil
	}

	var (
		entries []kudos.LeaderboardEntry
		err     error
	)
	if tab == "given" {
		entries, err = h.kudos.TopSenders(h.wsID, 20, since)
	} else {
		entries, err = h.kudos.TopRecipients(h.wsID, 20, since)
	}
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "leaderboard error"})
		return
	}

	JSON(w, http.StatusOK, map[string]any{
		"entries": entries,
		"period":  period,
		"tab":     tab,
	})
}

// GetSettings handles GET /api/admin/settings.
func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	ws, err := h.workspaces.GetByID(h.wsID)
	if errors.Is(err, workspace.ErrNotFound) {
		JSON(w, http.StatusOK, map[string]any{
			"emoji":            "⚡",
			"currencySingular": "Spark",
			"currencyPlural":   "Sparks",
			"dailyAllowance":   5,
		})
		return
	}
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "workspace error"})
		return
	}

	emoji := ws.KudoEmoji
	if emoji == "" {
		emoji = "⚡"
	}
	singular := ws.CurrencySingular
	if singular == "" {
		singular = "Spark"
	}
	plural := ws.CurrencyPlural
	if plural == "" {
		plural = "Sparks"
	}
	quota := ws.DailyQuota
	if quota == 0 {
		quota = 5
	}

	JSON(w, http.StatusOK, map[string]any{
		"emoji":            emoji,
		"currencySingular": singular,
		"currencyPlural":   plural,
		"dailyAllowance":   quota,
	})
}

// PutSettings handles PUT /api/admin/settings.
func (h *Handler) PutSettings(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Emoji            string `json:"emoji"`
		CurrencySingular string `json:"currencySingular"`
		CurrencyPlural   string `json:"currencyPlural"`
		DailyAllowance   int    `json:"dailyAllowance"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	ws, err := h.workspaces.GetByID(h.wsID)
	if errors.Is(err, workspace.ErrNotFound) {
		ws = &workspace.Workspace{ID: h.wsID, Name: h.wsID}
	} else if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "workspace error"})
		return
	}

	if body.Emoji != "" {
		ws.KudoEmoji = body.Emoji
	}
	if body.CurrencySingular != "" {
		ws.CurrencySingular = body.CurrencySingular
	}
	if body.CurrencyPlural != "" {
		ws.CurrencyPlural = body.CurrencyPlural
	}
	if body.DailyAllowance > 0 {
		ws.DailyQuota = body.DailyAllowance
	}

	if err := h.workspaces.Upsert(ws); err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "save error"})
		return
	}

	JSON(w, http.StatusOK, map[string]any{
		"emoji":            ws.KudoEmoji,
		"currencySingular": ws.CurrencySingular,
		"currencyPlural":   ws.CurrencyPlural,
		"dailyAllowance":   ws.DailyQuota,
	})
}

func weekStart(t time.Time) time.Time {
	weekday := int(t.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	return time.Date(t.Year(), t.Month(), t.Day()-weekday+1, 0, 0, 0, 0, time.UTC)
}
