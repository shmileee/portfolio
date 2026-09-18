---
title: Kubernetes upgrades became a checklist
summary: A deprecated-API dashboard for every cluster and a fixed four-cluster sequence, operations to production, turned upgrades from an event into a rehearsed routine.
role: Ran the catch-up upgrades, built the deprecated-API exporter and dashboards, and set the staged rollout order.
evidence: Four consecutive version upgrades in my first six weeks; every upgrade since has followed the same sequence through the GitOps pipeline.
topics:
  - reliability
order: 9
aliases:
  - 09-kubernetes-upgrades
featured: false
spotlight: false
---

## The situation

When I joined, our clusters were years behind. I ran four consecutive version upgrades in my first six weeks just to reach supported ground. Cluster upgrades are where platform teams get hurt: APIs are removed between versions, workloads break, and the fear of upgrading is how a company ends up years behind in the first place.

## What I did

I built the practice that turned upgrades from an event into a checklist.

See problems before they happen. I took kube-no-trouble, a scanner that finds workloads still using APIs the next Kubernetes version removes, wrapped it in a small exporter, and fed it into our monitoring. Every cluster continuously reports its deprecated-API usage on a dashboard, so before any upgrade the red rows name exactly which workloads need fixing, long before anything breaks.

Staged rollout as a rhythm. Upgrades follow a fixed order across four clusters: operations first, then development, staging, and production last. Each step is control plane, nodes, then core components, all as reviewable pull requests through the GitOps pipeline.

## The interesting part

Kubernetes later grew a built-in signal for the same thing: the API server itself reports deprecated-API usage. The dashboards were rebased onto the native metric and the scanner retired. The tool was replaced; the practice it created is still how every upgrade starts.

## What it changed

Deprecated-API discovery moved onto dashboards, and upgrades follow the same rehearsed sequence from operations through production.
