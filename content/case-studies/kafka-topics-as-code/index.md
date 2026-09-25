---
title: "Kafka topics as code: adopting 550 live topics"
summary: "About 550 live Kafka topics gained versioned definitions and named owners without recreation. Admission policies then constrained changes that could bypass the reviewed workflow."
role: "Built the migration generator, designed the environment layout, ran the adoption, and introduced the admission policies."
evidence: "About 550 topics adopted without recreation; replica changes and partition reductions rejected at admission; production topic ownership synchronized to the service catalog."
topics:
  - reliability
  - delivery
  - security
order: 7
aliases:
  - 11-kafka-topics-as-code
  - kafka-topics
  - kyverno-at-the-cluster-door
  - 10-kyverno-at-the-cluster-door
  - policy-engine
featured: false
spotlight: false
---

## Adopt the running system without recreating it

Kafka topics were managed manually across clusters and environments. A Markdown runbook recorded creation commands, but it could not reliably describe the current inventory, ownership, or differences between environments.

I moved about 550 live topics into Git as Strimzi `KafkaTopic` resources. The main constraint was preserving the existing topics and their data while bringing their configuration under review.

## Reconcile documentation against live state

I wrote a generator that parsed the runbook's creation commands and queried the live brokers. It compared the two, used production as the baseline, and produced three kinds of configuration:

**Shared topic.** Common configuration across environments

**Environment-only topic.** A topic present only in that environment

**Override patch.** Only the fields that differ from the shared definition

The generator removed settings that merely repeated broker defaults and resolved owning teams from the service catalog. It also produced a discrepancy report, exposing topics and settings that the documentation and clusters disagreed about.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — TWO SOURCES OF TRUTH, ONE GENERATED TREE</div>
  <svg aria-label="The runbook's create commands and the live brokers feed one reconciler; it writes shared topic definitions, per-environment extras, override patches with only the differing fields, and a report of where the runbook and the clusters disagreed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 312" role="img"><defs><marker id="arrKR" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="20" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Markdown runbook</text><text x="180" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">the --create commands, parsed</text><rect x="380" y="10" width="320" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Live clusters</text><text x="540" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">every broker queried, in parallel</text><path d="M180,68 L180,92 L360,92" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M540,68 L540,92 L360,92" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M360,92 L360,116" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrKR)"></path><rect x="190" y="118" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="141" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Reconcile</text><text x="360" y="159" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">production is the baseline</text><path d="M360,176 L360,200" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M99,200 L609,200" stroke="var(--color-border)" stroke-width="1.2" fill="none"></path><path d="M99,200 L99,222" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrKR)"></path><path d="M269,200 L269,222" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrKR)"></path><path d="M439,200 L439,222" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrKR)"></path><path d="M609,200 L609,222" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrKR)"></path><rect x="20" y="224" width="158" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="99" y="247" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Shared topics</text><text x="99" y="265" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">topics that exist</text><text x="99" y="283" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">in every environment</text><rect x="190" y="224" width="158" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="269" y="247" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Environment extras</text><text x="269" y="265" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">one folder per</text><text x="269" y="283" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">environment</text><rect x="360" y="224" width="158" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="439" y="247" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Override patches</text><text x="439" y="265" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">only the fields</text><text x="439" y="283" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">that differ</text><rect x="530" y="224" width="158" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="609" y="247" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Discrepancy report</text><text x="609" y="265" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">what the runbook and</text><text x="609" y="283" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">reality disagreed on</text></svg>
</div>

Each resulting topic is a small reviewable file. This example uses a fictional topic and owner:

```yaml title="topics/shared/payment-events.yaml"
apiVersion: kafka.strimzi.io/v1
kind: KafkaTopic
metadata:
  name: payment-events
  namespace: messaging
  labels:
    strimzi.io/cluster: messaging
    owner: team_payments
spec:
  topicName: payment.events
  partitions: 12
  replicas: 3
  config:
    cleanup.policy: compact
    retention.ms: -1
    min.compaction.lag.ms: 86400000
    segment.bytes: 1000000000
```

Keeping `metadata.name` separate from `spec.topicName` preserves Kafka names that contain characters Kubernetes object names cannot use. The `config` block carries workload-specific retention, compaction, and segment settings alongside partitions and replicas, making those decisions visible in the same review.

## Control both adoption and later changes

Because the generated definitions matched live state, the operator adopted the topics instead of recreating them. During the migration, automatic deployment applied changes with deletion disabled.

I introduced Kyverno policies that reject changes to replica counts and reductions in partition counts. A separate policy blocks the developers group from opening shells in broker pods, closing the manual path that had previously bypassed review. Direct topic deletion is also restricted through RBAC.

Production topic resources are synchronized into the service catalog, connecting the deployed inventory to the teams that own it.

## What changed

About 550 topics came under management without recreation. Topic changes became pull requests with owners, review, and history. The generated definitions replaced the runbook as the inventory, and the admission policies helped keep subsequent changes inside that workflow.
