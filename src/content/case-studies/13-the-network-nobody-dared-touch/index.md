---
number: 13
slug: the-network-nobody-dared-touch
title: The network nobody dared touch
summary: A list-indexed route mesh became stable resources and one reviewable network policy.
role: Rebuilt the route model and led the no-change migration and Cloud WAN architecture.
evidence: Stable route identities, a quarantine segment, and one policy document replaced about fifteen module copies.
topics:
  - networking
  - reliability
featured: true
spotlight: false
---

## The situation
All our AWS networks were interconnected through a transit-gateway setup built from about fifteen copies of a community module. Routes were tracked by position in a list, so adding one network range made the plan propose destroying and recreating production routes. The resulting blast radius kept the stack effectively frozen for years.

And the fear was structural, not personal: with a transit gateway, all the wiring is yours — a route table per attachment, hand-managed propagation, and no concept of "environment" beyond the discipline of whoever edits the routes.

## What I did
Two moves — first make it safe, then make it better.

Make it safe: I replaced the module maze with plain, explicit resources where every route has a stable identity — changing one range now touches exactly one route.

The migration itself was the delicate part: live production routing had to move to new code with no infrastructure changes applied. I generated an explicit state map from every old resource to its new address, opened a deliberately unmergeable demonstration pull request to prove the plan was a no-op, wrote a rollback runbook, landed it, and deleted the scaffolding.

Make it better: I designed and drove our move to AWS Cloud WAN — effectively the managed evolution of the transit gateway, and better in exactly the ways that had hurt us:

- The network is one reviewable document. Segments — production, non-production, shared, and a quarantine for anything unrecognized — and the rules for joining them live in a single policy definition, in git, instead of being implied by dozens of route tables.

- Joining is by policy, not by hand. An attachment is admitted to a segment only if it carries the right tag and comes from the right account; anything unknown lands in quarantine with no connectivity to lose sleep over. Nobody edits another account's route tables anymore.

- Real separation. Production and non-production traffic simply cannot mix unless the policy says so — a property our transit-gateway mesh never had.

- It's managed and multi-region. AWS runs the core network with edges in each region we need; expanding the network to a new region is a policy change, not a peering project. (We also evaluated AWS's transit-gateway orchestration solution and rejected it — too many moving parts to own.)

## The interesting part
After the refactor, dependency updates and colleague-authored network changes could use the same plan-and-review path as the rest of the infrastructure estate.

## What it changed
Network changes became reviewable at resource and policy level, production and non-production gained explicit separation, and new environments can join the network programmatically.
