---
title: A feedback loop measured in milliseconds
summary: "A matched benchmark reduced fifty-file formatting from 356 to 74 milliseconds. Shared checks fix formatting and regenerate documentation before review."
role: "Introduced pre-commit checks, built the shared hook library, migrated repositories to `prek`, and optimized hooks and CI runners."
evidence: "A seven-run benchmark of the old and replacement hooks measured 4.8× faster formatting for fifty files and 17.9× for all 1,793 matching handwritten Terraform files."
topics:
  - devex
  - delivery
order: 2
aliases:
  - 04-a-feedback-loop-measured-in-milliseconds
  - fast-feedback
featured: false
spotlight: false
sequel: one-tool-version-everywhere
---

## Move mechanical work out of review

Formatting, stale documentation, missing ownership entries, and malformed commit messages repeatedly reached code review. CI could catch them, but only after a push and several minutes of waiting.

I introduced pre-commit checks and built a shared hook library. Checks that could repair a file did so: formatting, generated module documentation, and documentation navigation. Checks that needed a human decision, such as assigning an owner, reported the problem. In repositories with CI autofixes enabled, a bot commits the repairs to the pull request.

## Optimize the work the hook actually does

Over three years I added concurrency and caching, then moved repositories to `prek`, which reads the existing `pre-commit` configuration.

The Terraform checks originally came from `antonbabenko/pre-commit-terraform`. As hook runtime became a bottleneck, I replaced its `terraform_fmt` and `terraform_docs` hooks with `terraform-fmt` and `terraform-docs-parallel` in our shared hook library. I rewrote documentation generation and ownership checks in Go; the hook manager builds and caches those binaries in its isolated environment.

The formatting hook needed a different solution. A custom Go formatter did not reproduce all of Terraform's behavior, including legacy syntax rewrites and diagnostics for invalid input. I replaced it with a small wrapper around the real formatter. The speedup came from passing a batch of matching files to one Terraform process instead of starting a formatter process for each directory.

The core operation is deliberately small:

```bash title="hooks/terraform_fmt.sh"
# Excerpt: installation and version checks omitted.
# Format the batch of matching files supplied by prek.
exec terraform fmt "$@"
```

Locally, `prek` supplies matching staged files; CI uses `--all-files` to check all matching files in the repository. The hook configuration excludes Terramate-generated files, which belong to the generator. The documentation hook similarly updates only files containing the documentation tool's injection markers, preserving handwritten pages.

## Measure the local check separately from CI

I compared the old and replacement hooks on identical files from the pre-migration repository. The follow-up benchmark, run on 25 September 2026, measured the cost of formatting the same work:

The batched hook was **4.8× faster** for fifty files and **17.9× faster** for the full workload.

<div class="numeric-table">

| Files | Previous hook | Batched hook |
| ---: | ---: | ---: |
| 50 | 356 ms | **74 ms** |
| 1,793 | 13.22 s | **0.740 s** |

</div>

The fifty-file sample covered 49 directories; the full workload covered 1,793 handwritten files in 372 directories. Times are medians of seven paired runs.

<details>
<summary>Benchmark method and raw measurements</summary>

These are medians from seven paired runs after one warm-up per hook. Both used Terraform 1.15.8 on the same Apple M5 Max machine. The comparison used `antonbabenko/pre-commit-terraform` v1.108.0 and the shared library's v2.1.1 wrapper, with the old hook's default parallelism left enabled.

The full workload includes the files selected by the old repository filter, excluding Terramate-generated files. The fifty-file sample is evenly spaced through that sorted file list. Each workload was copied into a temporary directory containing only its selected files, then preformatted with the same Terraform binary. Both hooks received exactly the same paths; content hashes were unchanged after the runs.

This isolates hook execution on already-formatted files. It excludes hook-manager startup, installation, other checks, and CI setup. Execution order alternated between pairs, and Terraform's checkpoint lookup was disabled for both. The result measures the cost of directory traversal and process startup, including any extra checks performed by each wrapper. The small sample spans many directories; fifty files in one directory would give the old hook fewer processes to start. [Raw timings and benchmark metadata](/case-studies/a-feedback-loop-measured-in-milliseconds/benchmark-results.json) are available alongside this study.

**Original optimization measurements.**

The implementation notes recorded 59 ms for a fifty-file commit and 1.2 s for a full run in a repository containing 3,567 Terraform files. They also recorded 6.8 s for the previous hook, but did not identify that baseline's exact input set. Those observations describe the original optimization; they are not used to calculate the matched speedups above.

</details>

For CI, I set up GitHub Actions runners inside our clusters and used node-local caches to reduce repeated setup. The [shared tool-version workflow](/case-studies/one-tool-version-everywhere/) installs the tools the hooks depend on; hook binaries themselves require no separate manual installation.

## What changed

Routine corrections moved earlier in the workflow and became automatic. Engineers could run the same checks locally and in CI, while reviewers spent less time asking for formatting or generated-file updates. The [hook design notes](/blog/posts/save-yourself-from-formatting-hell/) explain the distinction between repairs a tool can make and decisions it should leave to an engineer.
