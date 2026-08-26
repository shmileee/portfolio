---
title: Making infrastructure changes boring
summary: Pull-request plans and Kubernetes diffs made infrastructure changes visible before automated deployment.
topics:
  - delivery
  - developer experience
  - reliability
featured: false
spotlight: false
---

## THE SITUATION

When I joined, infrastructure changes were largely hand-applied by engineers with privileged access. Change history was incomplete, and reviewers couldn't see what a change would actually do to production.

## WHAT I DID, IN THREE MOVES

1. Every change became a pull request that deploys itself. I migrated all Kubernetes infrastructure into ArgoCD, component by component, until ArgoCD managed even itself — then deleted the hundreds of thousands of lines of legacy configuration the old world left behind. For cloud infrastructure I introduced Atlantis: since then, Terraform runs in exactly one place — on pull requests — never on laptops. I customized it heavily over the years: authentication through a GitHub App, applies blocked until approval, plan locking, cost estimates commented on every pull request, and performance tuning as the repository grew.
2. I gave Kubernetes what Atlantis gave Terraform. Atlantis had set the standard: every Terraform pull request shows the exact plan of what will change. Kubernetes reviews had nothing comparable — you stared at YAML and imagined the consequences. So I built a bot, directly inspired by the Atlantis experience, that comments on every Kubernetes pull request with the exact diff the cluster will see when ArgoCD applies it. Reviewers stopped guessing. That bot outlived four generations of surrounding infrastructure and is still commenting on pull requests today, three and a half years later.
3. Only then did I turn on auto-deployment. One month after the migration — once reviewers could inspect diffs and the pipeline had operating history — merged changes began applying themselves.

## THE INTERESTING PART

The sequencing was the engineering: migrate first, prove visibility second, automate third — each step built the trust the next one needed.

## WHAT IT CHANGED

Infrastructure changes gained one reviewable path with visible plans, recorded approvals, and reversible history. That delivery foundation enabled the platform work that followed.
