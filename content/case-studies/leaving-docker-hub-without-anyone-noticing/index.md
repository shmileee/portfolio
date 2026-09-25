---
title: Leaving Docker Hub without a flag day
summary: "Registry mirrors and admission-time image rewrites let Kubernetes workloads move to our own registry before teams changed their manifests. The Docker Hub subscription was then retired."
role: "Proposed and implemented the migration, including pull-through caches, staged rewrite policies, manifest updates, and subscription retirement."
evidence: "The mirror served hundreds of images within weeks; the subscription was cancelled, and the rewrite rule remained as a fallback for old references."
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

## Remove the need for a coordinated switch

Docker Hub pricing changes prompted a review of our dependency on the service. Hundreds of image references had accumulated across cluster manifests, CI, and developer workflows. Updating them all at once would have required coordination across many teams.

I proposed and implemented a migration that separated traffic redirection from source cleanup. Workloads could begin pulling through our registry before their owners changed the manifests.

## Put a compatibility layer in front of the migration

I created pull-through cache repositories in AWS ECR for Docker Hub, then extended the pattern to other public registries. Credentials were managed centrally, lifecycle rules controlled cache growth, and organization-wide read access made the mirrors available to consumers.

Next I introduced Kyverno mutation policies that rewrite image references when Kubernetes admits a workload. A manifest can still name a Docker Hub image while the admitted pod uses the equivalent mirror path.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — THE INVISIBLE REGISTRY SWITCH</div>
  <svg aria-label="A workload manifest still names a Docker Hub image; Kyverno rewrites the registry at admission; the pod pulls from the mirror repository in our own registry, which fetches and refreshes cached images from Docker Hub; the policy stays as a safety net after the manifests are migrated" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 342" role="img"><defs><marker id="arrDH" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><rect x="190" y="10" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="33" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Workload manifest</text><text x="360" y="51" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">image: docker.io/library/nginx:1.27</text><path d="M360,68 L360,90" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrDH)"></path><rect x="190" y="92" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="115" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Kyverno mutation at admission</text><text x="360" y="133" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">registry rewritten in flight</text><path d="M530,121 L548,121" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrDH)"></path><rect x="550" y="92" width="150" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="625" y="115" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Safety net</text><text x="625" y="133" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">kept after the sweep</text><path d="M360,150 L360,172" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrDH)"></path><rect x="190" y="174" width="340" height="74" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="360" y="197" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Pod pulls from the mirror</text><text x="360" y="215" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">111111111111.dkr.ecr.eu-west-1.amazonaws.com/</text><text x="360" y="233" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">docker-hub/library/nginx:1.27</text><path d="M360,248 L360,270" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrDH)"></path><rect x="190" y="272" width="340" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="360" y="295" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Docker Hub</text><text x="360" y="313" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">upstream cache fills and refreshes</text></svg>
</div>

I rolled the policies out one namespace at a time. Teams continued deploying while image pulls moved through the mirror, which was serving hundreds of images within weeks. The [cache configuration](/blog/posts/setting-up-pull-through-cache-repositories-in-aws-ecr/) and [rewrite policy](/blog/posts/rewriting-docker-image-registries-with-kyverno/) are documented separately.

The mirror serves cached content from our cloud account. Cache fills and refreshes still depend on the upstream registry, so this reduces direct dependency on Docker Hub during routine pulls without making upstream availability irrelevant.

## Finish the source migration without removing compatibility

Once the mirror was handling traffic, I updated the manifests in a focused sweep. The rewrite policy remained enabled to catch references that had been missed or were introduced later.

A year and a half later, the migration no longer needed its original explanatory note, so I removed that rationale from the policy document. The rule itself stayed: it continued to enforce the preferred registry path.

## What changed

The Docker Hub subscription was cancelled. Image distribution gained centralized credentials and cache lifecycle rules, while Kubernetes workloads moved without a coordinated deployment freeze. The mirror layer also provided a distribution foundation for the [internal image factory](/case-studies/turning-container-images-from-a-liability-into-a-supply-chain/).
