---
number: 11
slug: kafka-topics-as-code
title: "Kafka topics as code: 550 topics, zero surprises"
summary: Topic changes became pull requests with named owners, review, and history.
topics:
  - reliability
  - delivery
featured: false
spotlight: false
---

## The situation
Our Kafka topics — hundreds of them, across clusters and environments — were managed the way most companies manage them: someone shells into a broker pod and runs the topic tool by hand, and a markdown runbook full of copy-paste commands pretends to be the source of truth.

Nobody could say with confidence what existed, who owned what, or whether the doc matched reality.

## What I did
I moved every topic into git as a Kubernetes resource (Strimzi's KafkaTopic), managed by the same GitOps pipeline as everything else. Each topic is now one small reviewable file:

```yaml filename="topics/orders-events.yaml"
# topics/orders-events.yaml
apiVersion: kafka.strimzi.io/v1
kind: KafkaTopic
metadata:
  name: orders-events
  labels:
    owner: team-orders         # ownership resolved from our service catalog
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

The migration itself was a Python program I wrote (~900 lines), and its design is the story. It read two sources of truth and reconciled them: the legacy markdown runbook (parsing the actual `--create` commands out of the doc) and the live clusters (querying every broker for what really exists, in parallel).

Production became the baseline: topics that exist everywhere became shared definitions; per-environment extras got their own folders; and where the same topic differed between environments, the generator emitted a minimal override patch containing only the differing fields.

It also cleaned as it went — stripping settings that merely repeated broker defaults, resolving each topic's owning team from our service catalog — and, my favorite part, it wrote a discrepancy report: a folder of everything the documentation claimed that reality disagreed with, and vice versa. The audit of doc-vs-truth fell out of the migration for free.

## The interesting part
Adopting ~550 live topics without touching production data. The generated definitions matched live state exactly, so the topic operator's first pass had nothing to change — adoption, not recreation.

Auto-deployment was turned on in its most conservative form: apply changes, never delete anything. And the door I closed behind me: admission policies ([case study 10](/case-studies/10-kyverno-at-the-cluster-door/)) now reject replica changes outright, allow partition counts only to grow (Kafka cannot shrink them safely), and nobody can shell into a broker pod anymore — the manual workflow isn't just deprecated, it's impossible.

## What it changed
Topic changes became pull requests with named owners, review, and history. The runbook retired. And "what topics do we have?" went from an investigation to `ls`.
