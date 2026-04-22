package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/BananaOps/kudo/backend/internal/auth"
	"github.com/BananaOps/kudo/backend/internal/kudos"
	"github.com/BananaOps/kudo/backend/internal/workspace"
)

// resolveUser returns the (id, name) of the authenticated user.
// In prod (Slack OAuth configured) it reads the session cookie exclusively.
// In dev mode it accepts ?userId= / ?userName= query params as an override.
func (h *Handler) resolveUser(r *http.Request) (id, name string) {
	if cookie, err := r.Cookie(auth.CookieName); err == nil {
		if session, err := auth.Verify(cookie.Value, h.sessionSecret); err == nil {
			return session.UserID, session.UserName
		}
	}
	if h.slackClientID == "" {
		if uid := r.URL.Query().Get("userId"); uid != "" {
			uname := r.URL.Query().Get("userName")
			if uname == "" {
				uname = uid
			}
			return uid, uname
		}
	}
	return h.userID, h.userName
}

// resolveUserID is a convenience wrapper around resolveUser.
func (h *Handler) resolveUserID(r *http.Request) string {
	id, _ := h.resolveUser(r)
	return id
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

// defaultSettings returns workspace settings filled with defaults where empty.
func defaultSettings(ws *workspace.Workspace) map[string]any {
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
	coral := ws.ColorCoral
	if coral == "" {
		coral = "#FF7B6B"
	}
	teal := ws.ColorTeal
	if teal == "" {
		teal = "#4ECDC4"
	}
	return map[string]any{
		"emoji":            emoji,
		"currencySingular": singular,
		"currencyPlural":   plural,
		"dailyAllowance":   quota,
		"colorCoral":       coral,
		"colorTeal":        teal,
	}
}

// GetTheme handles GET /api/theme — public, returns workspace colours and emoji.
func (h *Handler) GetTheme(w http.ResponseWriter, r *http.Request) {
	ws, err := h.workspaces.GetByID(h.wsID)
	if errors.Is(err, workspace.ErrNotFound) {
		JSON(w, http.StatusOK, map[string]string{"colorCoral": "#FF7B6B", "colorTeal": "#4ECDC4", "emoji": "⚡"})
		return
	}
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "workspace error"})
		return
	}
	coral := ws.ColorCoral
	if coral == "" {
		coral = "#FF7B6B"
	}
	teal := ws.ColorTeal
	if teal == "" {
		teal = "#4ECDC4"
	}
	emoji := ws.KudoEmoji
	if emoji == "" {
		emoji = "⚡"
	}
	JSON(w, http.StatusOK, map[string]string{"colorCoral": coral, "colorTeal": teal, "emoji": emoji})
}

// GetSettings handles GET /api/admin/settings.
func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	ws, err := h.workspaces.GetByID(h.wsID)
	if errors.Is(err, workspace.ErrNotFound) {
		JSON(w, http.StatusOK, defaultSettings(&workspace.Workspace{}))
		return
	}
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "workspace error"})
		return
	}
	JSON(w, http.StatusOK, defaultSettings(ws))
}

// PutSettings handles PUT /api/admin/settings.
func (h *Handler) PutSettings(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	var body struct {
		Emoji            string `json:"emoji"`
		CurrencySingular string `json:"currencySingular"`
		CurrencyPlural   string `json:"currencyPlural"`
		DailyAllowance   int    `json:"dailyAllowance"`
		ColorCoral       string `json:"colorCoral"`
		ColorTeal        string `json:"colorTeal"`
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
	if body.ColorCoral != "" {
		ws.ColorCoral = body.ColorCoral
	}
	if body.ColorTeal != "" {
		ws.ColorTeal = body.ColorTeal
	}

	if err := h.workspaces.Upsert(ws); err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "save error"})
		return
	}

	JSON(w, http.StatusOK, defaultSettings(ws))
}

