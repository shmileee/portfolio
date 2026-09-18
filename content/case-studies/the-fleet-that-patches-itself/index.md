---
title: The fleet that patches itself while engineers are watching
summary: OS security releases trigger image builds; nodes rotate onto the patched image within hours in lower environments and after one reviewed merge in production, always inside on-call coverage hours.
role: Wrote the architecture and rotation policy; co-built the event-driven image pipeline with two teammates.
evidence: 07:00–20:00 weekday coverage, an 18:00 rotation cutoff, and pool-specific disruption budgets.
topics:
  - security
  - reliability
order: 12
aliases:
  - 12-the-fleet-that-patches-itself
  - fleet-patching
featured: true
spotlight: false
---

## The situation

We built security-patched machine images for our Kubernetes nodes, and then discovered they were not reaching the nodes. Rotation was effectively off: replacement budgets set to zero, one production pool allowed a two-hour window per week (months to rotate the whole pool), and the monitoring nodes configured to rotate during business hours, risking metric gaps in the middle of an incident.

Patched images existed; nothing consumed them.

## What I did

I wrote the design that connected the two ends, an event-driven image pipeline feeding a deliberately scheduled node-rotation policy, and drove it with seven colleagues as named reviewers. The build pipeline itself was co-built with two teammates.

### The build side

The build is event-driven. When the OS vendor announces a security release, through its public notification feed, or the upstream Kubernetes node image changes, which a poller watching the public parameter notices, the pipeline wakes up on its own. It builds our patched image on top of the upstream one, applying security updates only. The container runtime, kubelet and kernel stay untouched, so we never diverge from what the cloud provider validated. The result is published per environment, and a failed build retries on the next cycle.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — BUILD SIDE · EVENT-DRIVEN</div>
  <svg aria-label="Two triggers, an OS security release and an upstream image change, start one image build that applies security updates only and publishes a dated image per environment" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 332" role="img"><defs><marker id="arrFB" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted))"></path></marker></defs><rect x="20" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1"></rect><text x="180" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text))">OS security release</text><text x="180" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle))">public notification feed</text><rect x="380" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1"></rect><text x="540" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text))">Upstream EKS image change</text><text x="540" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle))">public parameter, polled</text><path d="M180,68 L180,92 L360,92" stroke="var(--color-border))" stroke-width="1.2" fill="none"></path><path d="M540,68 L540,92 L360,92" stroke="var(--color-border))" stroke-width="1.2" fill="none"></path><path d="M360,92 L360,116" stroke="var(--color-border))" stroke-width="1.2" fill="none" marker-end="url(#arrFB)"></path><rect x="190" y="118" width="340" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1"></rect><text x="360" y="141" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text))">Image build</text><text x="360" y="159" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle))">security updates only</text><text x="360" y="177" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle))">runtime, kubelet, kernel untouched</text><path d="M360,192 L360,216" stroke="var(--color-border))" stroke-width="1.2" fill="none" marker-end="url(#arrFB)"></path><rect x="190" y="218" width="340" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1"></rect><text x="360" y="243" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text))">Patched image, dated</text><path d="M360,258 L360,282" stroke="var(--color-border))" stroke-width="1.2" fill="none" marker-end="url(#arrFB)"></path><rect x="190" y="284" width="340" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1"></rect><text x="360" y="309" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text))">Published per environment</text></svg>
</div>

### The consumption side

Consumption uses Karpenter's drift mechanism. Karpenter is the node autoscaler; a node whose image no longer matches the declared spec is flagged as drifted and replaced. The design decides when that happens.

Development and staging track new images instantly through a name-pattern match, so nodes start rotating minutes after a build. Production pins exact image IDs, and the [dependency bot](/case-studies/dependency-updates-from-quarterly-panic-to-background-noise/) proposes the bump as a pull request. The merge button is the deployment gate: human review, full audit trail, no custom tooling.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — CONSUMPTION SIDE · SCHEDULED DRIFT</div>
  <svg aria-label="Development and staging drift instantly on a name pattern; production pins an image ID that a bot bumps in a pull request; rotation is budget-limited within coverage hours, drains are gated by disruption rules, and a stuck termination alerts after 12 hours" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 324" role="img"><defs><marker id="arrFC" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted))"></path></marker></defs><rect x="20" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1"></rect><text x="180" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text))">dev / staging</text><text x="180" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle))">name-pattern match → instant drift</text><rect x="380" y="10" width="320" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1"></rect><text x="540" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text))">production</text><text x="540" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle))">pinned ID → bot opens pull request</text><text x="540" y="69" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle))">→ human merges</text><path d="M180,68 L180,100 L360,100" stroke="var(--color-border))" stroke-width="1.2" fill="none"></path><path d="M540,84 L540,100 L360,100" stroke="var(--color-border))" stroke-width="1.2" fill="none"></path><path d="M360,100 L360,124" stroke="var(--color-border))" stroke-width="1.2" fill="none" marker-end="url(#arrFC)"></path><rect x="190" y="126" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1"></rect><text x="360" y="149" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text))">Budget-limited rotation</text><text x="360" y="167" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle))">coverage-hours schedule · per-pool exceptions</text><path d="M360,184 L360,208" stroke="var(--color-border))" stroke-width="1.2" fill="none" marker-end="url(#arrFC)"></path><rect x="190" y="210" width="340" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1"></rect><text x="360" y="235" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text))">Disruption-rule-gated drain</text><path d="M360,250 L360,274" stroke="var(--color-border))" stroke-width="1.2" fill="none" marker-end="url(#arrFC)"></path><rect x="190" y="276" width="340" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1"></rect><text x="360" y="301" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text))">Patched fleet</text><rect x="550" y="201" width="168" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent))" stroke-width="1" stroke-dasharray="4 4"></rect><text x="634" y="224" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body))">Stuck termination</text><text x="634" y="242" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle))">alert + runbook</text><path d="M530,230 L548,230" stroke="var(--color-border))" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrFC)"></path><text x="634" y="276" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--color-text-muted))">stuck over 12 h</text></svg>
</div>

### When rotation happens

The core principle from the design document: drift is a controlled, planned operation triggered by a known image change, so it happens during coverage hours. Our two on-call regions cover 07:00–20:00 on weekdays, and rotation windows close at 18:00, two hours before coverage ends, so a bad image is caught on shift and never discovered by the night. Weekends are blocked; the design document puts it as "no one gets paged on weekends for node rotation". One deliberate inversion: the development Kafka brokers rotate on weekends, because a rebalance hurts developers more on a Tuesday than on a Saturday.

Budgets control parallelism and pod-disruption rules protect individual services. A percentage cap decides how many nodes churn at once; per-service rules serialise replicas of the same service while different services drain in parallel. Special pools get special treatment: the metrics store rotates one node at a time, databases stagger per availability zone in pre-dawn slots, and one streaming workload blocks drift entirely, because its own operator migrates jobs on demand instead.

A safety-net alert fires if any node's termination has been stuck for over 12 hours, with a runbook for the usual suspects: blocking disruption rules, crash-looping pods, stuck volumes.

## The interesting part

The schedule arithmetic is where the craft hides. The scheduler reads times in UTC with no daylight-saving handling, so the windows are set to the intersection of summer and winter coverage, safe in both. The whole policy is a handful of declarative budget blocks in the chart values, reviewed like any other code: the on-call calendar, encoded.

## What it changed

Node patching went from "images exist, nobody consumes them" to a self-feeding loop: the vendor announces a fix, the fleet is rotating onto it within hours in lower environments and one reviewed merge later in production, at a pace the on-call rota can absorb.
