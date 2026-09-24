---
title: Environments you can create and destroy with one command
summary: One Terraform stack provisions a complete cell, VPC, EKS, GitOps bridge and network attachment, and a custom provider verifies the teardown in six ordered phases before any state can disappear.
role: Wrote the cell architecture and the teardown design, built it with the platform team, and wrote the teardown provider itself.
evidence: "One Terraform stack provisions a cell and more than 20 platform add-ons bootstrap behind it; teardown fails closed and names what survived rather than dropping state."
topics:
  - reliability
  - cost
  - delivery
order: 10
aliases:
  - 14-environments-you-can-create-and-destroy-with-one-command
  - ephemeral-environments
featured: true
spotlight: true
spotlightProof: Each cell contains its own failure domain, joins the network by policy, and verifies teardown before infrastructure state can disappear.
---

## The situation

Standing up a complete environment, network, Kubernetes cluster, autoscaling, secrets, DNS, deployment pipeline, was a bespoke, multi-week effort.

Tearing one down was worse: cloud environments are easy to create and surprisingly hard to delete completely, because components inside the cluster create cloud resources the infrastructure tooling does not know about. Half-deleted environments would linger and keep billing.

## What I did

Our answer was cell-based architecture, an AWS-endorsed resilience pattern: instead of one big shared environment, you run self-contained copies, cells, so that any failure is contained to one copy. AWS describes it in its [Well-Architected guidance on reducing scope of impact](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/what-is-a-cell-based-architecture.html). I wrote the architecture and built it with the platform team.

Our main driver was speed into new markets: the ability to stand up a complete environment in a new region, quickly. The same primitive serves more. Developers can spin up an ephemeral cell to test something and throw it away, and a cell can be dedicated to a single customer where data residency demands it.

A cell is one Terraform stack that provisions everything, the VPC, the EKS cluster with its networking, IAM, DNS and identity integration, and it joins the Cloud WAN network from [the network rebuild](/case-studies/rebuilding-the-network-as-one-policy/) with one flag. Three design pieces carry the weight.

### The GitOps bridge

Terraform stops where it should. It builds the foundation, installs the Flux operator into the fresh cluster, declares the Flux runtime, and hands over. Flux, the GitOps controller, finishes the bootstrap the GitOps way, pulling the remaining platform add-ons, more than 20 of them, from the git repository. This solves the classic chicken-and-egg of cluster bootstrapping (you need a cluster to run the deployment system that deploys everything else) by following the community GitOps Bridge pattern; cluster-specific values flow across the bridge through a metadata file Terraform writes and Flux substitutes.

### A data-only brain

A companion module creates no cloud resources at all. It validates every cell input at plan time, so an unsupported region or a wrong size is rejected before anything runs; normalizes names; resolves network sizing from t-shirt sizes, small, medium and large mapping to precise subnet layouts; and discovers which SSO roles should get cluster access. All the judgment sits in one testable place, all the resources elsewhere.

### Togglable add-ons

Every piece of the platform a cell can carry sits behind an explicit toggle: the [NAT optimization](/case-studies/the-nat-bill-and-the-fix-that-went-upstream/), the network attachment, each add-on. A cell's consumer opts in or out per environment instead of inheriting one size for all.

Every cell also registers itself in a central cell registry, a DynamoDB table that is the shared source of truth for which cells exist and how they are attached. The secrets and network reconcilers read it today.

## Teardown that fails closed

The teardown problem had no off-the-shelf solution, so I wrote a custom Terraform provider to close the gap. It walks an environment down in six ordered phases and fails closed: if anything survived, it stops, reports failure, and names exactly what is still alive rather than letting leftover resources hide. It can also rehearse a destroy during planning and say what would be left behind.

<div class="diagram-exhibit" role="img" aria-label="Teardown ordered phases: preflight, freeze, evacuate, decommission, reconcile, verify">
  <div class="diagram-exhibit-label">TEARDOWN — SIX ORDERED PHASES</div>
  <div>
    <span>preflight</span><i aria-hidden="true">→</i>
    <span>freeze</span><i aria-hidden="true">→</i>
    <span>evacuate</span><i aria-hidden="true">→</i>
    <span>decommission</span><i aria-hidden="true">→</i>
    <span>reconcile</span><i aria-hidden="true">→</i>
    <span>verify</span>
  </div>
</div>

Freeze stops the deployment system so nothing is recreated mid-teardown, evacuate drains the workloads, decommission removes the autoscaled capacity, and verify confirms that nothing is left before the state is allowed to go.

## What it changed

Each cell contains its own failure domain, teardown verifies that cloud resources are gone before state can disappear, and entering a new region is a reviewed infrastructure change rather than an infrastructure project.
