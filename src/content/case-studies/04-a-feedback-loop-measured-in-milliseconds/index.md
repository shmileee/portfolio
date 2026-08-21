---
number: 4
slug: a-feedback-loop-measured-in-milliseconds
title: A feedback loop measured in milliseconds
summary: The old formatting hook took about seven seconds; the rewritten one runs a fifty-file commit in 59 milliseconds.
topics:
  - developer experience
  - delivery
featured: false
spotlight: false
---

## THE SITUATION

Code review kept catching the same mechanical problems: formatting, stale documentation, missing ownership entries, malformed commit messages. Humans were doing robot work, and CI took minutes to tell you what a script could have told you before you even committed.

## WHAT I DID

I introduced pre-commit checks to the company and built our own hook library. The philosophy: fix what's fixable, only complain about the rest. Formatting, documentation generation, navigation files — the hooks repair these automatically; in CI, a bot commits the fix to your pull request by itself.
Over three years I kept tightening the loop: parallelized the slow hooks, added caching, migrated the whole company to `prek` (a faster Rust reimplementation of pre-commit), and rewrote the critical hooks in Go with a twist — the hook manager compiles them from source itself, so nobody ever installs anything. No brew, no npm, no "works on my machine": a new laptop or a CI runner gets identical checks with zero setup.
To make the loop fast in CI as well, I set up the company's internal GitHub Actions runners inside our own clusters — built to speed up exactly these checks and our container image builds — with node-local caching so a warm runner starts checking in seconds.

## THE INTERESTING PART

I benchmarked instead of guessing. The old formatting hook took about seven seconds on our biggest repository; the rewritten one runs a fifty-file commit in 59 milliseconds.

## WHAT IT CHANGED

Mistakes get fixed before they're even committed, review comments moved from formatting to substance, and the checks are self-contained enough that they spread to every repository without an installation guide.

SEQUEL → [case study 5 — one tool version, everywhere](/case-studies/05-one-tool-version-everywhere/)
