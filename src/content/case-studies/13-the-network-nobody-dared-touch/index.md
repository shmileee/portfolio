---
number: 13
slug: the-network-nobody-dared-touch
title: The network nobody dared touch
summary: The scariest stack in the company became just another stack.
topics:
  - networking
  - reliability
featured: true
spotlight: false
---

## The situation
All our AWS networks were interconnected through a transit-gateway setup built from about fifteen copies of a community module. It had a landmine inside: routes were tracked by position in a list, so adding a single network range made the plan want to destroy and recreate production routes en masse. Everyone was afraid to touch it, so nobody did — for years.

And the fear was structural, not personal: with a transit gateway, all the wiring is yours — a route table per attachment, hand-managed propagation, and no concept of "environment" beyond the discipline of whoever edits the routes.

## What I did
Two moves — first make it safe, then make it better.

Make it safe: I replaced the module maze with plain, explicit resources where every route has a stable identity — changing one range now touches exactly one route.

The migration itself was the delicate part: live production routing had to move to new code with zero changes applied. I generated a thirteen-hundred-line state-migration file mapping every old resource to its new address, opened a deliberately-unmergeable demo pull request to prove the plan was a no-op, wrote a rollback runbook, landed it, and deleted the scaffolding.

Make it better: I designed and drove our move to AWS Cloud WAN — effectively the managed evolution of the transit gateway, and better in exactly the ways that had hurt us:

- The network is one reviewable document. Segments — production, non-production, shared, and a quarantine for anything unrecognized — and the rules for joining them live in a single policy definition, in git, instead of being implied by dozens of route tables.

- Joining is by policy, not by hand. An attachment is admitted to a segment only if it carries the right tag and comes from the right account; anything unknown lands in quarantine with no connectivity to lose sleep over. Nobody edits another account's route tables anymore.

- Real separation. Production and non-production traffic simply cannot mix unless the policy says so — a property our transit-gateway mesh never had.

- It's managed and multi-region. AWS runs the core network with edges in each region we need; expanding the network to a new region is a policy change, not a peering project. (We also evaluated AWS's transit-gateway orchestration solution and rejected it — too many moving parts to own.)

## The interesting part
Two days after the refactor landed, the bot proposed a major version bump on that very stack — and it merged the same day. The scariest stack in the company became just another stack. And a colleague who had never dared touch the network shipped his own changes to it the following week.

## What it changed
Network changes stopped being feared, prod and non-prod gained real separation, and — the part that mattered most for what came next — new environments can now join the network programmatically.
