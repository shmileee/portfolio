---
title: "Kafka topics as code: adopting 550 live topics"
summary: About 550 live Kafka topics moved into git as Strimzi resources; a generator reconciled the runbook with the clusters, and the operator adopted the result without touching production data.
role: Wrote the reconciling generator, designed the environment layout and ran the adoption.
evidence: About 550 topics adopted with no recreation; the discrepancy report between the runbook and the clusters fell out of the migration for free.
topics:
  - reliability
  - delivery
order: 11
aliases:
  - 11-kafka-topics-as-code
  - kafka-topics
featured: false
spotlight: false
---

## The situation

Our Kafka topics, hundreds of them across clusters and environments, were managed by hand: someone shells into a broker pod and runs the topic tool, and a Markdown runbook full of copy-paste commands pretends to be the source of truth.

The runbook could not say what existed, who owned each topic, or where the documentation and the live state had diverged.

## What I did

I moved every topic into git as a Kubernetes resource, Strimzi's `KafkaTopic`, managed by the same GitOps pipeline as everything else. Strimzi is the operator that runs Kafka on Kubernetes and turns such resources into real topics. Each topic is now one small reviewable file:

```yaml title="topics/orders-events.yaml"
apiVersion: kafka.strimzi.io/v1
kind: KafkaTopic
metadata:
  name: orders-events
  labels:
    # ownership resolved from our service catalog
    owner: team-orders
spec:
  topicName: orders.events
  partitions: 12
  replicas: 3
  config:
    cleanup.policy: compact
    retention.ms: -1
    min.compaction.lag.ms: 86400000
    segment.bytes: 1000000000
```

The migration itself was a Python program of about 900 lines, and its design is the story. It read two sources of truth and reconciled them: the legacy runbook, by parsing the actual `--create` commands out of the document, and the live clusters, by querying every broker for what really existed, in parallel.

Production became the baseline. Topics that exist everywhere became shared definitions; per-environment extras got their own folders; and where the same topic differed between environments, the generator emitted a minimal override patch containing only the differing fields.

It also cleaned as it went, stripping settings that merely repeated broker defaults and resolving each topic's owning team from our service catalog.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — TWO SOURCES OF TRUTH, ONE GENERATED TREE</div>
  <svg aria-label="The runbook's create commands and the live brokers feed one reconciler; it writes shared topic definitions, per-environment extras, override patches with only the differing fields, and a report of where the runbook and the clusters disagreed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 312" role="img"><defs><marker id="arrKR" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="20" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Markdown runbook</text><text x="180" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">the --create commands, parsed</text><rect x="380" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Live clusters</text><text x="540" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">every broker queried, in parallel</text><path d="M180,68 L180,92 L360,92" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M540,68 L540,92 L360,92" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M360,92 L360,116" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrKR)"></path><rect x="190" y="118" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="141" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Reconcile</text><text x="360" y="159" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">production is the baseline</text><path d="M360,176 L360,200" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M99,200 L609,200" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M99,200 L99,222" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrKR)"></path><path d="M269,200 L269,222" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrKR)"></path><path d="M439,200 L439,222" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrKR)"></path><path d="M609,200 L609,222" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrKR)"></path><rect x="20" y="224" width="158" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="99" y="247" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Shared topics</text><text x="99" y="265" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">topics that exist</text><text x="99" y="283" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">in every environment</text><rect x="190" y="224" width="158" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="269" y="247" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Environment extras</text><text x="269" y="265" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">one folder per</text><text x="269" y="283" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">environment</text><rect x="360" y="224" width="158" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="439" y="247" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Override patches</text><text x="439" y="265" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">only the fields</text><text x="439" y="283" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">that differ</text><rect x="530" y="224" width="158" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="609" y="247" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Discrepancy report</text><text x="609" y="265" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">what the runbook and</text><text x="609" y="283" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">reality disagreed on</text></svg>
</div>

## The interesting part

Two things. First, the adoption: the generated definitions matched live state, so the topic operator's first pass was adoption rather than recreation, and about 550 live topics came under management without touching production data. Auto-deployment was turned on in its most conservative form, apply changes and never delete anything.

Second, the discrepancy report. The generator wrote a folder of everything the documentation claimed that reality disagreed with, and the reverse. The audit of documentation against truth fell out of the migration for free.

The door closed behind the migration is [Kyverno's](/case-studies/kyverno-at-the-cluster-door/): the manual workflow is not deprecated, it is impossible.

## What it changed

Topic changes became pull requests with named owners, review and history. The runbook retired, and the generated files became the queryable inventory.
