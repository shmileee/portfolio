---
title: A codebase whose newest users are AI agents
summary: AGENTS.md maps, committed MCP configurations, supervised skills with hard limits and the existing merge gates make AI agents safe users of the platform repositories.
role: Defined repository guidance, safe-tool defaults, supervised skills, and merge controls for agent-assisted work.
evidence: Repository-local maps and playbooks route every change through the same plans, diffs, CI, and human merge gate.
period: "2025"
topics:
  - ai
  - devex
  - security
order: 22
aliases:
  - 23-a-codebase-whose-newest-users-are-ai-agents
  - agent-ready-codebase
featured: true
spotlight: false
---

## The situation

By 2025, AI coding agents were doing real work in our repositories. Treated as an unmanaged phenomenon, that ends with an agent running `terraform apply` from a laptop, or "helpfully" renaming something forty consumers depend on. A new kind of user, and the same old platform question: what does it take for this user to act safely by default?

## What I did

I treated agents as first-class users of the codebase and built them the same four things every user needs: a map, safe tools, encoded judgment, and supervision.

### A map

I wrote the `AGENTS.md` files for the core platform repositories, with the philosophy stated in the file itself: "this file only flags things that aren't obvious from any single doc". No duplicated documentation that rots, just the traps: which contracts break consumers silently, where local access comes from, what a repository must never contain. The convention is hierarchical, a nested file deeper in the tree overrides the top-level one, so guidance lives next to what it guards.

### Safe tools

The repositories ship committed AI-client configurations pointing at the [MCP gateway](/case-studies/safe-ai-tooling-for-every-developer/), and the map says it outright: "prioritize using these MCP servers instead of relying on raw CLI commands." Only the development environment is enabled by default; production access is a deliberate opt-in. An agent cloning the repository is configured for the governed path before it does anything at all.

### Judgment, encoded as skills

For the recurring campaign work I wrote reusable playbooks an agent executes under supervision, each with hard limits written in imperatives. The [dependency-update skill](/case-studies/dependency-updates-from-quarterly-panic-to-background-noise/) touches only bot-authored pull requests, caps its fix attempts at two cycles, and "never runs unattended". The stack-migration skill is hold-by-default: "copy state, never move", so the old state stays byte for byte as the rollback, and anything but a tags-only plan diff stops the run. The image-maintenance skill enforces that published versions can never change. The skills have lifecycles too: one was hardened mid-campaign as failures taught lessons, then retired together with the pipeline it served.

### Supervision as structure

Campaign work runs as one unit per pull request, with the existing gates doing the judging: the Terraform plan or the rendered diff decides, not the agent's confidence. Auto-fix commits are tagged so CI does not re-trigger itself in a loop. Campaign runbooks are committed documents in the repository, not chat history.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — THE AGENT PATH</div>
  <svg aria-label="An AI agent reads the map in AGENTS.md, uses the committed MCP configurations, follows skills with hard limits, and its change goes through the existing gates: a plan or rendered diff and review; a provable no-op merges, anything else is held for a human" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 510" role="img"><defs><marker id="arrAG" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="190" y="10" width="340" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="35" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">AI agent</text><path d="M360,50 L360,74" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrAG)"></path><rect x="190" y="76" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="99" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">The map</text><text x="360" y="117" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">AGENTS.md: traps, contracts, nothing that rots</text><path d="M360,134 L360,158" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrAG)"></path><rect x="190" y="160" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="183" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Safe tools</text><text x="360" y="201" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">committed MCP configs · dev-only by default</text><path d="M360,218 L360,242" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrAG)"></path><rect x="190" y="244" width="340" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="267" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Encoded judgment</text><text x="360" y="285" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">skills with hard limits:</text><text x="360" y="303" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">hold-by-default, never unattended</text><path d="M360,318 L360,342" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrAG)"></path><rect x="190" y="344" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="367" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Existing gates decide</text><text x="360" y="385" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">plan · rendered diff · review</text><path d="M360,402 L360,430" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M360,430 L200,430 L200,458" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrAG)"></path><path d="M360,430 L520,430 L520,458" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrAG)"></path><text x="268" y="424" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--color-text-muted)">provable no-op</text><text x="452" y="424" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--color-text-muted)">anything else</text><rect x="125" y="460" width="150" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent-border)" stroke-width="1"></rect><text x="200" y="485" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-accent)">Merge</text><rect x="415" y="460" width="210" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="520" y="485" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Held for a human</text></svg>
</div>

## What it changed

Agent-assisted work became a supervised platform capability. Campaign changes cross the same plans, rendered diffs, CI checks and human merge gates as any other work, and the guidance and limits are versioned beside the code they govern.
