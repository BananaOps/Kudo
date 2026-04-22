package handler

import (
	"encoding/json"
	"net/http"

	"github.com/BananaOps/kudo/backend/internal/kudos"
	"github.com/BananaOps/kudo/backend/internal/workspace"
)

// Handler holds dependencies for all API handlers.
type Handler struct {
	kudos      kudos.Repository
	workspaces workspace.Service
	challenges kudos.ChallengeRepository
	wsID       string
	userID     string
	userName   string

	// Slack OAuth
	slackClientID     string
	slackClientSecret string
	callbackURL       string
	sessionSecret     string
	secureCookies     bool

	// Admin access control
	adminUserIDs []string
}

// New creates a Handler with the given dependencies.
func New(
	kudosRepo kudos.Repository,
	workspaceRepo workspace.Service,
	challengeRepo kudos.ChallengeRepository,
	wsID, userID, userName string,
	slackClientID, slackClientSecret string,
	callbackURL, sessionSecret string,
	secureCookies bool,
	adminUserIDs []string,
) *Handler {
	return &Handler{
		kudos:             kudosRepo,
		workspaces:        workspaceRepo,
		challenges:        challengeRepo,
		wsID:              wsID,
		userID:            userID,
		userName:          userName,
		slackClientID:     slackClientID,
		slackClientSecret: slackClientSecret,
		callbackURL:       callbackURL,
		sessionSecret:     sessionSecret,
		secureCookies:     secureCookies,
		adminUserIDs:      adminUserIDs,
	}
}

// isAdmin returns true when userID has admin rights.
// Priority: env-var list → DB list → dev-mode fallback (both empty = everyone is admin).
func (h *Handler) isAdmin(userID string) bool {
	// Env-var override (emergency / bootstrap)
	for _, id := range h.adminUserIDs {
		if id == userID {
			return true
		}
	}
	// DB-stored admins
	ws, err := h.workspaces.GetByID(h.wsID)
	if err != nil {
		// Can't reach DB: fall back to dev-mode only when no env admins defined
		return len(h.adminUserIDs) == 0
	}
	if len(h.adminUserIDs) == 0 && len(ws.AdminUsers) == 0 {
		return true // dev mode: no admins defined anywhere
	}
	for _, u := range ws.AdminUsers {
		if u.ID == userID {
			return true
		}
	}
	return false
}

// requireAdmin writes a 403 and returns false if the caller is not an admin.
func (h *Handler) requireAdmin(w http.ResponseWriter, r *http.Request) bool {
	userID := h.resolveUserID(r)
	if !h.isAdmin(userID) {
		JSON(w, http.StatusForbidden, map[string]string{"error": "admin access required"})
		return false
	}
	return true
}

// JSON writes v as JSON to w with the given status code.
func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// NotFound returns a JSON 404.
func NotFound(w http.ResponseWriter, r *http.Request) {
	JSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
}
