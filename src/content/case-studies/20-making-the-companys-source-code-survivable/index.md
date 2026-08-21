---
number: 20
slug: making-the-companys-source-code-survivable
title: Making the company's source code survivable
summary: Destroying the company’s code and its backups would now require compromising two unrelated systems at once.
topics:
  - security
  - reliability
featured: true
spotlight: false
---

## THE SITUATION

The company's entire product — over a thousand repositories — lived in one GitHub organization. Everyone worried about outages; almost nobody had asked the darker question: what if someone with stolen admin credentials deleted it all? The uncomfortable answer was that any attacker powerful enough to destroy the repositories was, in every design we had, also powerful enough to destroy the backups.

## WHAT I DID

I designed and built a disaster-recovery system where that's no longer true. Every change to every repository is captured within minutes and written to storage that physically cannot be modified or deleted — not by an attacker, not by an administrator, not even by me.

The backups live in a separate AWS account with its own separate credentials, and the only permission the backup pipeline has is "append new data". Destroying the company's code and its backups would now require compromising two unrelated systems at once.

## THE INTERESTING PART

Git has a blind spot: if someone force-pushes over history, a normal mirror quietly forgets the old version — your "backup" happily replicates the damage.

> I solved this by having the system photograph the state of every repository before each sync, so even history an attacker rewrote is still recoverable. And "does it restore?" isn't taken on faith: recovery is proven by rebuilding repositories from the tamper-proof copies and verifying them, as a drill.

## WHAT IT CHANGED

Losing the codebase went from an existential, unanswered risk to a scenario with a tested recovery path — something the business can put a recovery-time number on.
