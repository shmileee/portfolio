---
title: Safe AI tooling for every developer
summary: "AI assistants gained a shared route to operational tools using developers’ existing AWS identities. Backend restrictions and repository playbooks keep access and infrastructure changes within defined controls."
role: "Built the MCP gateway and signing proxy, configured restricted backends, and wrote repository guidance and supervised automation playbooks."
evidence: "Gateway deployed across four environments; no additional per-tool credentials for developers; production deployment access is read-only and infrastructure changes use existing review gates."
period: 2025–2026
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

## Make operational access consistent across AI clients

AI assistants became more useful for operations when they could inspect deployments, dashboards, and metrics. Connecting each developer's assistant directly to every service would have scattered credentials and access configuration across laptops.

I built an MCP gateway with one endpoint per environment. MCP is the protocol assistants use to discover and call tools. Developers authenticate with their existing AWS identities, while the gateway handles the separate authentication needed to reach backend services.

The deployment covers four environments. Developers do not manage additional per-tool credentials; backend service credentials still exist and are managed centrally.

The committed client configuration makes that access practical. This OpenCode example uses an anonymized gateway hostname and AWS profile:

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

OpenCode launches the local proxy, which signs requests using the developer's existing AWS profile. The same command works in Cursor's MCP configuration. Connecting another environment changes the endpoint and profile; backend credentials remain managed by the gateway.

## Enforce access in the gateway and backends

The client signs its request for API Gateway using AWS SigV4. A front-door Lambda removes the incoming signing headers and signs a new request for AgentCore. AgentCore then routes tool calls through OAuth-protected target APIs and VPC proxy functions to the internal services.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — MCP GATEWAY · REQUEST PATH</div>
  <svg aria-label="An MCP client in OpenCode or Cursor signs requests through a local AWS signing bridge to an IAM-authorized API Gateway; a front-door function re-signs them for the AgentCore gateway, which holds a JWT-protected target per tool and reaches the Argo CD, Grafana and Prometheus MCP services through a proxy function inside the VPC with a machine-to-machine OAuth token per target" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 628" role="img"><defs><marker id="arrGW" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="140" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">OpenCode or Cursor</text><text x="300" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">MCP client</text><path d="M300,68 L300,92" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="94" width="320" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="119" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">local AWS signing bridge</text><path d="M300,134 L300,158" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="160" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="183" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">API Gateway</text><text x="300" y="201" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">IAM-authorized</text><path d="M300,218 L300,242" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="244" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="267" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Frontdoor Lambda</text><text x="300" y="285" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">re-signs for the gateway service</text><path d="M300,302 L300,326" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="328" width="320" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="353" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">AgentCore gateway</text><path d="M300,368 L300,392" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="394" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="417" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Per-target API</text><text x="300" y="435" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">JWT protected</text><path d="M300,452 L300,476" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="478" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="501" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Proxy Lambda</text><text x="300" y="519" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">in VPC</text><path d="M300,536 L300,560" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrGW)"></path><rect x="140" y="562" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="300" y="585" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">ArgoCD · Grafana · Prometheus</text><text x="300" y="603" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">MCP services</text><rect x="500" y="319" width="210" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="605" y="342" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">OAuth</text><text x="605" y="360" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">machine-to-machine</text><path d="M460,348 L498,348" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrGW)"></path><text x="605" y="393" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--color-text-muted)">per-target token</text></svg>
</div>

Re-signing is necessary because the client signature is bound to the public host and service. Passing it unchanged to AgentCore would fail authentication.

The backend configuration limits what a successfully authenticated caller can do:

**Production deployment backend.** Read-only tool access

**Dashboard backend.** Selected tool groups exposed; writes disabled

**Developer access.** Granted through the existing identity platform

**Committed client configuration.** Development enabled by default; production requires explicit opt-in

One upstream upgrade exposed a useful integration edge: the dashboard MCP server rejected requests carrying the gateway hostname. I adjusted its host check for the internal proxy path while retaining origin validation and gateway authentication. The distinction between these checks mattered more than simply making the error disappear.

## Give agents the repository context they need

I wrote `AGENTS.md` guidance for the core platform repositories, focusing on information an agent could not infer from a single file: contracts consumed by other repositories, generated paths, access conventions, and changes that require coordination.

For example, a Vault role declared in the Terraform repository is consumed by external-secret resources in the Kubernetes repository. Renaming it can break a consumer without changing that consumer’s files. The guidance names that contract and points to both sides, so an agent can identify the coordination required before editing.

Nested guidance keeps component-specific rules close to the code. Committed client configurations point assistants at the gateway, making the configured tool path available when work starts.

These instructions guide agent behavior. The backend permissions and deployment controls enforce the access boundaries.

## Encode recurring work in supervised playbooks

I also wrote playbooks for dependency updates, stack migrations, and image maintenance. Their limits follow the failure modes of each task:

**Dependency update.** Inspect the actual plan or rendered diff; stop after limited repair attempts

**Stack migration.** Copy state to the new backend; retain the old object; accept only the expected tag changes

**Image maintenance.** Publish changed content under a new immutable version

The stack-migration runbook makes the stopping condition concrete. Copy the state before opening the pull request, because Atlantis plans automatically and an empty destination would appear to need every resource created. Preserve module and provider versions during the move. The acceptance check permits only the expected `tags` and `tags_all` changes: zero creates, replacements, destroys, or other attribute changes. An unexpected diff starts an investigation into provider drift, aliases, module paths, or backend selection.

Campaigns run as reviewable pull requests through the [existing infrastructure workflow](/case-studies/making-infrastructure-changes-boring/). Plans, diffs, and CI results provide the evidence. Runbooks live beside the code, and autofix commits carry a marker to prevent the checks from repeatedly triggering themselves.

## What changed

Developers gained a consistent way to connect assistants to operational data using identities they already had. Repeated engineering tasks gained versioned instructions and explicit stopping conditions, while production tool restrictions and the established review process continued to govern what could change.
