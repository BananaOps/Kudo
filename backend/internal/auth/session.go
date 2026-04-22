package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

const CookieName = "kudo_session"
const TTL = 30 * 24 * time.Hour

// Session holds the authenticated user's identity stored in the signed cookie.
type Session struct {
	UserID    string `json:"uid"`
	UserName  string `json:"uname"`
	TeamID    string `json:"tid"`
	ExpiresAt int64  `json:"exp"`
}

// Sign serialises s, base64-encodes it and appends an HMAC-SHA256 signature.
// Format: <base64(payload)>.<base64(sig)>
func Sign(s Session, secret string) (string, error) {
	b, err := json.Marshal(s)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}
	payload := base64.RawURLEncoding.EncodeToString(b)
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return payload + "." + sig, nil
}

// Verify validates the HMAC signature and parses the session.
// Returns an error if the signature is wrong or the session is expired.
func Verify(token, secret string) (*Session, error) {
	dot := strings.LastIndex(token, ".")
	if dot < 0 {
		return nil, fmt.Errorf("malformed token")
	}
	payload, sig := token[:dot], token[dot+1:]

	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(payload))
	want := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(want), []byte(sig)) {
		return nil, fmt.Errorf("invalid signature")
	}

	b, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return nil, fmt.Errorf("decode: %w", err)
	}
	var s Session
	if err := json.Unmarshal(b, &s); err != nil {
		return nil, fmt.Errorf("unmarshal: %w", err)
	}
	if s.ExpiresAt > 0 && time.Now().Unix() > s.ExpiresAt {
		return nil, fmt.Errorf("expired")
	}
	return &s, nil
}
