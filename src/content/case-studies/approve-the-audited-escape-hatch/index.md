---
title: "/approve: the audited escape hatch"
summary: An authorized reviewer can unblock an urgent `terraform apply` in Atlantis without weakening branch protection or losing the audit trail.
topics:
  - security
  - developer experience
featured: false
spotlight: false
---

## THE SITUATION

Our own safety rules created a new problem. Our Atlantis workflow blocks `terraform apply` until a pull request is approved — correct ninety-nine percent of the time. But at 3 a.m., the on-call engineer fixing production may have no reviewer awake. And a developer iterating alone in a development stack shouldn't need to interrupt a colleague for every experiment. The wrong fixes were obvious: hand out admin rights, or weaken branch protection for everyone, forever.

## WHAT I DID

I built a small escape hatch with a complete audit trail. Commenting `/approve reason="emergency: prod fix"` on a pull request triggers a workflow that checks whether the commenter — deliberately not the author — belongs to an explicitly authorized team. If yes, the CI bot posts the approving review and Atlantis can run `terraform apply`; if not, the commenter gets a polite explanation and nothing happens.
Every use is announced in a Slack audit channel: who approved, which pull request, on whose team's authority, and the stated reason — which is also recorded permanently in the review itself.

## WHAT IT CHANGED

Urgent work no longer requires a permanent policy exception. Branch protection stays in place; each override is authorized by someone other than the author, attributed, announced, and available for review the next morning.
