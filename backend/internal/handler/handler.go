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
	wsID       string
	userID     string
	userName   string
}

// New creates a Handler with the given dependencies.
func New(
	kudosRepo kudos.Repository,
	workspaceRepo workspace.Service,
	wsID, userID, userName string,
) *Handler {
	return &Handler{
		kudos:      kudosRepo,
		workspaces: workspaceRepo,
		wsID:       wsID,
		userID:     userID,
		userName:   userName,
	}
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
