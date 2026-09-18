---
title: Kyverno at the cluster door
summary: "Kyverno admission policies, versioned in git, enforce the rules code review kept forgetting: Kafka topic safety, registry rewrites and deletion protection."
role: Introduced the policy engine and wrote the policies for data infrastructure, the registry migration and GitOps deletion safety.
evidence: Replica changes and partition shrinks are rejected at admission; every Docker Hub image reference was rewritten in flight during the registry exit.
topics:
  - security
  - reliability
order: 10
aliases:
  - 10-kyverno-at-the-cluster-door
  - policy-engine
featured: false
spotlight: false
---

## The situation

Some rules cannot live in code review alone. "Please never change this setting", "please don't shell into those pods", "please use the internal registry": tribal rules get forgotten exactly once too often. Kubernetes has a better place for them, the admission layer, the front door every object passes through before it enters the cluster.

## What I did

I introduced Kyverno, the policy engine that enforces rules at that door, with the rules themselves versioned in git like everything else. Then I kept finding jobs for it.

Protecting data infrastructure. After [every Kafka topic became a git-managed resource](/case-studies/kafka-topics-as-code/), policies made destructive edits impossible: replica settings are rejected, partition counts may only grow, and nobody, however senior, can shell into a broker pod. The review comment "are you sure?" became a hard no from the cluster itself.

The invisible registry switch. During [the Docker Hub exit](/case-studies/leaving-docker-hub-without-anyone-noticing/), mutation policies rewrote every image reference in flight to our own mirror, which is what let the whole organisation move registries without coordinating a single team. Both halves are written up on the blog: [the mutating policy itself](/blog/posts/rewriting-docker-image-registries-with-kyverno/), rolled out one namespace at a time, and [the pull-through cache repositories](/blog/posts/setting-up-pull-through-cache-repositories-in-aws-ecr/) it points every pod at.

Deletion safety. A policy preserves cloud resources when a GitOps application is deleted, so removing an application definition cannot cascade into deleting what it managed.

## What it changed

The difference between a convention and a rule: conventions rely on memory, rules are enforced at admission and reviewed as code. The clusters now say no politely, consistently, and in version control.
