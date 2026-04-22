package main

import (
	"context"
	"errors"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/BananaOps/kudo/backend/internal/config"
	"github.com/BananaOps/kudo/backend/internal/handler"
	mongostore "github.com/BananaOps/kudo/backend/internal/store/mongo"
	"github.com/BananaOps/kudo/backend/internal/slack"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("configuration error", "err", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, os.Interrupt)
	defer stop()

	mongoClient, err := mongostore.Connect(ctx, cfg.MongoURI, cfg.MongoDB)
	if err != nil {
		slog.Error("mongodb connection failed", "err", err)
		os.Exit(1)
	}
	defer func() {
		shutCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := mongoClient.Disconnect(shutCtx); err != nil {
			slog.Error("mongodb disconnect error", "err", err)
		}
	}()

	if err := mongoClient.KudosRepo().EnsureIndexes(ctx); err != nil {
		slog.Warn("kudos index creation failed", "err", err)
	}
	if err := mongoClient.ChallengesRepo().EnsureIndexes(ctx); err != nil {
		slog.Warn("challenges index creation failed", "err", err)
	}

	h := handler.New(
		mongoClient.KudosRepo(),
		mongoClient.WorkspaceRepo(),
		mongoClient.ChallengesRepo(),
		cfg.DefaultWorkspaceID,
		cfg.DefaultUserID,
		cfg.DefaultUserName,
		cfg.SlackClientID,
		cfg.SlackClientSecret,
		cfg.CallbackURL(),
		cfg.SessionSecret,
		cfg.SecureCookies(),
		cfg.AdminUserIDs,
	)

	slackH := slack.NewHandler(
		mongoClient.KudosRepo(),
		mongoClient.WorkspaceRepo(),
		cfg.SlackSigningSecret,
		cfg.SlackBotToken,
		cfg.DefaultWorkspaceID,
	)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      routes(h, slackH),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("server starting", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("graceful shutdown failed", "err", err)
		os.Exit(1)
	}

	slog.Info("server stopped")
}

func routes(h *handler.Handler, slackH *slack.Handler) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", handler.Health)

	// Slack OAuth ("Sign in with Slack")
	mux.HandleFunc("GET /auth/slack", h.GetSlackLogin)
	mux.HandleFunc("GET /auth/slack/callback", h.GetSlackCallback)
	mux.HandleFunc("POST /auth/logout", h.PostLogout)

	mux.HandleFunc("POST /slack/events", slackH.HandleEvent)
	mux.HandleFunc("POST /slack/commands", slackH.HandleCommand)

	mux.HandleFunc("GET /api/theme", h.GetTheme)
	mux.HandleFunc("GET /api/me", h.GetMe)
	mux.HandleFunc("POST /api/kudos", h.PostKudo)
	mux.HandleFunc("GET /api/home", h.GetHome)
	mux.HandleFunc("GET /api/me/kudos", h.GetMyKudos)
	mux.HandleFunc("GET /api/leaderboard", h.GetLeaderboard)
	mux.HandleFunc("GET /api/users", h.GetUsers)
	mux.HandleFunc("GET /api/admin/settings", h.GetSettings)
	mux.HandleFunc("PUT /api/admin/settings", h.PutSettings)
	mux.HandleFunc("GET /api/admin/admins", h.GetAdmins)
	mux.HandleFunc("POST /api/admin/admins", h.PostAdmin)
	mux.HandleFunc("DELETE /api/admin/admins/{id}", h.DeleteAdmin)

	// Challenges — user
	mux.HandleFunc("GET /api/challenges", h.GetChallenges)
	mux.HandleFunc("POST /api/challenges/{id}/claim", h.PostClaimChallenge)

	// Challenges — admin
	mux.HandleFunc("GET /api/admin/challenges", h.GetAdminChallenges)
	mux.HandleFunc("POST /api/admin/challenges", h.PostChallenge)
	mux.HandleFunc("PUT /api/admin/challenges/{id}", h.PutChallenge)
	mux.HandleFunc("GET /api/admin/challenges/completions", h.GetAdminCompletions)
	mux.HandleFunc("POST /api/admin/challenges/completions/{id}/approve", h.PostApproveCompletion)
	mux.HandleFunc("POST /api/admin/challenges/completions/{id}/reject", h.PostRejectCompletion)

	mux.HandleFunc("/api/", handler.NotFound)

	dist, _ := fs.Sub(staticFiles, "dist")
	mux.Handle("/", spaHandler(dist))

	return mux
}
