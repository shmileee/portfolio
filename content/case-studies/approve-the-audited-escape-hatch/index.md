---
title: "/approve: the audited escape hatch"
summary: A `/approve` comment lets a member of one authorized team unblock an urgent `terraform apply` in Atlantis, with the reason recorded in the review and announced in Slack.
role: Designed and built the workflow, its team check and its audit trail.
evidence: The commenter can never be the author; every use posts who, which pull request, on whose authority and why to an audit channel.
topics:
  - security
  - devex
order: 2
aliases:
  - 02-approve-the-audited-escape-hatch
  - audited-approve
featured: false
spotlight: false
---

## The situation

Our own safety rule created a new problem. The Atlantis workflow blocks `terraform apply` until a pull request is approved, which is right 99% of the time. At 3 a.m., the on-call engineer fixing production may have no reviewer awake, and a developer iterating alone in a development stack should not have to interrupt a colleague for every experiment. The wrong fixes were obvious: hand out admin rights, or weaken branch protection for everyone, forever.

## What I did

I built a small escape hatch with a complete audit trail. Commenting `/approve reason="emergency: prod fix"` on a pull request triggers a workflow that checks whether the commenter belongs to an explicitly authorized team. The commenter is deliberately never the author. If the check passes, the CI bot posts the approving review and Atlantis can run `terraform apply`; if not, the commenter gets a short explanation and nothing happens.

Every use is announced in a Slack audit channel: who approved, which pull request, on whose team's authority, and the stated reason, which is also recorded permanently in the review itself.

The authorized team is the whole trust boundary. Whoever can change its membership can grant overrides, so that list is the one thing to guard.

## What it changed

Urgent work no longer needs a permanent policy exception. Branch protection stays in place; each override is authorized by someone other than the author, attributed, announced, and there to be reviewed the next morning.
