---
title: Kubernetes upgrades became a checklist
summary: Deprecated-API signals and a staged four-cluster sequence made upgrade risk visible before production.
topics:
  - reliability
featured: false
spotlight: false
---

## The situation
Cluster upgrades are where platform teams get hurt: APIs get removed between versions, workloads break, and the fear of upgrading is how companies end up years behind on unsupported versions. (When I joined, our clusters *were* years behind — I ran four consecutive version upgrades in my first six weeks just to reach supported ground.)

## What I did
I built the practice that turned upgrades from an event into a checklist:

- See problems before they happen. I took kube-no-trouble — a scanner that finds workloads still using APIs the next Kubernetes version removes — wrapped it in a small exporter, and fed it into our monitoring. Every cluster continuously reports its deprecated-API usage on a dashboard: before any upgrade, red rows name exactly which workloads need fixing, long before anything breaks. (Kubernetes later grew a built-in signal for this — the API server now reports deprecated-API usage itself — and the dashboards were rebased onto it. The tool was replaced; the practice it created is still how upgrades start.)

- Staged rollout as a rhythm. Upgrades follow a fixed order across four clusters — operations first, then development, staging, and production last — each step being control plane, nodes, and core components, all as reviewable pull requests through the GitOps pipeline.

## The interesting part
The old scanner was only the start; once the API server itself began surfacing deprecated usage, the dashboarding practice simply moved to the native signal and kept the same flow.

## What it changed
Deprecated-API discovery moved onto dashboards, and upgrades now follow the same rehearsed sequence from operations through production.
