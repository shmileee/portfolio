---
number: 8
slug: dependency-updates-from-quarterly-panic-to-background-noise
title: "Dependency updates: from quarterly panic to background noise"
summary: Staying current became the default state.
topics:
  - security
  - reliability
  - ai
featured: false
spotlight: false
---

## THE SITUATION

Third-party updates — modules, charts, base images, providers — were handled reactively. Updates piled up until something forced a scramble, which is exactly how you end up running vulnerable versions in production.

## WHAT I DID

Three layers, built over three years. First, the *plumbing*: I deployed a self-hosted instance of Renovate (the dependency-update bot) wired into our private registries, so update proposals arrive continuously as small pull requests. Second, the *precondition*: across the repositories our team maintained, I mandated structured commit messages and automated releases — without version tags on our own modules, the bot would have nothing to track. Third, the *judgment*: for years I was the human gate reviewing that stream into production infrastructure.

## THE INTERESTING PART

In the final year I encoded that judgment into a reusable LLM skill — a written playbook an AI agent executes under supervision. It classifies each update pull request by *proven* safety, not by trusting version labels: it reads the rendered deployment diff or the actual Terraform plan, merges only what is demonstrably a no-op or a verified-safe bump, mechanically repairs simple failures, and holds everything else for a human.
The prerequisite was unglamorous: resurrecting a dozen long-broken infrastructure stacks that couldn't even produce a clean plan. A backlog that had accumulated for months cleared in weeks — at roughly twenty times the usual pace, with an audit trail for every merge.

## WHAT IT CHANGED

Staying current became the default state. Security fixes ride an existing conveyor belt instead of triggering fire drills — and the belt now largely runs itself.
