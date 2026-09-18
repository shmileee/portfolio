---
title: One tool version everywhere
summary: One `mise.toml` per repository pins every tool for laptops and CI alike; a shared workflow installs from the same pins, so version drift stopped being a category of bug.
role: Wrote the decision records that introduced asdf and later replaced it with mise, and rebuilt the shared pre-commit workflow around the pins.
evidence: Setup is one command, `mise install`; the shared workflow runs from the same file, and fork pull requests can never write the cache.
period: 2022–2024
topics:
  - devex
  - delivery
order: 5
aliases:
  - 05-one-tool-version-everywhere
  - tool-versions
featured: false
spotlight: false
cardLabel: sequel
---

## The situation

"Works on my machine" almost always means "different tool versions". Two engineers run the same Terraform command and get different results; a pipeline breaks because CI has a newer formatter than the laptop that wrote the code. In 2022 I standardised the company on a version manager, asdf, through one of our first architecture decision records: every repository declares its tool versions and the manager installs them.

It solved the consistency problem. Over two years the cracks showed: every command ran through a shim, a small stand-in binary that adds a layer of redirection, which made everything slightly slow, and plugin management was a chore nobody loved.

## What I did

In 2024 I wrote the superseding decision record, evaluated against the incumbent with the trade-offs in writing, negatives included, and moved the company to mise, a Rust reimplementation that reads the same version files, so the migration cost was near zero. Then I made the tool file the backbone of both onboarding and CI:

```toml title="mise.toml"
[tools]
prek           = "0.4.13"
terraform      = "1.15.8"
terramate      = "0.17.2"
terraform-docs = "0.24.0"
# runs the JS tests of one subsystem; stdlib test runner only
node           = "24"
# runs a local pre-commit hook script; stdlib only
python         = "3.14.7"
# the hook manager builds our Go hooks in an isolated toolchain
go             = "1.26"

[env]
# repository-specific environment travels with the repository:
# provider downloads go through the internal registry mirror
TF_CLI_CONFIG_FILE = "{{config_root}}/.terraformrc"
```

A new contributor's setup is one command, `mise install`. The file pins exact versions, and the comments say why each tool is there, so the configuration is its own onboarding document. Which tools deserve a pin at all is [a note of its own](/blog/posts/mise-faster-smarter-tool-versioning/).

The same file drives CI. I rebuilt our centralised pre-commit workflow, one reusable GitHub Actions workflow that every repository calls instead of maintaining its own, to run inside a maintained mise container image and install from the very same pins. Local and CI can no longer disagree, and a fix to the workflow lands in every repository at once.

## The interesting part

The caching. Fast CI dies on cache mistakes, and each one taught a lesson that is now written into the workflow itself.

- Restoring the big tool archive can cost more than a fresh install, so tool caching is a per-repository toggle with that exact warning in its description.
- Cache uploads were dominating pull request runs, so pull requests only restore the cache and only the main branch saves it.
- On our in-cluster runners the cache moved to the node's local disk. The tool manager keeps one global directory, and a shared one leaks tools between repositories, so each repository gets its own isolated subdirectory.
- Pull requests from forks are excluded from writing entirely: untrusted code must never poison a shared cache.

## What it changed

Setup went from a wiki page to one command. Version drift, between two laptops or between a laptop and CI, stopped being a category of bug. Because the workflow is centralised, the whole company's checks get faster every time one person improves one file. It also set a precedent: standards have lifecycles, and the person who introduces one should be willing to replace it, in writing, when something better exists.
