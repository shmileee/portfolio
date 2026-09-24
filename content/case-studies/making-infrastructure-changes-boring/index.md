---
title: Making infrastructure changes boring
summary: Every Kubernetes and Terraform change became a pull request that shows its diff or plan before review and applies itself after the merge.
role: Introduced Atlantis and Argo CD, built the Kubernetes diff bot, and sequenced the move to auto-deployment.
evidence: Argo CD manages every cluster component, itself included; the diff bot has commented on every Kubernetes pull request for three and a half years.
topics:
  - delivery
  - devex
  - reliability
  - security
order: 1
aliases:
  - 01-making-infrastructure-changes-boring
  - infrastructure-changes
  - approve-the-audited-escape-hatch
  - 02-approve-the-audited-escape-hatch
  - audited-approve
  - buttons-instead-of-incantations
  - 03-buttons-instead-of-incantations
  - self-service-buttons
  - kubernetes-upgrades
  - 09-kubernetes-upgrades
featured: false
spotlight: false
---

## The situation

When I joined, infrastructure changes were applied by hand, by engineers with privileged access. The change history was incomplete, and a reviewer could not see what a change would do to production before it happened.

The clusters were years behind supported versions, and I ran four consecutive Kubernetes upgrades in my first six weeks to reach supported ground. Every one of them was a manual operation with no preview of what it would break.

## What I did

Three moves, in an order that mattered.

### Every change became a pull request that deploys itself

I migrated all Kubernetes infrastructure into Argo CD, which keeps a cluster in sync with what a git repository declares, component by component until Argo CD managed even itself. Then I deleted the hundreds of thousands of lines of legacy configuration the old world had left behind.

For cloud infrastructure I introduced Atlantis, which runs Terraform from pull request comments. Since then Terraform has run in exactly one place, on pull requests, never on laptops. Over the years I customized it: authentication through a GitHub App, applies blocked until approval, plan locking, a cost estimate commented on every pull request, and performance tuning as the repository grew.

### Kubernetes got what Atlantis gave Terraform

Atlantis set the standard: every Terraform pull request shows the exact plan of what will change. Kubernetes reviews had nothing comparable; the reviewer read YAML and imagined the consequences. So I built a bot that comments on every Kubernetes pull request with the exact diff the cluster will see when Argo CD applies it. It has outlived four generations of the infrastructure around it and is still commenting today, three and a half years later.

### Only then, auto-deployment

One month after the migration, once reviewers could inspect diffs and the pipeline had operating history, merged changes began applying themselves.

## What the path carries

Four things ride it that would otherwise have needed tooling of their own.

Upgrades. Kubernetes versions now move in a fixed order across four clusters, operations first, then development, staging and production, with control plane, nodes and core components each a separate reviewed pull request. A per-cluster dashboard of deprecated-API usage names the workloads the next version breaks, so they are fixed before the upgrade starts. It began as an exporter wrapped around kube-no-trouble and was later rebased onto the metric the API server grew for the same purpose.

The exception. Blocking `terraform apply` until a pull request is approved is right almost every time, and wrong at 3 a.m. when the on-call engineer has no reviewer awake. Handing out admin rights or weakening branch protection would have made a permanent hole for an occasional problem. Instead, commenting `/approve reason="emergency: prod fix"` triggers a workflow that checks the commenter against an explicitly authorized team, and the commenter can never be the author. Every use is announced in a Slack audit channel with the approver, the pull request, the team whose authority was used and the stated reason, which the review itself records permanently. Membership of that team is the whole trust boundary.

The typing. Atlantis is driven by typed comments whose project flags have to be exactly right, so a browser extension adds the common commands as buttons on the pull request page. It submits the comment as the logged-in user, through the box they would have typed into: no tokens, no server and no new identity to secure. The `apply` button has to be armed before it fires.

Deletion safety. An admission policy preserves cloud resources when a GitOps application is deleted, so removing an application definition cannot cascade into deleting what it managed.

## What it changed

Infrastructure changes have one reviewable path: a visible plan or diff, a recorded approval, and a reversible history. Urgent work uses an attributed, announced override rather than a standing policy exception. Migrate first, prove visibility second, automate third, each step building the trust the next one needed, and that foundation carried the platform work that followed.
