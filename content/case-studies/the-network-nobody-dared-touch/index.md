---
title: The network nobody dared touch
summary: A transit-gateway mesh built from about 15 module copies, with routes tracked by list position, became explicit resources with stable identities and then one Cloud WAN policy with four segments.
role: Rebuilt the route model, led the no-change migration and drove the Cloud WAN architecture.
evidence: The migration plan was a proven no-op; one policy document replaced about 15 module copies; production and non-production traffic cannot mix unless the policy says so.
topics:
  - networking
  - reliability
order: 13
aliases:
  - 13-the-network-nobody-dared-touch
  - network-rebuild
featured: true
spotlight: false
---

## The situation

All our AWS networks were interconnected through a transit-gateway setup built from about 15 copies of a community module. Routes were tracked by their position in a list, so adding one network range made the plan propose destroying and recreating production routes. That blast radius kept the stack effectively frozen for years.

The fear was structural, not personal. With a transit gateway all the wiring is yours: a route table per attachment, hand-managed propagation, and no concept of "environment" beyond the discipline of whoever edits the routes.

## What I did

Two moves: first make it safe, then make it better.

### Make it safe

I replaced the module maze with plain, explicit resources where every route has a stable identity. Changing one range now touches exactly one route.

### Make it better

I designed and drove our move to AWS Cloud WAN, the managed evolution of the transit gateway, and better in exactly the ways that had hurt us.

The network is one reviewable document. Segments (production, non-production, shared, and a quarantine for anything unrecognised) and the rules for joining them live in a single policy definition, in git, instead of being implied by dozens of route tables.

Joining is by policy, not by hand. An attachment is admitted to a segment only if it carries the right tag and comes from the right account; anything unknown lands in quarantine with no connectivity. Nobody edits another account's route tables any more.

Real separation. Production and non-production traffic cannot mix unless the policy says so, a property the transit-gateway mesh never had.

Managed and multi-region. AWS runs the core network with an edge in each region we need, so expanding to a new region is a policy change, not a peering project. We also evaluated AWS's Network Orchestration for Transit Gateway solution and rejected it: too many moving parts to own.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">BEFORE · ROUTES TRACKED BY LIST POSITION</div>
  <svg aria-label="Three routes indexed zero to two; inserting one range at index one shifts the others, and the plan destroys and recreates the production routes behind them" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 150" role="img"><defs><marker id="arrNB" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="20" y="10" width="320" height="128" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Routes by list index</text><text x="180" y="61" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[0] → 10.1.0.0/16</text><text x="180" y="83" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[1] → 10.2.0.0/16</text><text x="180" y="105" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[2] → 10.3.0.0/16</text><text x="180" y="127" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--color-text-muted)">× 15 module copies</text><path d="M340,74 L372,74" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrNB)"></path><rect x="380" y="10" width="320" height="128" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="540" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Add one range</text><text x="540" y="61" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[1] → 10.1.5.0/24  new</text><text x="540" y="83" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[2] → 10.2.0.0/16  destroyed, recreated</text><text x="540" y="105" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[3] → 10.3.0.0/16  destroyed, recreated</text><text x="540" y="127" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--color-text-muted)">the plan touches production</text></svg>

  <div class="diagram-exhibit-label diagram-exhibit-label-secondary">AFTER · ONE POLICY, FOUR SEGMENTS</div>
  <svg aria-label="One core network policy in git feeds four segments: production, non-production, shared and quarantine; an attachment is admitted by its tag and account, and anything unknown lands in quarantine" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 196" role="img"><defs><marker id="arrNA" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="20" y="10" width="680" height="44" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="37" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Core network policy · one document, in git</text><path d="M99,54 L99,78" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrNA)"></path><path d="M269,54 L269,78" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrNA)"></path><path d="M439,54 L439,78" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrNA)"></path><path d="M609,54 L609,78" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrNA)"></path><rect x="20" y="80" width="158" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="99" y="103" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">production</text><text x="99" y="121" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">production accounts</text><rect x="190" y="80" width="158" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="269" y="103" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">non-production</text><text x="269" y="121" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">development, staging</text><rect x="360" y="80" width="158" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="439" y="103" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">shared</text><text x="439" y="121" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">tooling both may reach</text><rect x="530" y="80" width="158" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="609" y="103" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">quarantine</text><text x="609" y="121" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">anything unrecognised</text><text x="360" y="176" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-muted)">an attachment joins by tag + account; unknown → quarantine, no connectivity</text></svg>
</div>

## The interesting part

The migration to the new code had to move live production routing with no infrastructure change applied. I generated an explicit state map from every old resource to its new address, opened a deliberately unmergeable demonstration pull request to prove the plan was a no-op, wrote a rollback runbook, landed the real change, and deleted the scaffolding.

## What it changed

Network changes are reviewable at resource and policy level, dependency updates and colleague-authored changes use the same plan-and-review path as the rest of the estate, production and non-production have explicit separation, and a new environment joins the network programmatically.
