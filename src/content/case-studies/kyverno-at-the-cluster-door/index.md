---
title: "One policy engine, many jobs: Kyverno at the cluster door"
summary: "The clusters now say \"no\" politely, consistently, and in version control."
topics:
  - security
  - reliability
featured: false
spotlight: false
---

## The situation
Some rules can't live in code review alone. "Please never change this setting", "please don't shell into those pods", "please use the internal registry" — tribal rules get forgotten exactly once too often. Kubernetes has a better place for them: the admission layer, the front door every object passes through before it enters the cluster.

## What I did
I introduced Kyverno, the policy engine that enforces rules at that door — with the rules themselves versioned in git like everything else. Then I kept finding jobs for it:

- Protecting data infrastructure. After I codified all our Kafka topics as git-managed resources ({% caseStudyLink "kafka-topics" %}), policies made destructive edits impossible: replica settings are rejected outright, partition counts may only ever increase (Kafka can't shrink them safely), and nobody — however senior — can shell into a broker pod. The review comment "are you sure?" became a hard "no" from the cluster itself.

- The invisible registry switch. During our Docker Hub exit ({% caseStudyLink "registry-migration" %}), mutation policies rewrote every image reference on the fly to our own mirror — the mechanism that let the whole organization move registries without coordinating a single team.

- Deployment safety. A policy preserves cloud resources when a GitOps application is deleted — so removing an app definition can't cascade into deleting what it managed.

- Small correctness rules that close real gaps, like scoping how secrets-agent settings get injected into pods.

## The interesting part
The policy engine became a catch-all for sharp edges that didn't belong in memory or runbooks: data, image references, deletion safety, and little correctness traps all now fail closed at admission.

## What it changed
The difference between a convention and a rule: conventions rely on memory, rules are enforced at admission and reviewed as code. The clusters now say "no" politely, consistently, and in version control.
