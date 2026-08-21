---
number: 22
slug: safe-ai-tooling-for-every-developer
title: Safe AI tooling for every developer
summary: Nothing new to leak, nothing to rotate, one governed door instead of a hundred hand-made ones.
topics:
  - ai
  - security
  - developer experience
featured: true
spotlight: false
---

## THE SITUATION

AI coding assistants became genuinely useful for operations work — if they could see our systems: deployments, dashboards, metrics. The naive path was every developer wiring assistants to internal tools with hand-made tokens: a security nightmare multiplying with every tool and every laptop.

## WHAT I DID

I built the company's MCP gateway (MCP is the open protocol AI assistants use to call external tools): one stable, secure address per environment through which any assistant can reach our deployment system, dashboards, and metrics. Developers authenticate with the AWS identity they already have — no new tokens exist at all.

Behind the gateway, every backend is deliberately blunted: the deployment tool is read-only in production, the dashboard tool has writing disabled and only a safe subset of its capabilities exposed. Access for every developer is granted through our normal identity platform, in code.

{% diagram "./mcp-gateway-flow.svg", "EXHIBIT — MCP GATEWAY · REQUEST PATH", "MCP gateway flow from client to production tools" %}

Connecting a client is a few lines — the committed example our developers copy (here for OpenCode; Cursor uses the same command in its own config):

```jsonc filename="opencode.jsonc"
{
  "mcp": {
    "sre-mcp-dev": {
      "type": "local",
      "command": [
        "uvx", "mcp-proxy-for-aws",
        "https://sre.mcp.dev.<internal-domain>/mcp",
        "--service", "execute-api",
        "--region", "eu-west-1",
        "--profile", "dev"
      ]
    }
  }
}
```

Same pattern for staging, operations, and production — only the URL and profile change. Rolled out to all four environments; our repositories now instruct AI agents to prefer the gateway over raw command-line access.

> The gnarliest bug was cryptographic: requests are signed by the client for the public address, but the AWS service behind it requires a different signature — so the front door strips and re-signs every request in flight.
>
> And when an upstream tool suddenly rejected all proxied traffic (a new security feature couldn't know our gateway hostname was legitimate), the fix required understanding exactly which protection layer was redundant behind our signing — and disabling only that one.

## THE INTERESTING PART

The whole design is one stable door, many safe backends. The hard part wasn't just making the proxy work; it was making the security model obvious enough that the repository itself can tell developers how to use it.

## WHAT IT CHANGED

The company got AI-assistant access to production tooling that is safe by default: nothing new to leak, nothing to rotate, one governed door instead of a hundred hand-made ones. Every developer has it; the security team can sleep.
