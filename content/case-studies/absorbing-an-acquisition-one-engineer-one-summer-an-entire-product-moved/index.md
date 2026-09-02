---
title: Absorbing an acquisition
summary: Six services moved from Heroku to AWS and onto the shared platform in about two months.
topics:
  - delivery
  - reliability
  - cost
featured: false
spotlight: false
---

## The situation
The company made an acquisition, and the acquired product ran on Heroku — a different cloud, a different deployment model, different everything. Running two parallel stacks means double the tooling, double the on-call knowledge, and an "integration" that exists on slides but not in production.

## What I did
I led and implemented the Heroku-to-AWS platform migration in about two months.

I wrote the deployment charts for their services — the backend API, background workers, the web frontend, and a handful of supporting jobs — and wired them into our GitOps pipeline like any other internal app. I recreated everything their old hosting had quietly been providing: the databases with the extensions their code depended on, a cache, object storage, certificates for their public domain, secrets management.

I replaced their deployment pipeline by putting CI runners inside our cluster, so their existing repositories could deploy the new way without disruption.

We rehearsed the database export and import, deployed to staging, then production — and after a dry run, cut over DNS in a scheduled maintenance window. The switch itself was a one-line configuration change, built to be rolled back in seconds.

## The interesting part
The hard part wasn't the cutover itself; it was making the move boring enough that the acquired team could keep shipping through the same pipeline, with the same dashboards and their own alert channel from day one.

## What it changed
One less cloud, one less deployment model, one less set of tools to staff and secure. The acquired team shipped through the same pipeline as everyone else, with the same dashboards and their own alert channel from day one — and the old hosting account could be closed.

Years later, when the product was eventually sunset, decommissioning it was ordinary infrastructure work instead of archaeology.
