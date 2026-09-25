---
title: "Dependency updates: from quarterly panic to background noise"
summary: "Dependency updates became a continuous flow of small pull requests, supported by automated releases, deployment previews, and a supervised review playbook."
role: "Deployed Renovate, established the module release automation, reviewed infrastructure updates, and encoded recurring review decisions in a supervised agent skill."
evidence: "Restored clean planning for about a dozen infrastructure stacks; cleared a months-old update backlog in weeks with recorded evidence for each merge."
topics:
  - security
  - reliability
  - ai
order: 6
aliases:
  - 08-dependency-updates-from-quarterly-panic-to-background-noise
  - dependency-updates
featured: false
spotlight: false
---

## Make updates small enough to review continuously

Infrastructure dependencies were updated reactively. Terraform modules, providers, Helm charts, and base images accumulated changes until a security issue or compatibility problem forced a larger upgrade.

I built a continuous update workflow over three years. It needed reliable version discovery, reviewable changes, and enough working validation to decide which updates could be applied safely.

## Build the prerequisites for automation

I deployed a self-hosted Renovate instance with access to our private registries. It opened small pull requests as new versions became available.

For our own modules, I established structured commits and automated releases across the repositories our team maintained. Without consistent version tags, the bot could not discover or propose those updates.

I then reviewed the stream of infrastructure changes for several years. The useful evidence was the effect of an update: a Terraform plan, rendered Kubernetes diff, or relevant build and test results. A patch-version label by itself was insufficient.

## Encode the repeatable review decisions

I turned that review process into a supervised agent skill. It gathers deployment evidence for the exact commit under review, checks the update's operational effect, and proposes a concrete action for each pull request. I confirm that plan before the agent can repair, approve, or squash-merge anything. If the pull request changes, the old assessment no longer authorizes the action.

**Ready to merge.** Current checks pass, the deployment effect is understood, and no coordinated migration is needed. Propose approval and squash-merge for my confirmation.

**Repair first.** The dependency is otherwise safe, but its updated formatter causes a mechanical check failure. Propose the bounded repair, then validate it before approval and merge.

**Hold.** Plans fail, a prerequisite migration is needed, or evidence remains ambiguous. Investigate or ask for human review.

A patch label or green CI alone cannot authorize a merge. For example, an unchanged Terraform plan still needs a compatibility check against the provider update; a plan containing an unexplained resource replacement stays on hold. The skill rechecks the commit, checks, and merge gates immediately before each authorized action. It never runs an infrastructure apply.

The skill can repair straightforward mechanical failures within a limited number of attempts. It does not treat a successful repair as proof that the underlying dependency update is safe. The [agent tooling case study](/case-studies/safe-ai-tooling-for-every-developer/) covers the surrounding guidance and access controls.

Before the workflow could clear the backlog, about a dozen long-broken infrastructure stacks needed to produce clean plans again. Repairing that validation path was essential: an update cannot be judged from a plan that never completes.

## What changed

A backlog that had accumulated for months cleared in weeks. Updates had a repeatable route from proposal to review, with evidence and an audit trail behind each merge. Security fixes could use that existing process, while uncertain changes remained visible for a human to assess.
