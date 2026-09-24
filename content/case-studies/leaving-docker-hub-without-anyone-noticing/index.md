---
title: Leaving Docker Hub without a flag day
summary: Pull-through mirror repositories in our own registry and Kyverno mutation policies moved every image pull off Docker Hub while teams kept shipping, before a single manifest was edited.
role: Proposed the exit, wrote the plan and implemented it end to end, from the mirror repositories to the rewrite policies and the manifest sweep.
evidence: Hundreds of images served from the mirror within weeks; the subscription cancelled; the rewrite policy stayed as a safety net until its rationale was deleted a year and a half later.
topics:
  - cost
  - reliability
  - security
order: 13
aliases:
  - 17-leaving-docker-hub-without-anyone-noticing
  - registry-migration
featured: false
spotlight: false
---

## The situation

Docker Hub announced price changes. We had years of accumulated dependence on it: hundreds of images pulled by clusters, CI and laptops, with rate limits a permanent background worry. Migrations like this usually die in coordination, because countless manifests across dozens of teams reference the old registry and nobody can ask everyone to move at once.

## What I did

I proposed the move, wrote the plan, a project timeline whose final line was "cancel the Docker Hub subscription", and implemented it end to end.

First the infrastructure: [pull-through mirror repositories](/blog/posts/setting-up-pull-through-cache-repositories-in-aws-ecr/) in our own AWS registry that transparently cache Docker Hub and, soon after, several other public registries. Credentials are handled centrally, cleanup rules keep the caches from growing forever, and read access is granted organization-wide.

Then the bridge that removed the flag day. Kyverno, the policy engine that validates and mutates objects at the Kubernetes admission layer, rewrites image references in flight, so a workload asking for a Docker Hub image receives the mirrored copy instead. The policies went out one namespace at a time. Image pulls moved to our own registry while teams kept shipping, and within weeks the mirror was serving hundreds of images. The policy itself is [written up on the blog](/blog/posts/rewriting-docker-image-registries-with-kyverno/).

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — THE INVISIBLE REGISTRY SWITCH</div>
  <svg aria-label="A workload manifest still names a Docker Hub image; Kyverno rewrites the registry at admission; the pod pulls from the mirror repository in our own registry, which fetches from Docker Hub once and then serves the image locally; the policy stays as a safety net after the manifests are migrated" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 342" role="img"><defs><marker id="arrDH" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="190" y="10" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Workload manifest</text><text x="360" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">image: docker.io/library/nginx:1.27</text><path d="M360,68 L360,90" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrDH)"></path><rect x="190" y="92" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="115" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Kyverno mutation at admission</text><text x="360" y="133" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">registry rewritten in flight</text><path d="M530,121 L548,121" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrDH)"></path><rect x="550" y="92" width="150" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="625" y="115" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Safety net</text><text x="625" y="133" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">kept after the sweep</text><path d="M360,150 L360,172" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrDH)"></path><rect x="190" y="174" width="340" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="197" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Pod pulls from the mirror</text><text x="360" y="215" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">111111111111.dkr.ecr.eu-west-1.amazonaws.com/</text><text x="360" y="233" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">docker-hub/library/nginx:1.27</text><path d="M360,248 L360,270" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrDH)"></path><rect x="190" y="272" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="360" y="295" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Docker Hub</text><text x="360" y="313" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">fetched once per image, then served locally</text></svg>
</div>

Then I migrated the manifests themselves in a focused sweep, and left the rewrite policy running as a safety net for stragglers.

## Retiring the bridge

A year and a half after the sweep nothing depended on the bridge any more, and I deleted the migration rationale from the policy document. The rewrite rule itself stays: a manifest that names Docker Hub tomorrow still gets the mirror.

## What it changed

Image pulls come from inside our own cloud: no external rate limits in the critical path, central credentials instead of scattered ones, lifecycle rules instead of unbounded growth, and one vendor bill gone. The mirror layer then became the distribution foundation for [the container supply chain](/case-studies/turning-container-images-from-a-liability-into-a-supply-chain/).
