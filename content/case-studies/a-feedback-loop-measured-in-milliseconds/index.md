---
title: A feedback loop measured in milliseconds
summary: "Pre-commit hooks that fix what they can, compiled from source by the hook manager itself, and in-cluster CI runners with warm caches: the formatting check went from about seven seconds to 59 milliseconds."
role: Introduced pre-commit to the company, wrote the hook library, moved every repository to prek, rewrote the hot hooks in Go and set up the in-cluster runners.
evidence: About seven seconds per commit before; 59 milliseconds for a fifty-file commit after, measured on the same repository.
topics:
  - devex
  - delivery
order: 4
aliases:
  - 04-a-feedback-loop-measured-in-milliseconds
  - fast-feedback
featured: false
spotlight: false
sequel: one-tool-version-everywhere
---

## The situation

Code review kept catching the same mechanical problems: formatting, stale documentation, missing ownership entries, malformed commit messages. People were doing robot work, and CI took minutes to report what a script could have reported before the commit existed.

## What I did

I introduced pre-commit checks to the company and built our own hook library. The rule: fix what is fixable, and only complain about the rest ([the two kinds of hook](/blog/posts/save-yourself-from-formatting-hell/), in a note). Formatting, documentation generation and navigation files are repaired by the hooks themselves; in CI, a bot commits the fix to the pull request.

Over three years I kept tightening the loop. I parallelised the slow hooks and added caching. I migrated the whole company to prek, a Rust reimplementation of pre-commit that reads the same configuration. And I rewrote the critical hooks in Go, with the hook manager compiling them from source, so nobody installs anything: no brew, no npm, no "works on my machine". A new laptop or a CI runner gets identical checks with zero setup.

To make CI as fast as the laptop, I set up the company's own GitHub Actions runners inside our clusters, built for these checks and for our container image builds, with node-local caching so a warm runner starts checking in seconds.

## The interesting part

I benchmarked instead of guessing. On our biggest repository the old formatting hook took about seven seconds per commit; the rewritten one runs a fifty-file commit there in 59 milliseconds.

## What it changed

Mistakes are fixed before they are committed, review comments moved from formatting to substance, and the checks are self-contained enough to spread to every repository without an installation guide.
