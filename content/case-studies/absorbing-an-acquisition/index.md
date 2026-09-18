---
title: Absorbing an acquisition
summary: Six services moved from Heroku to AWS and onto the shared platform in about two months, with a DNS cutover built to roll back in seconds.
role: Led and implemented the whole migration, from the deployment charts and managed services to the rehearsed database move and the cutover.
evidence: About two months from start to cutover; the acquired team kept shipping through the shared pipeline from day one, and the old hosting account was closed.
topics:
  - delivery
  - reliability
  - cost
order: 16
aliases:
  - 16-absorbing-an-acquisition-one-engineer-one-summer-an-entire-product-moved
  - absorbing-an-acquisition-one-engineer-one-summer-an-entire-product-moved
  - acquisition-migration
featured: false
spotlight: false
---

## The situation

The company made an acquisition, and the acquired product ran on Heroku: a different cloud, a different deployment model, a different everything. Running two stacks in parallel means double the tooling, double the on-call knowledge, and an "integration" that exists on slides but not in production.

## What I did

I led and implemented the Heroku-to-AWS migration in about two months.

I wrote the deployment charts for their services, the backend API, background workers, the web frontend and a handful of supporting jobs, and wired them into our GitOps pipeline like any other internal application. I recreated everything the old hosting had been providing: the databases with the extensions their code depended on, a cache, object storage, certificates for their public domain, secrets management.

I replaced their deployment pipeline by putting CI runners inside our cluster, so their existing repositories could deploy the new way without disruption.

We rehearsed the database export and import, deployed to staging, then production, and after a dry run cut over DNS in a scheduled maintenance window.

## The interesting part

The switch itself was a one-line configuration change, built to be rolled back in seconds. The hard part was not the cutover; it was making the move boring enough that the acquired team could keep shipping the whole time, and arrive on the new platform with the same dashboards and their own alert channel on day one.

## What it changed

One less cloud, one less deployment model, one less set of tools to staff and secure. The old hosting account could be closed. Years later, when the product was eventually sunset, decommissioning it was ordinary infrastructure work instead of archaeology.
