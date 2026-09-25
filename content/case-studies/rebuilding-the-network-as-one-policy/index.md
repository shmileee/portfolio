---
title: Rebuilding the network as one reviewable policy
summary: "A fragile route model became safe to change through explicit resource identities. A separate Cloud WAN design then expressed network segmentation and attachment rules in one policy."
role: "Rebuilt the Terraform route model, proved the state migration with a no-op plan, and proposed the Cloud WAN design adopted by the team."
evidence: "A no-op plan verified the routing refactor; the Cloud WAN policy defines four segments and sends unmatched attachments to quarantine."
topics:
  - networking
  - reliability
order: 9
aliases:
  - the-network-nobody-dared-touch
  - 13-the-network-nobody-dared-touch
  - network-rebuild
featured: true
spotlight: false
---

## Remove the risk from an ordinary route change

Our AWS networks were connected through a transit-gateway configuration built from about 15 copies of a community module. Routes were identified by their position in lists. Adding a network range could shift those positions and cause Terraform to propose replacing unrelated production routes.

That behavior made even small changes difficult to approve. I separated the work into two steps: stabilize Terraform's representation of the existing network, then redesign how the network expressed connectivity.

## Prove the refactor preserves live routing

I replaced the module copies with explicit resources and stable route identities. A change to one range could then be reviewed without unrelated routes moving because of list order.

The migration needed evidence before it touched the state. I mapped every old resource address to its new address and opened a demonstration pull request that could not be merged accidentally. Its plan showed no infrastructure changes after the state mapping. I documented rollback, landed the refactor, and removed the temporary demonstration code.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">BEFORE · ROUTES TRACKED BY LIST POSITION</div>
  <svg aria-label="Three routes indexed zero to two; inserting one range at index one shifts the others, and the plan destroys and recreates the production routes behind them" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 150" role="img"><defs><marker id="arrNB" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="20" y="10" width="320" height="128" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Routes by list index</text><text x="180" y="61" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[0] → 10.1.0.0/16</text><text x="180" y="83" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[1] → 10.2.0.0/16</text><text x="180" y="105" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[2] → 10.3.0.0/16</text><text x="180" y="127" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--color-text-muted)">× 15 module copies</text><path d="M340,74 L372,74" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrNB)"></path><rect x="380" y="10" width="320" height="128" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="540" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Add one range</text><text x="540" y="61" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[1] → 10.1.5.0/24  new</text><text x="540" y="83" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[2] → 10.2.0.0/16  destroyed, recreated</text><text x="540" y="105" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">route[3] → 10.3.0.0/16  destroyed, recreated</text><text x="540" y="127" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--color-text-muted)">the plan touches production</text></svg>


</div>

The no-op proof applied to this representation change. The subsequent Cloud WAN redesign was a separate architectural change.

## Express connectivity as policy

I proposed AWS Cloud WAN, and the team adopted the design. We also evaluated a transit-gateway orchestration solution, but it would have left us operating more of the coordination machinery ourselves.

The Cloud WAN policy defines production, non-production, shared services, and quarantine. Production and non-production each exchange routes with shared services; quarantine shares no routes and isolates its attachments from one another.

Production and non-production are not directly shared with each other. Attachment rules check both the owning account and the requested segment tag; unmatched combinations fall through to quarantine. A tag alone is insufficient to grant connectivity.

