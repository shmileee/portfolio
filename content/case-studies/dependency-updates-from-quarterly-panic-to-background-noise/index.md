---
title: "Dependency updates: from quarterly panic to background noise"
summary: A self-hosted Renovate, automated module releases and a supervised AI review skill turned third-party updates into a continuous stream of small, audited merges.
role: Deployed and wired the update bot, mandated the release automation it depends on, reviewed the stream for years and then encoded that judgment as a supervised skill.
evidence: A months-old backlog cleared in weeks, with a plan or rendered diff and an audit trail behind every merge.
topics:
  - security
  - reliability
  - ai
order: 8
aliases:
  - 08-dependency-updates-from-quarterly-panic-to-background-noise
  - dependency-updates
featured: false
spotlight: false
---

## The situation

Third-party updates, modules, charts, base images, providers, were handled reactively. They piled up until something forced a scramble, and a scramble is how vulnerable versions end up running in production for months.

## What I did

Three layers, built over three years.

First, the plumbing. I deployed a self-hosted instance of Renovate, the dependency-update bot, wired into our private registries, so update proposals arrive continuously as small pull requests.

Second, the precondition. Across the repositories our team maintained, I mandated structured commit messages and automated releases. Without version tags on our own modules, the bot would have had nothing to track.

Third, the judgment. For years I was the human gate reviewing that stream into production infrastructure.

## The interesting part

In the final year I encoded that judgment into a reusable skill: a written playbook an AI agent executes under supervision, one of the [agent playbooks](/case-studies/a-codebase-whose-newest-users-are-ai-agents/) the repositories now carry. It classifies each update pull request by proven safety, not by trusting version labels. It reads the rendered deployment diff or the actual Terraform plan, merges only what is demonstrably a no-op or a verified-safe bump, mechanically repairs simple failures, and holds everything else for a human.

The prerequisite was unglamorous: resurrecting a dozen long-broken infrastructure stacks that could not produce a clean plan. Once they could, a backlog that had accumulated for months cleared in weeks, with an audit trail for every merge.

## What it changed

Staying current became the default state. Security fixes ride an existing conveyor belt instead of triggering fire drills, and the belt now largely runs itself.
