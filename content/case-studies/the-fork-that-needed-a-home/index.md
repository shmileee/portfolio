---
title: The fork that needed a home
summary: The FireHydrant Terraform provider was forked and fixed in four days, and the internal registry built to serve it became the company's one governed distribution point for every provider.
role: Forked and fixed the FireHydrant provider, filed every fix upstream, and stood up the internal Terraform registry that serves it.
evidence: About 30 team stacks plan against the fork; the registry now also serves our own providers and mirrors the public registry for everything else.
topics:
  - reliability
  - delivery
order: 18
aliases:
  - 18-the-fork-that-needed-a-home
  - provider-fork
featured: false
spotlight: false
---

## The situation

FireHydrant's Terraform provider broke at our scale. With about 30 team stacks planning against one account, the upstream provider, which had removed its request throttling, died with rate-limit errors on parallel runs; two resources re-planned phantom changes on every single run; a data source crashed on duplicate records. The [team automation](/case-studies/teams-that-create-themselves/) depended on all of it.

## What I did

Forked and fixed in four days: a rate-limited HTTP client with retries that back off and add jitter, so 30 stacks do not retry in lockstep; the phantom-diff suppressions; deterministic duplicate resolution. The fork is versioned as `0.15.2-platform.N`, the upstream base plus a visible patch train, and each fix was filed as an upstream issue with a written report, which keeps the fork rebaseable and the maintainers informed.

A patched provider is useless until Terraform can download it, and that is why the company got an internal Terraform registry. It came up in three days, in parallel with the fork: a tag push triggers CI, which signs the build and publishes it to the registry, which serves the standard provider protocol from object storage. The provider pin in every team stack tells the story in one line:

```hcl title="versions.tf"
terraform {
  required_providers {
    firehydrant = {
      source  = "registry.example.com/platform/firehydrant"
      version = "0.15.2-platform.5"
    }
  }
}
```

The registry immediately outgrew its first tenant. It now hosts our own [environment-lifecycle provider](/case-studies/environments-you-can-create-and-destroy-with-one-command/) and mirrors the public registry for every provider we use: one governed, cached distribution point for all of Terraform.

## The interesting part

The signing. CI signs each release with a key it fetches at runtime, so no signing key lives in CI secrets, and the registry serves what that pipeline publishes. Together with the explicit version scheme, that is what made the fork the normal path instead of a special case: a team stack pins it like any other provider.

## What it changed

A vendor's bug stopped being our outage. The escape hatch, fork plus registry, became permanent infrastructure, and the whole organisation's provider supply chain got faster and more controlled as a side effect of fixing one broken plugin.
