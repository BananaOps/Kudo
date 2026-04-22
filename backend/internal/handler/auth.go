package handler

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/url"
	"time"

	"github.com/BananaOps/kudo/backend/internal/auth"
)

// signedState builds a self-verifying state token: base64(nonce).base64(hmac(nonce)).
// No cookie required — the signature is verified on callback.
func (h *Handler) signedState(nonce string) string {
	mac := hmac.New(sha256.New, []byte(h.sessionSecret))
	_, _ = mac.Write([]byte(nonce))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return base64.RawURLEncoding.EncodeToString([]byte(nonce)) + "." + sig
}

func (h *Handler) verifyState(state string) bool {
	b, err := base64.RawURLEncoding.DecodeString(func() string {
		for i, c := range state {
			if c == '.' {
				return state[:i]
			}
		}
		return state
	}())
	if err != nil {
		return false
	}
	want := h.signedState(string(b))
	return hmac.Equal([]byte(want), []byte(state))
}

// GetSlackLogin redirects the browser to Slack's OpenID Connect authorisation URL.
func (h *Handler) GetSlackLogin(w http.ResponseWriter, r *http.Request) {
	if h.slackClientID == "" {
		http.Error(w, "Slack OAuth not configured", http.StatusServiceUnavailable)
		return
	}
	nonce := make([]byte, 16)
	if _, err := rand.Read(nonce); err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	state := h.signedState(base64.RawURLEncoding.EncodeToString(nonce))
	params := url.Values{
		"response_type": {"code"},
		"client_id":     {h.slackClientID},
		"scope":         {"openid profile"},
		"redirect_uri":  {h.callbackURL},
		"state":         {state},
	}
	http.Redirect(w, r, "https://slack.com/openid/connect/authorize?"+params.Encode(), http.StatusFound)
}

// GetSlackCallback handles the OAuth 2.0 redirect from Slack, exchanges the code
// for a user identity, and sets a signed session cookie before redirecting to "/".
func (h *Handler) GetSlackCallback(w http.ResponseWriter, r *http.Request) {
	// Verify self-signed state (CSRF protection without a cookie)
	if !h.verifyState(r.URL.Query().Get("state")) {
		http.Error(w, "invalid state", http.StatusBadRequest)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing code", http.StatusBadRequest)
		return
	}

	// Exchange code for tokens
	resp, err := http.PostForm("https://slack.com/api/openid.connect.token", url.Values{
		"client_id":     {h.slackClientID},
		"client_secret": {h.slackClientSecret},
		"code":          {code},
		"redirect_uri":  {h.callbackURL},
	})
	if err != nil {
		http.Error(w, "token exchange failed", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var tokenResp map[string]json.RawMessage
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		http.Error(w, "token parse error", http.StatusInternalServerError)
		return
	}
	var ok bool
	_ = json.Unmarshal(tokenResp["ok"], &ok)
	if !ok {
		var slackErr string
		_ = json.Unmarshal(tokenResp["error"], &slackErr)
		http.Error(w, "slack error: "+slackErr, http.StatusInternalServerError)
		return
	}
	var accessToken string
	_ = json.Unmarshal(tokenResp["access_token"], &accessToken)

	// Fetch user info from Slack's OpenID userInfo endpoint
	req, _ := http.NewRequest("GET", "https://slack.com/api/openid.connect.userInfo", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	uResp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "userinfo request failed", http.StatusInternalServerError)
		return
	}
	defer uResp.Body.Close()

	var rawInfo map[string]json.RawMessage
	if err := json.NewDecoder(uResp.Body).Decode(&rawInfo); err != nil {
		http.Error(w, "userinfo parse error", http.StatusInternalServerError)
		return
	}
	var sub, name, teamID string
	_ = json.Unmarshal(rawInfo["sub"], &sub)
	_ = json.Unmarshal(rawInfo["name"], &name)
	_ = json.Unmarshal(rawInfo["https://slack.com/team_id"], &teamID)

	if sub == "" {
		http.Error(w, "missing user identity", http.StatusInternalServerError)
		return
	}

	// Create session cookie
	session := auth.Session{
		UserID:    sub,
		UserName:  name,
		TeamID:    teamID,
		ExpiresAt: time.Now().Add(auth.TTL).Unix(),
	}
	token, err := auth.Sign(session, h.sessionSecret)
	if err != nil {
		http.Error(w, "session error", http.StatusInternalServerError)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     auth.CookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   int(auth.TTL.Seconds()),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   h.secureCookies,
	})

	http.Redirect(w, r, "/", http.StatusFound)
}

// GetMe returns the current user identity, or 401 if not authenticated.
// In dev mode (no SLACK_CLIENT_ID configured) it falls back to the default user.
func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(auth.CookieName); err == nil {
		if session, err := auth.Verify(cookie.Value, h.sessionSecret); err == nil {
			JSON(w, http.StatusOK, map[string]any{
				"userId":   session.UserID,
				"userName": session.UserName,
				"isAdmin":  h.isAdmin(session.UserID),
			})
			return
		}
		// Stale / invalid cookie → clear it
		http.SetCookie(w, &http.Cookie{Name: auth.CookieName, Value: "", Path: "/", MaxAge: -1})
	}

	// Dev mode: no Slack OAuth configured, serve the default identity
	if h.slackClientID == "" && h.userID != "" {
		JSON(w, http.StatusOK, map[string]any{
			"userId":   h.userID,
			"userName": h.userName,
			"isAdmin":  h.isAdmin(h.userID),
		})
		return
	}

	JSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
}

// PostLogout clears the session cookie.
func (h *Handler) PostLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     auth.CookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   h.secureCookies,
	})
	JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
