---
title: Making infrastructure changes boring
summary: Every Kubernetes and Terraform change became a pull request that shows its diff or plan before review and applies itself after the merge.
role: Introduced Atlantis and Argo CD, built the Kubernetes diff bot, and sequenced the move to auto-deployment.
evidence: Argo CD manages every cluster component, itself included; the diff bot has commented on every Kubernetes pull request for three and a half years.
topics:
  - delivery
  - devex
  - reliability
order: 1
aliases:
  - 01-making-infrastructure-changes-boring
  - infrastructure-changes
featured: false
spotlight: false
---

## The situation

When I joined, infrastructure changes were applied by hand, by engineers with privileged access. The change history was incomplete, and a reviewer could not see what a change would do to production before it happened.

## What I did

Three moves, in an order that mattered.

### Every change became a pull request that deploys itself

I migrated all Kubernetes infrastructure into Argo CD, which keeps a cluster in sync with what a git repository declares, component by component until Argo CD managed even itself. Then I deleted the hundreds of thousands of lines of legacy configuration the old world had left behind.

For cloud infrastructure I introduced Atlantis, which runs Terraform from pull-request comments. Since then Terraform has run in exactly one place, on pull requests, never on laptops. Over the years I customised it: authentication through a GitHub App, applies blocked until approval, plan locking, a cost estimate commented on every pull request, and performance tuning as the repository grew.

### Kubernetes got what Atlantis gave Terraform

Atlantis set the standard: every Terraform pull request shows the exact plan of what will change. Kubernetes reviews had nothing comparable; the reviewer read YAML and imagined the consequences. So I built a bot that comments on every Kubernetes pull request with the exact diff the cluster will see when Argo CD applies it. Reviewers stopped guessing. The bot has outlived four generations of the infrastructure around it and is still commenting today, three and a half years later.

### Only then, auto-deployment

One month after the migration, once reviewers could inspect diffs and the pipeline had operating history, merged changes began applying themselves.

## What it changed

Infrastructure changes have one reviewable path: a visible plan or diff, a recorded approval, and a reversible history. The sequencing was the engineering. Migrate first, prove visibility second, automate third; each step built the trust the next one needed, and that foundation carried the platform work that followed.