// PostKudo handles POST /api/kudos — creates a kudo from the web dashboard.
func (h *Handler) PostKudo(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ToUserID     string `json:"to_user_id"`
		ToUserName   string `json:"to_user_name"`
		Message      string `json:"message"`
		EmojiCount   int    `json:"emoji_count"`
		FromUserName string `json:"from_user_name"` // dev-mode fallback when no session
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	fromUserID, fromUserName := h.resolveUser(r)
	if fromUserName == "" && body.FromUserName != "" {
		fromUserName = body.FromUserName
	}

	if body.ToUserID == "" || body.Message == "" {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "to_user_id and message are required"})
		return
	}
	if fromUserID == body.ToUserID {
		JSON(w, http.StatusUnprocessableEntity, map[string]string{"error": kudos.ErrSelfKudo.Error()})
		return
	}

	ws, err := h.workspaces.GetByID(h.wsID)
	if err != nil && !errors.Is(err, workspace.ErrNotFound) {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "workspace error"})
		return
	}
	dailyQuota := 5
	if ws != nil && ws.DailyQuota > 0 {
		dailyQuota = ws.DailyQuota
	}

	if err := kudos.CheckQuota(h.kudos, kudos.QuotaConfig{Daily: dailyQuota}, h.wsID, fromUserID, time.Now().UTC()); err != nil {
		if errors.Is(err, kudos.ErrQuotaExceeded) {
			JSON(w, http.StatusTooManyRequests, map[string]string{"error": err.Error()})
			return
		}
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "quota check failed"})
		return
	}

	emojiCount := body.EmojiCount
	if emojiCount <= 0 {
		emojiCount = 1
	}

	kudo := &kudos.Kudo{
		WorkspaceID:  h.wsID,
		FromUserID:   fromUserID,
		FromUserName: fromUserName,
		ToUserID:     body.ToUserID,
		ToUserName:   body.ToUserName,
		Message:      body.Message,
		Channel:      "web",
		EmojiCount:   emojiCount,
		CreatedAt:    time.Now().UTC(),
	}

	saved, err := h.kudos.Save(kudo)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "save failed"})
		return
	}

	JSON(w, http.StatusCreated, map[string]any{"kudo": saved})
}

// GetAdmins handles GET /api/admin/admins — returns the current admin list.
func (h *Handler) GetAdmins(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	ws, err := h.workspaces.GetByID(h.wsID)
	if errors.Is(err, workspace.ErrNotFound) {
		JSON(w, http.StatusOK, map[string]any{"admins": []workspace.AdminUser{}, "devMode": true})
		return
	}
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "workspace error"})
		return
	}
	devMode := len(h.adminUserIDs) == 0 && len(ws.AdminUsers) == 0
	JSON(w, http.StatusOK, map[string]any{"admins": ws.AdminUsers, "devMode": devMode})
}

// PostAdmin handles POST /api/admin/admins — promotes a user to admin.
func (h *Handler) PostAdmin(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	var body workspace.AdminUser
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.ID == "" {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "id and name are required"})
		return
	}
	ws, err := h.workspaces.GetByID(h.wsID)
	if errors.Is(err, workspace.ErrNotFound) {
		ws = &workspace.Workspace{ID: h.wsID, Name: h.wsID}
	} else if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "workspace error"})
		return
	}
	for _, u := range ws.AdminUsers {
		if u.ID == body.ID {
			JSON(w, http.StatusOK, map[string]any{"admins": ws.AdminUsers})
			return
		}
	}
	ws.AdminUsers = append(ws.AdminUsers, workspace.AdminUser{ID: body.ID, Name: body.Name})
	if err := h.workspaces.Upsert(ws); err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "save error"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"admins": ws.AdminUsers})
}

// DeleteAdmin handles DELETE /api/admin/admins/{id} — removes a user from admins.
func (h *Handler) DeleteAdmin(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	targetID := r.PathValue("id")
	ws, err := h.workspaces.GetByID(h.wsID)
	if errors.Is(err, workspace.ErrNotFound) {
		JSON(w, http.StatusOK, map[string]any{"admins": []workspace.AdminUser{}})
		return
	}
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "workspace error"})
		return
	}
	filtered := ws.AdminUsers[:0]
	for _, u := range ws.AdminUsers {
		if u.ID != targetID {
			filtered = append(filtered, u)
		}
	}
	ws.AdminUsers = filtered
	if err := h.workspaces.Upsert(ws); err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "save error"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"admins": ws.AdminUsers})
}

func weekStart(t time.Time) time.Time {
	weekday := int(t.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	return time.Date(t.Year(), t.Month(), t.Day()-weekday+1, 0, 0, 0, 0, time.UTC)
}
