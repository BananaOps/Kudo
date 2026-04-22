package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/BananaOps/kudo/backend/internal/kudos"
)

// ── User endpoints ────────────────────────────────────────────────────────────

// GetChallenges handles GET /api/challenges
// Returns active, non-expired challenges with the caller's completion status.
func (h *Handler) GetChallenges(w http.ResponseWriter, r *http.Request) {
	userID := h.resolveUserID(r)

	all, err := h.challenges.ListChallenges(h.wsID, true)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "fetch challenges"})
		return
	}

	type challengeWithStatus struct {
		kudos.Challenge
		UserStatus string `json:"userStatus"` // "", "pending", "approved", "rejected"
	}

	result := make([]challengeWithStatus, 0, len(all))
	for _, c := range all {
		// Filter expired at the API layer so the frontend always gets current data.
		if c.IsExpired() {
			continue
		}
		status := ""
		comps, err := h.challenges.ListCompletions(h.wsID, nil)
		if err == nil {
			for _, comp := range comps {
				if comp.ChallengeID == c.ID && comp.UserID == userID {
					status = string(comp.Status)
					break
				}
			}
		}
		result = append(result, challengeWithStatus{Challenge: c, UserStatus: status})
	}

	JSON(w, http.StatusOK, map[string]any{"challenges": result})
}

// PostClaimChallenge handles POST /api/challenges/{id}/claim
// User submits a completion request for a challenge.
func (h *Handler) PostClaimChallenge(w http.ResponseWriter, r *http.Request) {
	userID, userName := h.resolveUser(r)
	challengeID := r.PathValue("id")

	challenge, err := h.challenges.GetChallenge(h.wsID, challengeID)
	if errors.Is(err, kudos.ErrChallengeNotFound) {
		JSON(w, http.StatusNotFound, map[string]string{"error": "challenge not found"})
		return
	}
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "fetch challenge"})
		return
	}
	if !challenge.IsActive || challenge.IsExpired() {
		JSON(w, http.StatusUnprocessableEntity, map[string]string{"error": kudos.ErrChallengeExpired.Error()})
		return
	}

	already, err := h.challenges.HasPendingOrApprovedCompletion(h.wsID, challengeID, userID)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "check completion"})
		return
	}
	if already {
		JSON(w, http.StatusConflict, map[string]string{"error": kudos.ErrAlreadyClaimed.Error()})
		return
	}

	var body struct {
		Note string `json:"note"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	comp, err := h.challenges.SaveCompletion(&kudos.ChallengeCompletion{
		ChallengeID:    challengeID,
		ChallengeTitle: challenge.Title,
		WorkspaceID:    h.wsID,
		UserID:         userID,
		UserName:       userName,
		Note:           body.Note,
	})
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "save completion"})
		return
	}

	JSON(w, http.StatusCreated, map[string]any{"completion": comp})
}

// ── Admin endpoints ───────────────────────────────────────────────────────────

// PostChallenge handles POST /api/admin/challenges
func (h *Handler) PostChallenge(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	adminID, adminName := h.resolveUser(r)

	var body struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		KudoReward  int     `json:"kudoReward"`
		ExpiresAt   *string `json:"expiresAt"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if body.Title == "" || body.KudoReward <= 0 {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "title and kudoReward are required"})
		return
	}

	var expiresAt *time.Time
	if body.ExpiresAt != nil && *body.ExpiresAt != "" {
		t, err := time.Parse(time.RFC3339, *body.ExpiresAt)
		if err != nil {
			// Try date-only format
			t2, err2 := time.Parse("2006-01-02", *body.ExpiresAt)
			if err2 != nil {
				JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid expiresAt format (use RFC3339 or YYYY-MM-DD)"})
				return
			}
			t = time.Date(t2.Year(), t2.Month(), t2.Day(), 23, 59, 59, 0, time.UTC)
		}
		expiresAt = &t
	}

	c, err := h.challenges.SaveChallenge(&kudos.Challenge{
		WorkspaceID:   h.wsID,
		Title:         body.Title,
		Description:   body.Description,
		KudoReward:    body.KudoReward,
		ExpiresAt:     expiresAt,
		CreatedByID:   adminID,
		CreatedByName: adminName,
	})
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "save challenge"})
		return
	}

	JSON(w, http.StatusCreated, map[string]any{"challenge": c})
}

