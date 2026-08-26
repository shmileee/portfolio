---
number: 12
slug: the-fleet-that-patches-itself
title: The fleet that patches itself (while engineers are watching)
summary: A vendor announces a fix; the fleet is rotating onto it within hours.
role: "Wrote the architecture and rotation policy; co-built the event-driven image pipeline with two teammates."
evidence: "07:00–20:00 weekday coverage, an 18:00 rotation cutoff, and pool-specific disruption budgets."
topics:
  - security
  - reliability
featured: true
spotlight: false
---

## The situation
We built security-patched machine images for our Kubernetes nodes — and then discovered they weren't reaching the nodes. Rotation was effectively off: replacement budgets set to zero, one production pool allowed a two-hour window per week (months to rotate the whole pool), and the monitoring nodes were configured to rotate during business hours — risking metric gaps in the middle of an incident.

Patched images existed; nothing consumed them.

## What I did
I wrote the design that connected the two ends — an event-driven image pipeline feeding a deliberately scheduled node-rotation policy — and drove it with seven colleagues as named reviewers; the build pipeline itself was co-built with two teammates.

The build side is fully event-driven: when the OS vendor announces a security release (a public notification feed) or the upstream Kubernetes image changes (a poller watching the public parameter), the pipeline wakes up on its own, builds our patched image on top of the upstream one — applying *security updates only*, and never touching the container runtime, kubelet, or kernel, so we never diverge from what the cloud provider validated — and publishes the result per environment. Failed builds retry on the next cycle automatically.

The consumption side uses Karpenter's drift mechanism: a node whose image no longer matches the declared spec is flagged and replaced. The design decides when:

- Development and staging track new images instantly (name-pattern match — nodes start rotating minutes after a build).

- Production pins exact image IDs — and the dependency bot ([case study 8](/case-studies/08-dependency-updates-from-quarterly-panic-to-background-noise/)) proposes the bump as a pull request. The merge button *is* the deployment gate: human review, full audit trail, no custom tooling.

- Rotation happens when engineers are watching. The core principle from the design doc: *drift is a controlled, planned operation triggered by a known image change — it should happen during coverage hours.* Our two on-call regions cover 07:00–20:00 weekdays; rotation windows close at 18:00 — two hours before coverage ends, so a bad image is caught on-shift, never discovered by the night. Weekends are blocked ("no one gets paged on weekends for node rotation")… with one deliberate inversion: the development Kafka brokers rotate *on* weekends, because a rebalance hurts developers more on a Tuesday than it hurts a Saturday.

- Budgets control parallelism; pod-disruption rules protect individual services. A percentage cap decides how many nodes churn at once; per-service rules serialize replicas of the same service while different services drain in parallel. Special pools get special treatment: the metrics store rotates one node at a time, databases stagger per availability zone in pre-dawn slots, and one streaming workload blocks drift entirely — its own operator migrates jobs on demand instead.

- A safety-net alert fires if any node's termination is stuck for over twelve hours, with a runbook for the usual suspects (blocking disruption rules, crash-looping pods, stuck volumes).

{% diagramPair "./build-side-event-driven.svg", "EXHIBIT — BUILD SIDE · EVENT-DRIVEN", "./consumption-side-scheduled-drift.svg", "CONSUMPTION SIDE · SCHEDULED DRIFT", "The self-patching fleet" %}

## The interesting part
The schedule math is where the craft hides. The scheduler reads times in UTC with no daylight-saving handling — so the windows are set to the intersection of summer and winter coverage, safe in both. And the whole policy is expressed as a handful of declarative budget blocks in the chart values, reviewed like any other code — the on-call calendar, encoded.

## What it changed
Node patching went from "images exist, nobody consumes them" to a self-feeding loop: vendor announces a fix, the fleet is rotating onto it within hours in lower environments and one reviewed merge later in production — at a pace the on-call rota can actually absorb.
