# Slack App Setup

This guide walks you through creating and configuring the Kudo Slack app from scratch.

---

## Table of contents

1. [Create the app](#1-create-the-app)
2. [Configure OAuth scopes](#2-configure-oauth-scopes)
3. [Configure Event Subscriptions](#3-configure-event-subscriptions)
4. [Configure Slash Commands](#4-configure-slash-commands)
5. [Install to your workspace](#5-install-to-your-workspace)
6. [Copy your credentials](#6-copy-your-credentials)
7. [Expose your local server (development)](#7-expose-your-local-server-development)
8. [App Manifest (shortcut)](#8-app-manifest-shortcut)

---

## 1. Create the app

1. Go to **https://api.slack.com/apps**
2. Click **Create New App** → choose **From scratch**
3. Fill in:
   - **App Name**: `Kudo`
   - **Pick a workspace**: select your development workspace
4. Click **Create App**

---

## 2. Configure OAuth scopes

The bot needs permissions to read messages and post replies.

1. In the left sidebar → **OAuth & Permissions**
2. Scroll to **Scopes** → **Bot Token Scopes**
3. Add the following scopes:

| Scope | Why |
|---|---|
| `chat:write` | Post kudos confirmations in channels |
| `users:read` | Resolve Slack user IDs to display names |
| `users:read.email` | (Optional) Match users by email |
| `commands` | Respond to slash commands |
| `channels:history` | Read messages to detect kudos |
| `groups:history` | Read messages in private channels |
| `im:history` | Read direct messages |

> **Minimal setup** — if you only want slash commands (no message-event detection), you only need `chat:write` and `commands`.

---

## 3. Configure Event Subscriptions

This lets Slack send message events to your server.

1. In the left sidebar → **Event Subscriptions**
2. Toggle **Enable Events** → ON
3. Set the **Request URL** to your server's public address:
   ```
   https://<your-domain>/slack/events
   ```
   Slack will immediately send a challenge request — your server must be running and reachable.  
   For local development, see [step 7](#7-expose-your-local-server-development).

4. Once the URL is verified, scroll to **Subscribe to bot events**
5. Add the following events:

| Event | Why |
|---|---|
| `message.channels` | Detect kudos in public channels |
| `message.groups` | Detect kudos in private channels |
| `message.im` | Detect kudos sent via DM |

6. Click **Save Changes**

---

## 4. Configure Slash Commands

1. In the left sidebar → **Slash Commands**
2. Click **Create New Command** and fill in:

| Field | Value |
|---|---|
| Command | `/kudo` |
| Request URL | `https://<your-domain>/slack/commands` |
| Short Description | Give a kudo to a colleague |
| Usage Hint | `@user [message]` |

3. Click **Save**
4. *(Optional)* Create a second command `/leaderboard` pointing to the same URL if you want a quick-view slash command.

---

## 5. Install to your workspace

1. In the left sidebar → **OAuth & Permissions**
2. Click **Install to Workspace**
3. Review the permissions and click **Allow**

After installation you will be redirected back to the OAuth & Permissions page where your **Bot User OAuth Token** (`xoxb-…`) is now visible.

---

## 6. Copy your credentials

You need two values from the Slack app dashboard:

### Signing Secret

**Basic Information** → **App Credentials** → **Signing Secret**

```
SLACK_SIGNING_SECRET=abc123def456...
```

This is used to verify that every request hitting `/slack/events` and `/slack/commands` genuinely comes from Slack (HMAC-SHA256 signature check). **Always required.**

### Bot Token

**OAuth & Permissions** → **Bot User OAuth Token**

```
SLACK_BOT_TOKEN=xoxb-12345678-...
```

This is used when the bot calls the Slack API (e.g. posting a confirmation message after a kudo). Required once the bot needs to respond in Slack.

Add both to your `.env` file:

```dotenv
SLACK_SIGNING_SECRET=abc123def456...
SLACK_BOT_TOKEN=xoxb-12345678-...
```

---

## 7. Expose your local server (development)

Slack must reach your server over HTTPS. During development you can tunnel your local port using one of the following tools.

### Option A — ngrok (recommended)

```bash
# Install: https://ngrok.com/download
ngrok http 8080
```

Copy the `https://xxxx.ngrok-free.app` URL and paste it as the Request URL in:
- Event Subscriptions → `https://xxxx.ngrok-free.app/slack/events`
- Slash Commands → `https://xxxx.ngrok-free.app/slack/commands`

> ⚠️ The ngrok URL changes on every restart with a free account. Update Slack each time, or use a paid plan / static domain.

### Option B — Cloudflare Tunnel (persistent URL)

```bash
# Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
cloudflared tunnel --url http://localhost:8080
```

### Option C — Slack CLI / Dev Mode

If you have the [Slack CLI](https://api.slack.com/automation/cli) installed:

```bash
slack run  # opens a Socket Mode tunnel automatically
```

This requires enabling **Socket Mode** in your app settings and generating an `SLACK_APP_TOKEN` (`xapp-…`), but avoids the need for a public URL.

---

## 8. App Manifest (shortcut)

Instead of clicking through the UI, you can create the app from a manifest.  
Go to **https://api.slack.com/apps** → **Create New App** → **From an app manifest**, then paste:

```yaml
display_information:
  name: Kudo
  description: Give kudos to your teammates with a simple emoji mention 🌮
  background_color: "#1a1a2e"

features:
  bot_user:
    display_name: Kudo
    always_online: true
  slash_commands:
    - command: /kudo
      url: https://<your-domain>/slack/commands
      description: Give a kudo to a colleague
      usage_hint: "@user [message]"
      should_escape: false
    - command: /leaderboard
      url: https://<your-domain>/slack/commands
      description: Show the kudos leaderboard
      should_escape: false

oauth_config:
  scopes:
    bot:
      - chat:write
      - users:read
      - commands
      - channels:history
      - groups:history
      - im:history

settings:
  event_subscriptions:
    request_url: https://<your-domain>/slack/events
    bot_events:
      - message.channels
      - message.groups
      - message.im
  interactivity:
    is_enabled: false
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

Replace `<your-domain>` with your actual server URL (or ngrok address), then follow steps [5](#5-install-to-your-workspace) and [6](#6-copy-your-credentials) to install and collect your tokens.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Request URL shows ❌ in Slack | Server not reachable or not responding to challenge | Check ngrok is running; check `GET /healthz` returns 200; make sure `/slack/events` returns the `challenge` value |
| `dispatch_failed` error in Slack | Server returned non-200 | Check backend logs; verify `SLACK_SIGNING_SECRET` matches |
| Bot doesn't post messages | Missing `chat:write` scope or `SLACK_BOT_TOKEN` not set | Re-check scopes and reinstall the app |
| `missing_scope` error from Slack API | Bot token lacks a required scope | Add the scope in OAuth & Permissions, then reinstall |
| Token starts with `xoxp-` instead of `xoxb-` | You copied the user token instead of the bot token | Use the **Bot User OAuth Token** on the OAuth & Permissions page |