// PutChallenge handles PUT /api/admin/challenges/{id}
func (h *Handler) PutChallenge(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	id := r.PathValue("id")

	existing, err := h.challenges.GetChallenge(h.wsID, id)
	if errors.Is(err, kudos.ErrChallengeNotFound) {
		JSON(w, http.StatusNotFound, map[string]string{"error": "challenge not found"})
		return
	}
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "fetch challenge"})
		return
	}

	var body struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
		KudoReward  *int    `json:"kudoReward"`
		ExpiresAt   *string `json:"expiresAt"`
		IsActive    *bool   `json:"isActive"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	if body.Title != nil {
		existing.Title = *body.Title
	}
	if body.Description != nil {
		existing.Description = *body.Description
	}
	if body.KudoReward != nil {
		existing.KudoReward = *body.KudoReward
	}
	if body.IsActive != nil {
		existing.IsActive = *body.IsActive
	}
	if body.ExpiresAt != nil {
		if *body.ExpiresAt == "" {
			existing.ExpiresAt = nil
		} else {
			t, err := time.Parse(time.RFC3339, *body.ExpiresAt)
			if err != nil {
				t2, err2 := time.Parse("2006-01-02", *body.ExpiresAt)
				if err2 != nil {
					JSON(w, http.StatusBadRequest, map[string]string{"error": "invalid expiresAt format"})
					return
				}
				t = time.Date(t2.Year(), t2.Month(), t2.Day(), 23, 59, 59, 0, time.UTC)
			}
			existing.ExpiresAt = &t
		}
	}

	updated, err := h.challenges.UpdateChallenge(existing)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "update challenge"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"challenge": updated})
}

// GetAdminChallenges handles GET /api/admin/challenges (all, including inactive)
func (h *Handler) GetAdminChallenges(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	all, err := h.challenges.ListChallenges(h.wsID, false)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "fetch challenges"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"challenges": all})
}

// GetAdminCompletions handles GET /api/admin/challenges/completions?status=pending|approved|rejected
func (h *Handler) GetAdminCompletions(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	statusStr := r.URL.Query().Get("status")
	var statusFilter *kudos.ChallengeStatus
	if statusStr != "" {
		s := kudos.ChallengeStatus(statusStr)
		statusFilter = &s
	}

	comps, err := h.challenges.ListCompletions(h.wsID, statusFilter)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "fetch completions"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"completions": comps})
}

// PostApproveCompletion handles POST /api/admin/challenges/completions/{id}/approve
func (h *Handler) PostApproveCompletion(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	reviewerID, reviewerName := h.resolveUser(r)
	id := r.PathValue("id")

	comp, err := h.challenges.GetCompletion(h.wsID, id)
	if errors.Is(err, kudos.ErrCompletionNotFound) {
		JSON(w, http.StatusNotFound, map[string]string{"error": "completion not found"})
		return
	}
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "fetch completion"})
		return
	}
	if comp.Status != kudos.CompletionPending {
		JSON(w, http.StatusConflict, map[string]string{"error": "completion is not pending"})
		return
	}

	challenge, err := h.challenges.GetChallenge(h.wsID, comp.ChallengeID)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "fetch challenge"})
		return
	}

	// Award kudos: one kudo doc per spark point in the reward.
	kudo := &kudos.Kudo{
		WorkspaceID:  h.wsID,
		FromUserID:   reviewerID,
		FromUserName: reviewerName,
		ToUserID:     comp.UserID,
		ToUserName:   comp.UserName,
		Message:      fmt.Sprintf("Challenge completed: %s", challenge.Title),
		Channel:      "challenges",
		EmojiCount:   challenge.KudoReward,
		CreatedAt:    time.Now().UTC(),
	}
	if _, err := h.kudos.Save(kudo); err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "award kudos"})
		return
	}

	updated, err := h.challenges.UpdateCompletionStatus(h.wsID, id, kudos.CompletionApproved, reviewerID, reviewerName)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "update completion"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"completion": updated})
}

// PostRejectCompletion handles POST /api/admin/challenges/completions/{id}/reject
func (h *Handler) PostRejectCompletion(w http.ResponseWriter, r *http.Request) {
	if !h.requireAdmin(w, r) {
		return
	}
	reviewerID, reviewerName := h.resolveUser(r)
	id := r.PathValue("id")

	comp, err := h.challenges.GetCompletion(h.wsID, id)
	if errors.Is(err, kudos.ErrCompletionNotFound) {
		JSON(w, http.StatusNotFound, map[string]string{"error": "completion not found"})
		return
	}
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "fetch completion"})
		return
	}
	if comp.Status != kudos.CompletionPending {
		JSON(w, http.StatusConflict, map[string]string{"error": "completion is not pending"})
		return
	}

	updated, err := h.challenges.UpdateCompletionStatus(h.wsID, id, kudos.CompletionRejected, reviewerID, reviewerName)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "update completion"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"completion": updated})
}
