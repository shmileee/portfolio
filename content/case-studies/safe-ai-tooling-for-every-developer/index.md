---
title: Safe AI tooling for every developer
summary: Existing AWS identity and restricted backends provide one governed path from AI clients to operational tools.
topics:
  - ai
  - security
  - developer experience
featured: true
spotlight: false
---

## The situation

AI coding assistants became genuinely useful for operations work — if they could see our systems: deployments, dashboards, metrics. The naive path was every developer wiring assistants to internal tools with hand-made tokens: a security nightmare multiplying with every tool and every laptop.

## What I did

I built the company's MCP gateway (MCP is the open protocol AI assistants use to call external tools): one stable, secure address per environment through which any assistant can reach our deployment system, dashboards, and metrics. Developers authenticate with the AWS identity they already have — no new tokens exist at all.

Behind the gateway, every backend is deliberately blunted: the deployment tool is read-only in production, the dashboard tool has writing disabled and only a safe subset of its capabilities exposed. Access for every developer is granted through our normal identity platform, in code.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — MCP GATEWAY · REQUEST PATH</div>
  <svg aria-label="MCP gateway flow from client to production tools" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 628" style="display:block; width:100%; height:auto; max-width:720px; margin:0 auto" role="img"><defs><marker id="arrGW" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--w5, rgba(255,255,255,0.5))"></path></marker></defs><rect x="140" y="10" width="320" height="58" rx="6" fill="var(--bg, #0B1220)" stroke="var(--ab4, rgba(96,165,250,0.4))" stroke-width="1"></rect><text x="300" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--w88, rgba(255,255,255,0.88))">OpenCode or Cursor</text><text x="300" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--w45, rgba(255,255,255,0.45))">MCP client</text><path d="M300,68 L300,92" stroke="var(--w42, rgba(255,255,255,0.42))" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="94" width="320" height="40" rx="6" fill="var(--bg, #0B1220)" stroke="var(--ab4, rgba(96,165,250,0.4))" stroke-width="1"></rect><text x="300" y="119" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--w88, rgba(255,255,255,0.88))">local AWS signing bridge</text><path d="M300,134 L300,158" stroke="var(--w42, rgba(255,255,255,0.42))" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="160" width="320" height="58" rx="6" fill="var(--bg, #0B1220)" stroke="var(--ab4, rgba(96,165,250,0.4))" stroke-width="1"></rect><text x="300" y="183" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--w88, rgba(255,255,255,0.88))">API Gateway</text><text x="300" y="201" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--w45, rgba(255,255,255,0.45))">IAM-authorized</text><path d="M300,218 L300,242" stroke="var(--w42, rgba(255,255,255,0.42))" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="244" width="320" height="58" rx="6" fill="var(--bg, #0B1220)" stroke="var(--ab4, rgba(96,165,250,0.4))" stroke-width="1"></rect><text x="300" y="267" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--w88, rgba(255,255,255,0.88))">Frontdoor Lambda</text><text x="300" y="285" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--w45, rgba(255,255,255,0.45))">re-signs for the gateway service</text><path d="M300,302 L300,326" stroke="var(--w42, rgba(255,255,255,0.42))" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="328" width="320" height="40" rx="6" fill="var(--bg, #0B1220)" stroke="var(--ab4, rgba(96,165,250,0.4))" stroke-width="1"></rect><text x="300" y="353" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--w88, rgba(255,255,255,0.88))">AgentCore gateway</text><path d="M300,368 L300,392" stroke="var(--w42, rgba(255,255,255,0.42))" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="394" width="320" height="58" rx="6" fill="var(--bg, #0B1220)" stroke="var(--ab4, rgba(96,165,250,0.4))" stroke-width="1"></rect><text x="300" y="417" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--w88, rgba(255,255,255,0.88))">Per-target API</text><text x="300" y="435" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--w45, rgba(255,255,255,0.45))">JWT protected</text><path d="M300,452 L300,476" stroke="var(--w42, rgba(255,255,255,0.42))" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="478" width="320" height="58" rx="6" fill="var(--bg, #0B1220)" stroke="var(--ab4, rgba(96,165,250,0.4))" stroke-width="1"></rect><text x="300" y="501" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--w88, rgba(255,255,255,0.88))">Proxy Lambda</text><text x="300" y="519" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--w45, rgba(255,255,255,0.45))">in VPC</text><path d="M300,536 L300,560" stroke="var(--w42, rgba(255,255,255,0.42))" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="562" width="320" height="58" rx="6" fill="var(--bg, #0B1220)" stroke="var(--ab4, rgba(96,165,250,0.4))" stroke-width="1"></rect><text x="300" y="585" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--w88, rgba(255,255,255,0.88))">ArgoCD · Grafana · Prometheus</text><text x="300" y="603" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--w45, rgba(255,255,255,0.45))">MCP services</text><rect x="500" y="319" width="210" height="58" rx="6" fill="var(--bg, #0B1220)" stroke="var(--ab4, rgba(96,165,250,0.4))" stroke-width="1" stroke-dasharray="4 4"></rect><text x="605" y="342" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--w7, rgba(255,255,255,0.7))">OAuth</text><text x="605" y="360" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--w45, rgba(255,255,255,0.45))">machine-to-machine</text><path d="M460,348 L498,348" stroke="var(--w42, rgba(255,255,255,0.42))" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrGW)"></path><text x="605" y="393" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--w55, rgba(255,255,255,0.55))">per-target token</text></svg>
</div>

Connecting a client is a few lines — the committed example our developers copy (here for OpenCode; Cursor uses the same command in its own config):

```jsonc title="opencode.jsonc"
{
  "mcp": {
    "platform-tools-dev": {
      "type": "local",
      "command": [
        "uvx", "mcp-proxy-for-aws",
        "https://gateway.dev.example.com/mcp",
        "--service", "execute-api",
        "--region", "eu-west-1",
        "--profile", "development"
      ]
    }
  }
}
```

Same pattern for staging, operations, and production — only the URL and profile change. Rolled out to all four environments; our repositories now instruct AI agents to prefer the gateway over raw command-line access.

> The gnarliest bug was cryptographic: requests are signed by the client for the public address, but the AWS service behind it requires a different signature — so the front door strips and re-signs every request in flight.
>
> And when an upstream tool suddenly rejected all proxied traffic (a new security feature couldn't know our gateway hostname was legitimate), the fix required understanding exactly which protection layer was redundant behind our signing — and disabling only that one.

## The interesting part

The whole design is one stable door, many safe backends. The hard part wasn't just making the proxy work; it was making the security model obvious enough that the repository itself can tell developers how to use it.

## What it changed

Developers gained one governed path from AI assistants to operational tooling, using existing identity and backend restrictions instead of per-tool credentials on each laptop.
