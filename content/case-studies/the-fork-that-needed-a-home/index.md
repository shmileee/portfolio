---
title: The fork that needed a home
summary: "I fixed a Terraform provider that was blocking team automation, then built a registry to distribute the fork through normal version pins and signed releases."
role: "Forked and fixed the FireHydrant provider, reported the issues upstream, and established the internal registry and publishing workflow."
evidence: "Provider fixes completed in four days, with the registry built in parallel in three; about 30 team stacks used the fork."
topics:
  - reliability
  - delivery
order: 14
aliases:
  - 18-the-fork-that-needed-a-home
  - provider-fork
featured: false
spotlight: false
---

## Restore reliable plans for team automation

The FireHydrant Terraform provider failed under our usage pattern. About 30 team stacks planned against one account. Parallel runs hit rate limits after upstream request throttling was removed. Two resources repeatedly reported changes that had already been applied, and a data source crashed when it encountered duplicate records.

The [team provisioning workflow](/case-studies/teams-that-create-themselves/) depended on those resources. I forked the provider and completed the fixes in four days.

## Address the distinct failure modes

**Rate limits during parallel plans.** A throttled HTTP client with backoff and jitter

**Repeated changes with no intended configuration difference.** Suppression of the affected phantom diffs

**Duplicate data-source records.** Deterministic duplicate handling

I reported each issue upstream with a written explanation. The fork used an explicit version suffix so consumers could identify both the upstream base and our patch revision.

Fixing the provider was only half the work. Terraform also needed a dependable way to download it.

## Distribute the fork through Terraform's normal interface

I built an internal registry in parallel, bringing it up in three days. A team stack could then pin the patched provider like any other dependency. The hostname, namespace, and suffix in this example are anonymized:

```hcl title="team/terraform.tf"
terraform {
  required_providers {
    firehydrant = {
      source  = "registry.example.com/platform/firehydrant"
      version = "0.15.2-platform.5"
    }
  }
}
```

Exact pins make the fork version explicit and avoid ambiguity around pre-release version constraints.

Publishing starts with a version tag. CI assumes a scoped AWS role through GitHub OIDC, retrieves the GPG signing key from Secrets Manager, builds the provider binaries, and publishes them with signed checksums to object storage. The registry serves the provider protocol and download locations; the publishing workflow does not need to upload through the registry's HTTP service.

This keeps static AWS credentials and the stored signing key out of CI configuration. The signing key still exists and is retrieved for the release job.

## What changed

About 30 team stacks could use the repaired provider through standard Terraform configuration. The registry then expanded to host our own [environment-lifecycle provider](/case-studies/environments-you-can-create-and-destroy-with-one-command/) and mirror public providers, giving the wider repository one distribution and caching layer.
