---
title: One tool version everywhere
summary: "Repository tool definitions became the shared input for laptop setup and CI. One install command replaced manual setup, with cache isolation between repositories."
role: "Introduced `asdf`, later evaluated and adopted `mise`, and rebuilt the shared pre-commit workflow around repository tool definitions."
evidence: "Local setup and CI both use `mise.toml`; node-local caches are separated by repository, and fork pull requests skip that shared cache path."
period: 2022–2026
topics:
  - devex
  - delivery
order: 3
aliases:
  - 05-one-tool-version-everywhere
  - tool-versions
featured: false
spotlight: false
cardLabel: sequel
---

## Give local development and CI the same inputs

Engineers sometimes ran the same command with different tool versions. A formatter could pass locally and fail in CI, or a Terraform command could behave differently on two laptops.

In 2022 I introduced `asdf` through an architecture decision record: repositories would declare their tool versions, and the version manager would install them. In 2024 I evaluated `mise` as its replacement, documenting the migration and trade-offs. It supported the existing version files, which reduced the work required to move repositories over.

The important change was a shared source of configuration. The repository's tool file now drives both onboarding and CI.

## Keep setup with the code

This example includes the infrastructure tools, hook manager, and runtimes used by repository checks. The comments explain why the less obvious dependencies belong in the shared setup:

```toml title="mise.toml"
[tools]
prek           = "0.4.13"
terraform      = "1.15.8"
terramate      = "0.17.2"
terraform-docs = "0.24.0"
# Runs a subsystem's JavaScript tests with the standard test runner.
node           = "24"
# Runs a repository-local pre-commit hook.
python         = "3.14.7"
# The hook manager builds our Go hooks in an isolated toolchain.
go             = "1.26"

[env]
# Route provider downloads through the internal registry mirror.
TF_CLI_CONFIG_FILE = "{{config_root}}/.terraformrc"
```

After installing `mise` and configuring repository access, a contributor runs `mise install`. The same file can carry repository-specific environment settings, such as the path to Terraform's registry configuration. Comments explain why less obvious tools are needed; [the selection criteria](/blog/posts/mise-faster-smarter-tool-versioning/) are documented separately.

In 2026, I rebuilt the reusable pre-commit workflow to install from these definitions inside a maintained `mise` image. Repositories call the shared workflow instead of maintaining their own setup scripts. Improvements reach callers through their workflow reference.

## Make caching an explicit choice

Installing consistent versions solved one problem. Caching them introduced another: time spent moving caches, and the risk of tools leaking between repositories on shared runners.

**Cache only what helps.** Restoring a large tool archive can take longer than installing. Tool caching can be disabled independently of hook caching.

**Keep uploads off PRs.** Cache uploads extended pull request runs. Only the default branch saves the GitHub Actions caches.

**Separate repositories.** `mise`'s shared data directory includes tools and shims. Node-local data is separated into a directory per repository.

**Exclude fork PRs.** Fork pull requests run untrusted code, so they skip the shared node-local cache setup.

The isolation matters as much as the cache hit rate. A repository should not pass a check because a previous job happened to install a tool it never declared.

## What changed

Tool setup became a command backed by versioned configuration. Local checks and CI consume the same declarations, making version mismatches easier to prevent and diagnose. The architecture record that replaced `asdf` remains alongside the original decision, preserving why the standard changed.
