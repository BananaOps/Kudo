// Package handler contains HTTP handlers for the Kudo API.
package handler

import (
	"encoding/json"
	"net/http"
)

// HealthResponse is the JSON body returned by the health endpoint.
type HealthResponse struct {
	Status string `json:"status"`
}

// Health returns a 200 OK response with status "ok".
// It is intended to be used as a liveness probe.
func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(HealthResponse{Status: "ok"})
}
