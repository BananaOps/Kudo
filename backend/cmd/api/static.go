package main

import (
	"embed"
	"io/fs"
	"net/http"
	"path"
	"strings"
)

// staticFiles holds the compiled frontend assets embedded at build time.
// In the Docker image the dist/ directory contains the real Vite build output.
// Locally (without running `npm run build`) only .gitkeep is present, which
// means the SPA handler silently returns 404s — the API still works normally.
//
//go:embed dist
var staticFiles embed.FS

// spaHandler serves static assets from fsys and falls back to index.html for
// any path that does not match a real file (client-side routing).
func spaHandler(fsys fs.FS) http.Handler {
	server := http.FileServerFS(fsys)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Normalise the path and strip the leading slash for FS lookups.
		name := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
		if name == "" {
			name = "index.html"
		}

		if f, err := fsys.Open(name); err == nil {
			f.Close()
			server.ServeHTTP(w, r)
			return
		}

		// Unknown path → let the SPA router handle it.
		r2 := r.Clone(r.Context())
		r2.URL.Path = "/index.html"
		server.ServeHTTP(w, r2)
	})
}
