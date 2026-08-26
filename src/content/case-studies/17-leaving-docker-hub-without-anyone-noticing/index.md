---
number: 17
slug: leaving-docker-hub-without-anyone-noticing
title: Leaving Docker Hub without a flag day
summary: A registry mirror and Kyverno admission policies moved image pulls before teams had to edit every manifest.
topics:
  - cost
  - reliability
  - security
featured: false
spotlight: false
---

## THE SITUATION

Docker Hub announced price changes. We had years of accumulated dependence on it: hundreds of images pulled by clusters, CI, and laptops, with rate limits a permanent background worry. Migrations like this usually die in coordination — countless manifests across dozens of teams all reference the old registry, and you can't ask everyone to move at once.

## WHAT I DID

I proposed the move, wrote the plan — a project timeline whose final line was "cancel the Docker Hub subscription" — and implemented it end to end.

First the infrastructure: mirror repositories in our own AWS registry that transparently cache Docker Hub and, soon after, several other public registries — credentials handled centrally, cleanup rules so caches don't grow forever, read access granted organization-wide.

Then the bridge that removed the flag day: the Kyverno admission-time mutation policies from [case study 10](/case-studies/10-kyverno-at-the-cluster-door/), rewriting image references on the fly so a workload asking for a Docker Hub image transparently receives the mirrored copy. Image pulls moved to our own registry while teams continued shipping; within weeks the mirror was serving hundreds of images.

Then I migrated the manifests themselves in a focused sweep, and left the rewrite policy running as a safety net for stragglers. A year and a half later I deleted the migration rationale from the policy document — the project's quiet way of saying "done".

## WHAT IT CHANGED

Image pulls now come from inside our own cloud — no external rate limits in the critical path, central credentials instead of scattered ones, lifecycle rules instead of unbounded growth, and a vendor bill eliminated.

The vendor bill disappeared, and the mirror layer became the distribution foundation for the container supply chain in [case study 19](/case-studies/19-turning-container-images-from-a-liability-into-a-supply-chain/).
