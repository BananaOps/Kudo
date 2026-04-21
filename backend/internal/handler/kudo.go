package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/BananaOps/kudo/backend/internal/kudos"
)

// KudoHandler groups HTTP handlers that depend on the kudos service.
type KudoHandler struct {
	svc kudos.Service
}

// NewKudoHandler constructs a KudoHandler with its required dependency.
func NewKudoHandler(svc kudos.Service) *KudoHandler {
	return &KudoHandler{svc: svc}
}

// GiveRequest is the JSON body expected by the Give endpoint.
type GiveRequest struct {
	WorkspaceID  string `json:"workspace_id"`
	FromUserID   string `json:"from_user_id"`
	FromUserName string `json:"from_user_name"`
	ToUserID     string `json:"to_user_id"`
	ToUserName   string `json:"to_user_name"`
	Message      string `json:"message"`
	Channel      string `json:"channel"`
	EmojiCount   int    `json:"emoji_count"`
}

// GiveResponse is the JSON body returned on success.
type GiveResponse struct {
	Kudo *kudos.Kudo `json:"kudo"`
}

// ErrorResponse is the JSON body returned on error.
type ErrorResponse struct {
	Error string `json:"error"`
}

// Give handles POST /kudos.
func (h *KudoHandler) Give(w http.ResponseWriter, r *http.Request) {
	var req GiveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid request body"})
		return
	}

	kudo, err := h.svc.Give(
		req.WorkspaceID, req.FromUserID, req.FromUserName,
		req.ToUserID, req.ToUserName,
		req.Message, req.Channel, req.EmojiCount,
	)
	if err != nil {
		switch {
		case errors.Is(err, kudos.ErrSelfKudo):
			writeJSON(w, http.StatusUnprocessableEntity, ErrorResponse{Error: err.Error()})
		case errors.Is(err, kudos.ErrQuotaExceeded):
			writeJSON(w, http.StatusTooManyRequests, ErrorResponse{Error: err.Error()})
		default:
			writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal error"})
		}
		return
	}

	writeJSON(w, http.StatusCreated, GiveResponse{Kudo: kudo})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
