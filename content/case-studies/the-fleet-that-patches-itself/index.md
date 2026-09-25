---
title: The fleet that patches itself while engineers are watching
summary: "Security-image builds and scheduled node replacement became one workflow: automatic adoption in lower environments, with an explicit image-version review before production rollout."
role: "Designed the image and rotation policy, coordinated its review, and co-built the event-driven image pipeline with two teammates."
evidence: "Lower environments adopt new images within hours when rotation windows allow; production pins image IDs and promotes them through reviewed pull requests."
topics:
  - security
  - reliability
order: 8
aliases:
  - 12-the-fleet-that-patches-itself
  - fleet-patching
featured: true
spotlight: false
---

## Connect image publishing to node replacement

We were building patched Kubernetes node images, but the running nodes were not consistently receiving them. Some replacement budgets were zero; one production pool had only a two-hour window each week. Publishing an image did not complete the patching process.

I designed the connection between image builds and node rotation, with seven colleagues reviewing the policy. Two teammates and I built the event-driven image pipeline. The design had to deliver patches while keeping planned disruption within the team's support capacity.

## Build once, promote deliberately

The pipeline responds to OS security-release notifications and changes to the upstream Kubernetes node image. It builds the patched image and publishes it for each environment. Security updates are applied while the Kubernetes runtime components remain aligned with the upstream node image.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — BUILD SIDE · EVENT-DRIVEN</div>
  <svg aria-label="Two triggers, an OS security release and an upstream image change, start one image build that applies security updates only and publishes a dated image per environment" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 332" role="img"><defs><marker id="arrFB" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="20" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">OS security release</text><text x="180" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">public notification feed</text><rect x="380" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Upstream EKS image change</text><text x="540" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">public parameter, polled</text><path d="M180,68 L180,92 L360,92" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M540,68 L540,92 L360,92" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M360,92 L360,116" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrFB)"></path><rect x="190" y="118" width="340" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="141" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Image build</text><text x="360" y="159" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">security updates only</text><text x="360" y="177" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">runtime, kubelet, kernel untouched</text><path d="M360,192 L360,216" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrFB)"></path><rect x="190" y="218" width="340" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="243" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Patched image, dated</text><path d="M360,258 L360,282" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrFB)"></path><rect x="190" y="284" width="340" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="309" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Published per environment</text></svg>
</div>

Development and staging select new images by name pattern. Karpenter detects that existing nodes no longer match the desired image and schedules replacements. Production pins exact image IDs; the dependency bot proposes each change as a pull request.

That creates a clear promotion boundary. Lower environments exercise the image first, while production adoption requires a reviewed configuration change.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — CONSUMPTION SIDE · SCHEDULED DRIFT</div>
  <svg aria-label="Development and staging drift instantly on a name pattern; production pins an image ID that a bot bumps in a pull request; rotation is budget-limited within coverage hours, drains are gated by disruption rules, and a stuck termination alerts after 12 hours" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 324" role="img"><defs><marker id="arrFC" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="20" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">dev / staging</text><text x="180" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">name-pattern match → instant drift</text><rect x="380" y="10" width="320" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">production</text><text x="540" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">pinned ID → bot opens pull request</text><text x="540" y="69" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">→ human merges</text><path d="M180,68 L180,100 L360,100" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M540,84 L540,100 L360,100" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M360,100 L360,124" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrFC)"></path><rect x="190" y="126" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="149" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Budget-limited rotation</text><text x="360" y="167" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">coverage-hours schedule · per-pool exceptions</text><path d="M360,184 L360,208" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrFC)"></path><rect x="190" y="210" width="340" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="235" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Disruption-rule-gated drain</text><path d="M360,250 L360,274" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrFC)"></path><rect x="190" y="276" width="340" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="301" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Patched fleet</text><rect x="550" y="201" width="168" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="634" y="224" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Stuck termination</text><text x="634" y="242" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">alert + runbook</text><path d="M530,230 L548,230" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrFC)"></path><text x="634" y="276" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.06em" fill="var(--color-text-muted)">stuck over 12 h</text></svg>
</div>

## Schedule disruption around the workload

For ordinary node pools, planned image rotation runs during weekday on-call coverage and stops two hours before coverage ends. The schedules use the overlap between summer and winter coverage because the scheduler evaluates them in UTC.

A reduced budget example shows how the policy combines a concurrency cap with blocked periods:

```yaml title="nodepool/disruption.yaml"
budgets:
  - nodes: "15%"
    reasons: [Drifted]
  - nodes: "0"
    reasons: [Drifted]
    schedule: "0 18 * * 1-5"
    duration: 13h
  - nodes: "0"
    reasons: [Drifted]
    schedule: "0 0 * * 6"
    duration: 55h
```

This blocks drift-based replacement overnight and through the weekend. It controls planned image rotation; it does not prevent unrelated node failures.

Stateful workloads need different policies. Metrics nodes rotate one at a time. Database pools use separate windows by availability zone. Development Kafka brokers use a weekend window to avoid interrupting engineers with rebalances during the week. One streaming workload blocks drift-based replacement because its operator coordinates job migration itself.

Pod disruption budgets constrain which replicas can drain together. An alert catches terminations stuck for more than 12 hours and links to a runbook covering blocked disruption, unhealthy pods, and attached volumes.

## What changed

Patching gained a complete path from a vendor release to running nodes. Lower environments can rotate within hours when their windows allow; production adoption follows a reviewed image change and its pool's schedule. The policy makes both promotion and the permitted pace of disruption visible in code.
