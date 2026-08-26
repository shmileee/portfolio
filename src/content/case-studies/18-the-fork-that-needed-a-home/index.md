---
number: 18
slug: the-fork-that-needed-a-home
title: The fork that needed a home
summary: A vendor’s bug stopped being our outage.
topics:
  - reliability
  - delivery
featured: false
spotlight: false
---

## THE SITUATION

Our incident-management provider's Terraform plugin broke at our scale. With ~30 team stacks planning against one account, the upstream provider — which had removed its request throttling — died with rate-limit errors on parallel runs; two resources re-planned phantom changes on every single run; a data source hard-crashed on duplicate records. Team automation ([case study 6](/case-studies/06-teams-that-create-themselves/)) depended on all of it.

## WHAT I DID

Forked and fixed in four days: a rate-limited HTTP client with retries that back off and add jitter (so thirty stacks don't retry in lockstep), the phantom-diff suppressions, deterministic duplicate resolution. Versioned honestly as 0.15.2-company.1 — upstream base plus a visible patch train — and filed each fix as an upstream issue with a written report, keeping the fork rebaseable and the maintainers informed.

> A patched provider is useless until Terraform can download it — and that's why the company got an internal Terraform registry. I stood it up in the same three-day window: tag push → CI signs the build with a key it fetches at runtime (no signing key in CI secrets) → published to the registry, which serves the standard provider protocol from object storage. The provider pin in every team stack tells the story in one line:

```hcl filename="versions.tf"
firehydrant = {
  source  = "registry.example.com/platform/incident-provider"
  version = "0.15.2-platform.5"
}
```

The registry immediately outgrew its first tenant: it now hosts our own environment-lifecycle provider ([case study 14](/case-studies/14-environments-you-can-create-and-destroy-with-one-command/)) and mirrors the public registry for every provider we use — one governed, cached distribution point for all of Terraform.

## THE INTERESTING PART

The host-everything layer mattered as much as the fix: the fork stayed rebaseable because its release train was explicit, and the registry made that fork the normal path instead of a special case.

## WHAT IT CHANGED

A vendor's bug stopped being our outage; the escape hatch (fork + registry) became permanent infrastructure; and the whole org's provider supply chain got faster and more controlled as a side effect of fixing one broken plugin.
