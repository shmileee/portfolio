---
number: 23
slug: a-codebase-whose-newest-users-are-ai-agents
title: A codebase whose newest users are AI agents
summary: Every merge still crosses the same gates as human work.
topics:
  - ai
  - developer experience
  - security
featured: true
spotlight: false
---

## THE SITUATION

By 2025, AI coding agents were doing real work in our repositories — and treating that as an unmanaged phenomenon is how you get agents running `terraform apply` from a laptop or "helpfully" renaming something forty consumers depend on. New kind of user, same old platform question: what does it take for this user to act safely by default?

## WHAT I DID

I treated agents as first-class users of the codebase and built them the same four things every user needs — a map, safe tools, encoded judgment, and supervision:

1. **A map.** I wrote the `AGENTS.md` files for the core platform repositories, with a deliberate philosophy stated in the file itself: *"this file only flags things that aren't obvious from any single doc"* — no duplicated documentation that rots, just the traps: which contracts break consumers silently, where local access comes from, what a repository must never contain. The convention is hierarchical — a nested file deeper in the tree overrides the top-level one — so guidance lives next to what it guards.

2. **Safe tools.** The repositories ship *committed* AI-client configurations pointing at the MCP gateway ([case study 22](/#study-22)) — and the map says it outright: *"prioritize using these MCP servers instead of relying on raw CLI commands."* Only the development environment is enabled by default; production access is a deliberate opt-in. An agent cloning the repository is configured for the governed path before it does anything at all.

3. **Judgment, encoded as skills.** For the recurring campaign work I wrote reusable playbooks an agent executes under supervision — each with hard limits written in imperatives: the dependency-update skill ([case study 8](/#study-8)) touches only bot-authored pull requests, caps its fix attempts at two cycles, and "never runs unattended"; the stack-migration skill is *hold-by-default* ("copy state, never move" — the old state stays byte-for-byte as rollback; anything but a tags-only plan diff stops the run); the image-maintenance skill enforces that published versions can never change. The skills have lifecycles too: one was hardened mid-campaign as failures taught lessons, then retired together with the pipeline it served.

4. **Supervision as structure.** Campaign work runs as one unit per pull request with the existing gates doing the judging — the Terraform plan or rendered diff decides, not the agent's confidence. Auto-fix commits are tagged to prevent CI from re-triggering itself in a loop. Campaign runbooks are committed documents in the repository, not chat history.

{% diagram "./agent-workflow-path.svg", "EXHIBIT — THE AGENT PATH", "Agent workflow from map to human merge gate" %}

## WHAT IT CHANGED

Agent-assisted work stopped being a personal experiment and became a platform capability: fleet-wide migrations run as supervised campaigns at many times human pace, every merge still crosses the same gates as human work — and the guidance, tools, and limits live in the repository, versioned, where the next agent (and the next engineer) finds them.
