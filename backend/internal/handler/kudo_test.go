package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/BananaOps/kudo/backend/internal/handler"
	"github.com/BananaOps/kudo/backend/internal/kudos"
)

// mockKudoService implements kudos.Service for testing.
type mockKudoService struct {
	giveFunc func(workspaceID, fromUserID, fromUserName, toUserID, toUserName, message, channel string, emojiCount int) (*kudos.Kudo, error)
}

func (m *mockKudoService) Give(workspaceID, fromUserID, fromUserName, toUserID, toUserName, message, channel string, emojiCount int) (*kudos.Kudo, error) {
	return m.giveFunc(workspaceID, fromUserID, fromUserName, toUserID, toUserName, message, channel, emojiCount)
}

func (m *mockKudoService) Leaderboard(_ string, _ int, _ *time.Time) ([]kudos.LeaderboardEntry, error) {
	panic("not implemented")
}

func (m *mockKudoService) Received(_, _ string) ([]kudos.Kudo, error) {
	panic("not implemented")
}

func (m *mockKudoService) Given(_, _ string) ([]kudos.Kudo, error) {
	panic("not implemented")
}

func postGive(t *testing.T, svc kudos.Service, body handler.GiveRequest) *httptest.ResponseRecorder {
	t.Helper()

	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/kudos", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.NewKudoHandler(svc).Give(rec, req)
	return rec
}

func decodeError(t *testing.T, rec *httptest.ResponseRecorder) handler.ErrorResponse {
	t.Helper()
	var resp handler.ErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode error response: %v", err)
	}
	return resp
}

func TestGiveKudo_Success(t *testing.T) {
	want := &kudos.Kudo{
		ID:          "kudo-1",
		FromUserID:  "U_alice",
		ToUserID:    "U_bob",
		WorkspaceID: "W_acme",
		Message:     "great work!",
		CreatedAt:   time.Now(),
	}

	svc := &mockKudoService{
		giveFunc: func(_, _, _, _, _, _, _ string, _ int) (*kudos.Kudo, error) { return want, nil },
	}

	rec := postGive(t, svc, handler.GiveRequest{
		WorkspaceID: "W_acme",
		FromUserID:  "U_alice",
		ToUserID:    "U_bob",
		Message:     "great work!",
	})

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	var resp handler.GiveResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if resp.Kudo == nil {
		t.Fatal("expected kudo in response body, got nil")
	}
	if resp.Kudo.ID != want.ID {
		t.Errorf("kudo ID: want %q, got %q", want.ID, resp.Kudo.ID)
	}
	if resp.Kudo.FromUserID != want.FromUserID {
		t.Errorf("from_user_id: want %q, got %q", want.FromUserID, resp.Kudo.FromUserID)
	}
}

func TestGiveKudo_QuotaExceeded(t *testing.T) {
	svc := &mockKudoService{
		giveFunc: func(_, _, _, _, _, _, _ string, _ int) (*kudos.Kudo, error) {
			return nil, kudos.ErrQuotaExceeded
		},
	}

	rec := postGive(t, svc, handler.GiveRequest{
		WorkspaceID: "W_acme",
		FromUserID:  "U_alice",
		ToUserID:    "U_bob",
		Message:     "nice job",
	})

	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rec.Code)
	}

	resp := decodeError(t, rec)
	if resp.Error != kudos.ErrQuotaExceeded.Error() {
		t.Errorf("error message: want %q, got %q", kudos.ErrQuotaExceeded.Error(), resp.Error)
	}
}

func TestGiveKudo_SelfKudo(t *testing.T) {
	svc := &mockKudoService{
		giveFunc: func(_, _, _, _, _, _, _ string, _ int) (*kudos.Kudo, error) {
			return nil, kudos.ErrSelfKudo
		},
	}

	rec := postGive(t, svc, handler.GiveRequest{
		WorkspaceID: "W_acme",
		FromUserID:  "U_alice",
		ToUserID:    "U_alice",
		Message:     "I'm great",
	})

	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", rec.Code)
	}

	resp := decodeError(t, rec)
	if resp.Error != kudos.ErrSelfKudo.Error() {
		t.Errorf("error message: want %q, got %q", kudos.ErrSelfKudo.Error(), resp.Error)
	}
}

func TestGiveKudo_BadRequestBody(t *testing.T) {
	svc := &mockKudoService{
		giveFunc: func(_, _, _, _, _, _, _ string, _ int) (*kudos.Kudo, error) { return nil, nil },
	}

	req := httptest.NewRequest(http.MethodPost, "/kudos", bytes.NewBufferString("not-json{"))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	handler.NewKudoHandler(svc).Give(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}
