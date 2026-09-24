---
title: Safe AI tooling for every developer
summary: An MCP gateway per environment gives every AI assistant one governed path to deployments, dashboards and metrics, authenticated with the AWS identity developers already have and backed by deliberately blunted tools.
role: Designed and built the gateway, its signing front door and the restricted backends; wrote the repository guidance and the supervised skills that keep agent work inside the existing gates.
evidence: Rolled out to four environments with no new credentials anywhere; the deployment tool is read-only in production, and agent campaigns land as pull requests behind the existing merge gate.
period: "2025"
topics:
  - ai
  - security
  - devex
order: 17
aliases:
  - 22-safe-ai-tooling-for-every-developer
  - ai-tooling
  - a-codebase-whose-newest-users-are-ai-agents
  - 23-a-codebase-whose-newest-users-are-ai-agents
  - agent-ready-codebase
featured: true
spotlight: false
---

## The situation

AI coding assistants became useful for operations work once they could see our systems: deployments, dashboards, metrics. The naive path was every developer wiring assistants to internal tools with hand-made tokens, a problem that multiplies with every tool and every laptop.

By 2025 the same assistants were doing real work inside the platform repositories. Left unmanaged, that ends with an agent running `terraform apply` from a laptop, or renaming a contract that consumers depend on silently.

## What I did

### One door, many safe backends

I built the company's MCP gateway. MCP is the open protocol AI assistants use to call external tools; the gateway is one stable, secure address per environment through which any assistant can reach our deployment system, dashboards and metrics. Developers authenticate with the AWS identity they already have, so no new tokens exist at all.

Behind the gateway, every backend is deliberately blunted: the deployment tool is read-only in production, and the dashboard tool has writing disabled and only a safe subset of its capabilities exposed. Access for every developer is granted through our normal identity platform, in code.

The request path: the client signs each request for the public API Gateway with the developer's AWS identity; a front-door function re-signs it for the AgentCore gateway behind it, Amazon's managed MCP gateway service; that gateway holds one JWT-protected target per tool and reaches each backend through a proxy function inside the VPC, with a machine-to-machine OAuth token per target.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — MCP GATEWAY · REQUEST PATH</div>
  <svg aria-label="An MCP client in OpenCode or Cursor signs requests through a local AWS signing bridge to an IAM-authorized API Gateway; a front-door function re-signs them for the AgentCore gateway, which holds a JWT-protected target per tool and reaches the Argo CD, Grafana and Prometheus MCP services through a proxy function inside the VPC with a machine-to-machine OAuth token per target" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 628" role="img"><defs><marker id="arrGW" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="140" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">OpenCode or Cursor</text><text x="300" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">MCP client</text><path d="M300,68 L300,92" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="94" width="320" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="119" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">local AWS signing bridge</text><path d="M300,134 L300,158" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="160" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="183" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">API Gateway</text><text x="300" y="201" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">IAM-authorized</text><path d="M300,218 L300,242" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="244" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="267" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Frontdoor Lambda</text><text x="300" y="285" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">re-signs for the gateway service</text><path d="M300,302 L300,326" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="328" width="320" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="353" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">AgentCore gateway</text><path d="M300,368 L300,392" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="394" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="417" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Per-target API</text><text x="300" y="435" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">JWT protected</text><path d="M300,452 L300,476" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="478" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="501" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Proxy Lambda</text><text x="300" y="519" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">in VPC</text><path d="M300,536 L300,560" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="562" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="585" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">ArgoCD · Grafana · Prometheus</text><text x="300" y="603" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">MCP services</text><rect x="500" y="319" width="210" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="605" y="342" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">OAuth</text><text x="605" y="360" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">machine-to-machine</text><path d="M460,348 L498,348" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrGW)"></path><text x="605" y="393" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--color-text-muted)">per-target token</text></svg>
</div>

Connecting a client is a few lines, the committed example our developers copy. This is the OpenCode form; Cursor uses the same command in its own configuration:

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

The same pattern serves staging, operations and production; only the URL and the profile change. It is rolled out to all four environments, and our repositories now instruct AI agents to prefer the gateway over raw command-line access.

### The repositories that agents read

A gateway is only a door, so the repositories had to point at it. I wrote the `AGENTS.md` files for the core platform repositories, with the scope stated in the file itself: "this file only flags things that aren't obvious from any single doc". No duplicated documentation that rots, just the traps: which contracts break consumers silently, where local access comes from, what a repository must never contain. The convention is hierarchical, so a nested file deeper in the tree overrides the top-level one and the guidance sits next to what it guards.

The same repositories ship committed client configurations pointing at the gateway, and the map says it outright: "prioritize using these MCP servers instead of relying on raw CLI commands." Only the development environment is enabled by default; production access is a deliberate opt-in. An agent cloning the repository is configured for the governed path before it does anything at all.

### Judgment, encoded as skills

For recurring campaign work I wrote reusable playbooks an agent executes under supervision, each carrying hard limits as imperatives. The [dependency-update skill](/case-studies/dependency-updates-from-quarterly-panic-to-background-noise/) touches only bot-authored pull requests, caps its fix attempts at two cycles, and "never runs unattended". The stack-migration skill is hold-by-default: "copy state, never move", so the old state stays byte for byte as the rollback, and anything but a tags-only plan diff stops the run. The image-maintenance skill enforces that published versions can never change. One of them was hardened mid-campaign as failures taught lessons, then retired with the pipeline it served.

Campaign work runs as one unit per pull request and is judged by [the gates that were already there](/case-studies/making-infrastructure-changes-boring/): the Terraform plan or the rendered diff decides, not the agent's confidence. Auto-fix commits are tagged so CI does not re-trigger itself in a loop, and campaign runbooks are committed documents rather than chat history.

## Two bugs at the front door

The hardest bug was cryptographic. Requests are signed by the client for the public address, but the AWS service behind it requires a different signature, so the front door strips and re-signs every request in flight.

Then an upstream tool suddenly rejected all proxied traffic: a new security feature could not know that our gateway hostname was legitimate. The fix required understanding exactly which protection layer was redundant behind our own signing, and disabling only that one.

## What it changed

Developers have one governed path from AI assistants to operational tooling, using the identity and backend restrictions that already existed instead of per-tool credentials on each laptop. Agent-assisted work became a supervised platform capability: campaign changes cross the same plans, rendered diffs, CI checks and human merge gates as any other work, and the guidance and limits are versioned beside the code they govern.