<figure class="concept-diagram" data-concept-diagram>
<div class="diagram-exhibit" data-exhibit>
<div class="diagram-exhibit-label">CLOUD WAN · FOUR SEGMENTS, EXPLICIT SHARING</div>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 670" role="img" aria-labelledby="cloud-wan-segments-title cloud-wan-segments-desc">
<title id="cloud-wan-segments-title">Cloud Wan Segments</title>
<desc id="cloud-wan-segments-desc">One AWS Cloud WAN policy defines four segments. Production and non-production each exchange routes with shared services, with no direct route sharing between production and non-production. Attachment membership checks both account and requested segment tag. Unmatched attachments enter quarantine, which shares no routes with other segments and isolates its attachments from each other. This diagram shows the policy relationships, not a live attachment inventory.</desc>
<defs>
<marker id="cloud-wan-segments-accent" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="var(--color-accent)"/></marker>
<marker id="cloud-wan-segments-muted" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="var(--color-text-subtle)"/></marker>
</defs>
<rect x="24" y="16" width="672" height="82" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="360.0" y="45" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-accent)">One core network policy</text>
<text x="360.0" y="69" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Membership checks account + requested segment tag</text>
<rect x="24" y="126" width="672" height="336" rx="10" fill="none" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="44" y="153" text-anchor="start" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-accent)">EXPLICIT ROUTE SHARING</text>
<rect x="248" y="178" width="224" height="82" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="360.0" y="207" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-accent)">Shared services</text>
<text x="360.0" y="231" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Common platform services</text>
<rect x="44" y="338" width="254" height="96" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="171.0" y="367" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Production</text>
<text x="171.0" y="391" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Production workloads</text>
<rect x="422" y="338" width="254" height="96" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="549.0" y="367" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Non-production</text>
<text x="549.0" y="391" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Development + staging</text>
<path d="M174 332 L300 266" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#cloud-wan-segments-accent)" marker-start="url(#cloud-wan-segments-accent)"/>
<path d="M546 332 L420 266" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#cloud-wan-segments-accent)" marker-start="url(#cloud-wan-segments-accent)"/>
<text x="182" y="287" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">shared routes</text>
<text x="538" y="287" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">shared routes</text>
<path d="M310 381 H340" fill="none" stroke="var(--color-text-subtle)" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="5 5"/>
<path d="M380 381 H410" fill="none" stroke="var(--color-text-subtle)" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="5 5"/>
<path d="M354 372 L366 384 M366 372 L354 384" fill="none" stroke="var(--color-text-subtle)" stroke-width="1.8" stroke-linejoin="round"/>
<text x="360" y="408" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" font-weight="400" fill="var(--color-text-subtle)">NO DIRECT</text>
<text x="360" y="423" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" font-weight="400" fill="var(--color-text-subtle)">SHARING</text>
<rect x="24" y="498" width="672" height="154" rx="10" fill="none" stroke="var(--color-text-subtle)" stroke-width="1.4" stroke-dasharray="6 5"/>
<text x="44" y="526" text-anchor="start" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-subtle)">QUARANTINE · UNMATCHED ATTACHMENTS</text>
<rect x="44" y="544" width="254" height="64" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4" stroke-dasharray="6 5"/>
<text x="171.0" y="573" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Attachment A</text>
<text x="171.0" y="597" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Isolated</text>
<rect x="422" y="544" width="254" height="64" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4" stroke-dasharray="6 5"/>
<text x="549.0" y="573" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Attachment B</text>
<text x="549.0" y="597" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Isolated</text>
<path d="M354 572 L366 584 M366 572 L354 584" fill="none" stroke="var(--color-text-subtle)" stroke-width="1.8" stroke-linejoin="round"/>
<text x="360" y="636" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">No segment sharing · attachments isolated from each other</text>
</svg>
</div>
<figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — Production and non-production each share routes with shared services. Unmatched account-and-tag combinations enter quarantine. Route sharing and attachment admission are defined separately in the same policy.</figcaption>
</figure>

This also changes regional expansion. The core network's regions and segment rules are reviewed in the policy, and a new [cell](/case-studies/environments-you-can-create-and-destroy-with-one-command/) can request its attachment through Terraform.

## What changed

The first step made an existing production network maintainable again, with a state migration demonstrated before it was applied. The Cloud WAN design gave the team an explicit, reviewable model for network membership and separation. These address different risks: unintended resource replacement during a refactor, and unintended connectivity as the platform grows.
