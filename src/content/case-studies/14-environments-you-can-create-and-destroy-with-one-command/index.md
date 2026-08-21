---
number: 14
slug: environments-you-can-create-and-destroy-with-one-command
title: Environments you can create and destroy with one command
summary: Entering a new region became an infrastructure change, not an infrastructure project.
topics:
  - reliability
  - cost
  - delivery
featured: true
spotlight: true
---

## The situation
Standing up a complete environment — network, Kubernetes cluster, autoscaling, secrets, DNS, deployment pipeline — was a bespoke, multi-week effort.

Worse, tearing one down was genuinely dangerous: cloud environments are easy to create and surprisingly hard to delete completely, because components inside the cluster create cloud resources the infrastructure tooling doesn't know about. Half-deleted environments would linger, quietly billing money.

## What I did
This is the work I consider my biggest win. I led the design and build of our take on cell-based architecture — an AWS-endorsed resilience pattern where, instead of one big shared environment, you run self-contained copies ("cells") so that any failure is contained to one copy ([AWS describes it in its Well-Architected guidance on reducing scope of impact ↗](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/what-is-a-cell-based-architecture.html)).

Our main driver was speed into new markets: the ability to stand up a complete environment in a new region, quickly. But the same primitive serves more: developers can spin up an ephemeral cell to test something and throw it away, and a cell can be dedicated to a single customer where data residency demands it.

A cell is one Terraform stack that provisions everything — the VPC, the EKS cluster with its networking, IAM, DNS, and identity integration — and it joins the Cloud WAN network from [case study 13](/#study-13) with one flag. Three design pieces I'm particularly proud of:

- **The GitOps bridge.** Terraform stops where it should. It builds the foundation, installs the Flux operator into the fresh cluster, declares the Flux runtime — and hands over: Flux finishes the bootstrap the GitOps way, pulling the remaining twenty-plus platform add-ons from the git repository. This solves the classic chicken-and-egg of cluster bootstrapping (you need a cluster to run the deployment system that deploys everything else), following the community "GitOps Bridge" pattern; cluster-specific values flow across the bridge through a metadata file Terraform writes and Flux substitutes.

- **A data-only brain.** I wrote a companion module that creates no cloud resources at all: it validates every cell input at plan time (unsupported region? wrong size? rejected before anything runs), normalizes names, resolves network sizing from t-shirt sizes (small/medium/large map to precise subnet layouts), and auto-discovers which SSO roles should get cluster access. All the judgment in one testable place, all the resources elsewhere.

- **Togglable add-ons.** Every piece of the platform a cell can carry — NAT optimization ([case study 15](/#study-15)), the network attachment, each add-on — sits behind an explicit toggle, so a cell's consumer opts in or out per environment instead of inheriting one-size-fits-all.

Every cell also registers itself in a central cell registry (a DynamoDB table) — the shared source of truth for what cells exist and how they're attached, consumed today by the secrets and network reconcilers, and designed to later feed a cell router that steers tenants and traffic to the right cell.

## The interesting part
The teardown problem had no off-the-shelf solution, so I wrote a custom Terraform provider to close the gap. It walks an environment down in ordered phases — freeze the deployment system, evacuate workloads, decommission autoscaled capacity, sweep, verify — and it never pretends: if anything survived, it stops, reports failure, and names exactly what is still alive rather than letting leftover resources hide. It can even rehearse a destroy during planning and tell you what would be left behind.

<div class="teardown-exhibit" role="img" aria-label="Teardown ordered phases: freeze, evacuate, decommission, sweep, verify">
  <p>TEARDOWN — ORDERED PHASES</p>
  <div>
    <span>freeze</span><i aria-hidden="true">→</i>
    <span>evacuate</span><i aria-hidden="true">→</i>
    <span>decommission</span><i aria-hidden="true">→</i>
    <span>sweep</span><i aria-hidden="true">→</i>
    <span>verify</span>
  </div>
</div>

## What it changed
Environments became genuinely independent — a problem in one cannot spread to the others — their costs actually end when they are deleted, and entering a new region became an infrastructure change, not an infrastructure project.
