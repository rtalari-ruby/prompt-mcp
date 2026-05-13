# Remote access (HTTP, ngrok, Claude.ai)

The default setup uses **stdio** (local subprocess). Claude Code and Claude Desktop both work that way. For Claude.ai web — or any remote client — you need the **HTTP transport** documented here.

---

## 1. Run the HTTP server

```bash
cd /Users/rahulraju93/Documents/GitHub/prompt-mcp
npm run build
npm run start:http
```

Output:
```
prompt-mcp ready (8 tools, http) http://127.0.0.1:3000/mcp
auth: Bearer 0b7f…d842 (set via PROMPT_MCP_TOKEN)
```

Required env (already in your `.env`):

```bash
PROMPT_MCP_TOKEN=<long random string>   # openssl rand -hex 24
PROMPT_MCP_PORT=3000                    # default
PROMPT_MCP_HOST=127.0.0.1               # default — local only
```

If `PROMPT_MCP_TOKEN` is unset, the server refuses to start (prevents anonymous use of your Azure quota).

### Smoke-test from another terminal

```bash
TOKEN=$(grep PROMPT_MCP_TOKEN .env | cut -d= -f2)
curl -s http://127.0.0.1:3000/healthz                   # → {"ok":true,"tools":8}
curl -s http://127.0.0.1:3000/mcp                       # → {"error":"unauthorized"}

# MCP initialize handshake (returns mcp-session-id header)
curl -si -X POST http://127.0.0.1:3000/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0.1"}}}'
```

The easier way to exercise it: **MCP Inspector**.

```bash
npx @modelcontextprotocol/inspector
```

Set Transport=Streamable HTTP, URL=`http://127.0.0.1:3000/mcp`, Auth header=`Bearer <token>`, click Connect.

---

## 2. Expose with ngrok (fastest public URL)

Installs in 30 seconds, free tier is fine for personal use.

```bash
brew install ngrok        # one-time
ngrok config add-authtoken <your-token>   # one-time; sign up at ngrok.com
```

While the HTTP server is running:

```bash
ngrok http 3000
```

ngrok prints something like:

```
Forwarding   https://abc-123-456.ngrok-free.app -> http://localhost:3000
```

That `https://abc-123-456.ngrok-free.app/mcp` is your public MCP URL.

Note: the URL changes every restart on the free tier. Pay $8/mo for a static subdomain, or move to a permanent host (next section) once you decide you want this long-term.

---

## 3. Permanent hosting (when ready)

| Host | Cost | Setup |
|---|---|---|
| Cloudflare Tunnel | free | `cloudflared tunnel --url http://localhost:3000` from your laptop; persistent URL if you create a named tunnel. Server stays on your machine. |
| Fly.io | ~$0/mo for tiny | Add a `Dockerfile`, `fly deploy`. Persistent URL, runs in the cloud. |
| Railway | ~$5/mo | `railway up`. Persistent URL. |
| VPS (DigitalOcean, Hetzner) | $5–10/mo | `scp` dist + node, `pm2 start dist/http-server.js`. Most control. |

For all of these, set the same env vars (`AZURE_OPENAI_*`, `PROMPT_MCP_TOKEN`) on the host.

A minimal Dockerfile if you go that route:

```dockerfile
FROM node:23-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
COPY kb ./kb
ENV PROMPT_MCP_PORT=3000 PROMPT_MCP_HOST=0.0.0.0
EXPOSE 3000
CMD ["node", "dist/http-server.js"]
```

---

## 4. Connecting from clients

### 4a. Claude Desktop

Same model as Claude Code. Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "prompt": {
      "command": "node",
      "args": ["/Users/rahulraju93/Documents/GitHub/prompt-mcp/dist/server.js"]
    }
  }
}
```

This uses stdio, not HTTP. Same as the Claude Code setup — you already have this working there; Claude Desktop would be a copy of the config.

### 4b. Claude.ai web (Custom Connectors)

> **Status:** Claude.ai's Custom Connectors UI authenticates via OAuth 2.1 with Dynamic Client Registration, not a static bearer token. Our HTTP server today only does bearer auth, so claude.ai web won't accept it out of the box.

Three paths from here, ordered by effort:

**Path 1 — use Claude Desktop instead** (zero extra work). Claude Desktop runs the same prompt-mcp server you already have wired up. Same UI as claude.ai for chat. This is what I'd recommend unless you have a specific reason to need claude.ai web.

**Path 2 — proxy through a service that adds OAuth** (medium). Tools like [mcp-remote](https://www.npmjs.com/package/mcp-remote) or [smithery.ai](https://smithery.ai) front your bearer-auth HTTP server with an OAuth flow. You don't change prompt-mcp; you add a thin layer.

**Path 3 — implement OAuth in prompt-mcp** (more work). The MCP SDK includes an OAuth router (`@modelcontextprotocol/sdk/server/auth/router`). You'd add:
- `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource` discovery
- Dynamic Client Registration (DCR) endpoint
- Authorization endpoint + token endpoint
- Per-user access tokens

This is ~half a day of work. Worth doing if you want multiple people using your server from claude.ai web with their own credentials.

### 4c. MCP Inspector (testing, troubleshooting)

```bash
npx @modelcontextprotocol/inspector
```

Set the URL + bearer header, click around. Easiest way to iterate while developing tools.

---

## 5. Security checklist before going public

- [ ] `PROMPT_MCP_TOKEN` is high-entropy (24+ random bytes hex).
- [ ] `.env` is gitignored (already is — verify with `git ls-files | grep .env` → only `.env.example`).
- [ ] Server bound to `0.0.0.0` only when behind a reverse proxy / tunnel (default `127.0.0.1` is correct for ngrok / cloudflared).
- [ ] If you give the token to a teammate, plan how you'll rotate it (just change `PROMPT_MCP_TOKEN` and restart).
- [ ] Watch your Azure OpenAI quota — every call costs ~$0.01–$0.10. The token guards against random internet traffic, but doesn't cap your own usage.
- [ ] Consider rate limiting if you expect heavy use. The current server has none — add it at the reverse proxy if needed.

---

## 6. Quick reference

| What | How |
|---|---|
| Run local HTTP | `npm run start:http` |
| Health check | `curl http://127.0.0.1:3000/healthz` |
| Inspect via UI | `npx @modelcontextprotocol/inspector` |
| Expose publicly (temp) | `ngrok http 3000` |
| Expose publicly (persistent) | Cloudflare Tunnel / Fly.io / Railway / VPS |
| Use from Claude Desktop | Same `~/.claude.json` style config |
| Use from claude.ai web | Needs OAuth (path 2 or 3 above) |
| Rotate token | Edit `PROMPT_MCP_TOKEN` in `.env`, restart server |
