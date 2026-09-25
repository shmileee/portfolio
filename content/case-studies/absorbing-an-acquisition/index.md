---
title: Absorbing an acquisition
summary: "I migrated six services from Heroku to the shared AWS platform in about two months while the acquired team continued shipping, with a rehearsed database move and reversible DNS cutover."
role: "Led and implemented the migration, including service deployment, supporting infrastructure, database rehearsals, and cutover."
evidence: "Six services migrated in about two months; the old hosting account closed; the acquired team had shared monitoring and its own alert channel at handover."
topics:
  - delivery
  - reliability
  - cost
order: 12
aliases:
  - 16-absorbing-an-acquisition-one-engineer-one-summer-an-entire-product-moved
  - absorbing-an-acquisition-one-engineer-one-summer-an-entire-product-moved
  - acquisition-migration
featured: false
spotlight: false
---

## Bring an acquired product onto the shared platform

The acquired product ran on Heroku, while our shared platform ran on AWS. Supporting both required separate deployment workflows, tooling, and operational knowledge.

I led and implemented the migration of six services in about two months. The acquired team needed to keep shipping during the work and arrive on the new platform with an operational setup they could use immediately.

## Recreate the service contract before changing traffic

I wrote deployment charts for the backend API, background workers, frontend, and supporting jobs, then connected them to the existing GitOps pipeline. I also provisioned the services the application had relied on in Heroku: databases with the required extensions, cache, object storage, certificates, and secrets management.

CI runners inside the cluster let the existing repositories deploy through the shared pipeline. That allowed the team to keep working in its repositories while I prepared the new hosting environment.

The migration covered both runtime dependencies and the team's operating workflow:

**Application delivery.** Deployment charts and CI integration

**Data and dependencies.** Databases, required extensions, cache, storage, and secrets

**Traffic.** Public-domain certificates and a reversible DNS change

**Operations.** Shared dashboards and a dedicated alert channel

## Rehearse the data move, then cut over

We rehearsed database export and import, deployed to staging and production, and performed a dry run before changing DNS in a scheduled maintenance window.

The routing change itself was one configuration line, designed to be reversed in seconds. That made the DNS decision reversible; the database migration still required its own rehearsal and coordinated maintenance window.

Preparing the deployment and monitoring workflows early meant the acquired team could continue shipping during the migration and use the shared operational tooling from the first day on the new platform.

## What changed

Six services moved onto the shared platform in about two months, and the old hosting account was closed. The organization had one fewer hosting environment and deployment workflow to maintain. When the product was later retired, its infrastructure could be decommissioned through the same processes as the rest of the platform.
