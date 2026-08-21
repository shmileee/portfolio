---
number: 5
slug: one-tool-version-everywhere
title: "One tool version, everywhere: from decision record to a centrally cached CI"
summary: Version drift — between two laptops, or between a laptop and CI — stopped being a category of bug.
topics:
  - developer experience
  - delivery
featured: false
spotlight: false
---

## THE SITUATION

"Works on my machine" almost always means "different tool versions". Two engineers run the same Terraform command and get different results; a pipeline breaks because CI has a newer formatter than the laptop that wrote the code. In 2022 I had standardized the company on a version manager (`asdf`) through one of our first architecture decision records — every repository declares its tool versions, the manager installs them.
It solved the consistency problem, but over two years the cracks showed: every command ran through a shim — a small stand-in binary adding a redirection layer — which made everything slightly slow, and plugin management was a chore nobody loved.

## WHAT I DID

I replaced my own standard, properly. In 2024 I wrote the superseding decision record — evaluated against the incumbent with the trade-offs in writing, including the honest negatives — and moved the company to `mise`, a faster Rust reimplementation that reads the same version files, so the migration cost was near zero. Then I made the tool file the backbone of both onboarding and CI:

```toml filename="mise.toml"
[tools]
prek           = "0.4.13"
terraform      = "1.15.8"
terramate      = "0.17.2"
terraform-docs = "0.24.0"
# node runs the JS tests for one subsystem — stdlib test runner only
node           = "24"
# python runs a local pre-commit hook script — stdlib only
python         = "3.14.7"
# go is used by the hook manager to build our Go hooks in an isolated toolchain
go             = "1.26"

[env]
# Repo-specific environment travels with the repo too:
# e.g. routing provider downloads through our internal registry mirror.
TF_CLI_CONFIG_FILE = "{{config_root}}/.terraformrc"
```

A new contributor's setup is one command: `mise install`. The file pins exact versions, and the comments explain why each tool is there — the config is its own onboarding document.
The same file drives CI: I rebuilt our centralized pre-commit workflow — one reusable GitHub Actions workflow that every repository calls instead of maintaining its own — to run inside a maintained `mise` container image and install from the very same pins. Local and CI can no longer disagree, and a fix to the workflow lands in every repository at once.

## THE INTERESTING PART

The caching. Fast CI dies on cache mistakes, and each one taught a lesson that's now written into the workflow itself.
Restoring the big tool archive can cost more than a fresh install — so tool caching is a per-repository toggle with that exact warning in its description. Cache uploads were dominating pull-request runs — so pull requests only restore the cache and only the main branch saves it. On our in-cluster runners the cache moved to the node's local disk — but the tool manager keeps one global directory, and a shared one leaks tools between repositories, so each repository gets its own isolated subdirectory. And pull requests from forks are excluded from writing entirely: untrusted code must never poison a shared cache.

## WHAT IT CHANGED

Setup went from a wiki page to one command. Version drift — between two laptops, or between a laptop and CI — stopped being a category of bug. And because the workflow is centralized, the whole company's checks get faster every time one person improves one file. It also set a precedent I'm fond of: standards have lifecycles — the person who introduces one should be willing to replace it, in writing, when something better exists.
