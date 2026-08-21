---
number: 2
slug: approve-the-audited-escape-hatch
title: "/approve: the audited escape hatch"
summary: Speed and control stopped being a trade-off.
topics:
  - security
  - developer experience
featured: false
spotlight: false
---

## THE SITUATION

Our own safety rules created a new problem. Terraform applies are blocked until a pull request is approved — correct ninety-nine percent of the time. But at 3 a.m., the on-call engineer fixing production may have no reviewer awake. And a developer iterating alone in a development stack shouldn't need to interrupt a colleague for every experiment. The wrong fixes were obvious: hand out admin rights, or weaken branch protection for everyone, forever.

## WHAT I DID

I built a small escape hatch with a complete audit trail. Commenting `/approve reason="emergency: prod fix"` on a pull request triggers a workflow that checks whether the commenter — deliberately not the author — belongs to an explicitly authorized team. If yes, the CI bot posts the approving review and the pipeline unblocks; if not, the commenter gets a polite explanation and nothing happens.
Every use is announced in a Slack audit channel: who approved, which pull request, on whose team's authority, and the stated reason — which is also recorded permanently in the review itself.

## WHAT IT CHANGED

Emergencies stopped requiring rule-bending. The branch protection stays fully on for everyone, all the time — but the on-call engineer is never stuck, and every exception is public, attributed, and reviewable the next morning. Speed and control stopped being a trade-off.
