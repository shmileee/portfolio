---
title: Turning container images from a liability into a supply chain
summary: "I built a shared image pipeline and led the migration of 48 images in four days. Releases build for x86 and ARM, run tests, and verify published artifacts against their digests."
role: "Designed and built the image factory, established its publishing contract, and created the migration playbook used by teammates."
evidence: "48 images migrated in four days; 35 releases in the first 20 days; version conflicts, architecture mismatches, and publishing retries covered by tests."
topics:
  - security
  - cost
  - delivery
order: 15
aliases:
  - 19-turning-container-images-from-a-liability-into-a-supply-chain
  - container-supply-chain
featured: true
spotlight: false
---

## Make each image an independently maintained component

Our internal images included patched third-party tools, base images, and CI runners. Their build processes varied by repository. Patching required manual investigation, and most images had no ARM build, limiting where they could run.

I built a shared image factory and led the migration of all 48 internal images in four days. The design gave each image its own manifest, build context, ownership, upstream version, and tests.

## Use a manifest as the build contract

Adding an image means adding a directory and a configuration file. The factory discovers the component, validates it, and plans the affected builds. Architectures build in parallel, and unrelated images do not need to rebuild for every change.

This example packages a patched third-party tool. Internal identifiers are anonymized; the manifest retains ownership, architecture targets, upstream tracking, release tags, and test stages:

```yaml title="images/cloudwatch-exporter/image.yaml"
apiVersion: images.example.io/v1alpha1
kind: Image
metadata:
  name: cloudwatch-exporter
  owners: [platform-team]
  # A maintained patch of a third-party image.
  category: patched
spec:
  repository: maintained/cloudwatch-exporter
  defaults:
    platforms: [linux/amd64, linux/arm64]
  variants:
    - name: default
      build:
        context: .
        dockerfile: Dockerfile
        args:
          upstream_version:
            from: spec.upstream.version
      tags:
        primary: "2.0.0"
        aliases: [latest]
      tests:
        # The test stage must pass before publishing.
        buildTargets: [test]
  # Renovate watches this version for upstream releases.
  upstream:
    datasource: docker
    image: docker.io/prom/cloudwatch-exporter
    version: "v0.18.0"
```

The primary version identifies our image release, while `upstream.version` identifies the third-party version it packages. A change to our `Dockerfile` can require a new primary version even when the upstream version stays the same.

Pull requests validate, build, and run the declared test stages without publishing. The release workflow publishes after merge. Renovate reads upstream versions from the manifest and proposes updates; publishing changed content also requires a new primary version.

## Treat publishing as a separate correctness problem

A successful build is insufficient evidence that a registry now contains the intended release. The publisher verifies each architecture's digest, assembles the multi-platform index, and checks that the published result matches the plan.

<figure class="concept-diagram" data-concept-diagram>
<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — IMAGE PROVENANCE · MANIFEST TO VERIFIED PUBLISH</div>
  <svg aria-label="Container image pipeline from a declarative manifest through parallel architecture builds, tests, immutable publishing and digest verification" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 500" role="img">
  <defs>
    <marker id="imageArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"/>
    </marker>
    <marker id="imageArrowAccent" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="var(--color-accent)"/>
    </marker>
  </defs>
  <text x="360" y="27" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.15em" fill="var(--color-text-subtle)">DECLARATION → TESTED ARTIFACT → VERIFIED RELEASE</text>
  <rect x="28" y="76" width="180" height="100" rx="7" fill="var(--color-surface)" stroke="var(--color-accent)"/>
  <text x="48" y="101" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--color-accent)">01 · DECLARE</text>
  <text x="48" y="128" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--color-text)">Image manifest</text>
  <text x="48" y="151" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--color-text-subtle)">owner · upstream · tests</text>
  <path d="M208 126 H262" stroke="var(--color-border)" marker-end="url(#imageArrow)"/>
  <rect x="270" y="62" width="180" height="128" rx="7" fill="var(--color-surface)" stroke="var(--color-accent)"/>
  <text x="290" y="87" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--color-accent)">02 · BUILD</text>
  <text x="290" y="114" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--color-text)">Parallel targets</text>
  <rect x="290" y="132" width="140" height="21" rx="3" fill="var(--color-surface)" stroke="var(--color-border)"/>
  <text x="360" y="147" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--color-text-subtle)">linux / amd64</text>
  <rect x="290" y="159" width="140" height="21" rx="3" fill="var(--color-surface)" stroke="var(--color-border)"/>
  <text x="360" y="174" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--color-text-subtle)">linux / arm64</text>
  <path d="M450 126 H504" stroke="var(--color-border)" marker-end="url(#imageArrow)"/>
  <rect x="512" y="76" width="180" height="100" rx="7" fill="var(--color-surface)" stroke="var(--color-accent)"/>
  <text x="532" y="101" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--color-accent)">03 · TEST</text>
  <text x="532" y="128" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--color-text)">Build + package</text>
  <text x="532" y="151" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--color-text-subtle)">both platforms must pass</text>
  <path d="M602 176 V252" stroke="var(--color-border)" marker-end="url(#imageArrow)"/>
  <rect x="512" y="260" width="180" height="100" rx="7" fill="var(--color-surface)" stroke="var(--color-accent)"/>
  <text x="532" y="285" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--color-accent)">04 · PUBLISH</text>
  <text x="532" y="312" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--color-text)">Immutable version</text>
  <text x="532" y="335" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--color-text-subtle)">write once to registry</text>
  <path d="M512 310 H458" stroke="var(--color-border)" marker-end="url(#imageArrow)"/>
  <rect x="270" y="260" width="180" height="100" rx="7" fill="var(--color-surface)" stroke="var(--color-accent)"/>
  <text x="290" y="285" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--color-accent)">05 · VERIFY</text>
  <text x="290" y="312" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--color-text)">Registry read-back</text>
  <text x="290" y="335" font-family="IBM Plex Mono, monospace" font-size="9.5" fill="var(--color-text-subtle)">published = tested digest</text>
  <path d="M270 310 H216" stroke="var(--color-accent)" marker-end="url(#imageArrowAccent)"/>
  <rect x="28" y="260" width="180" height="100" rx="7" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="2"/>
  <text x="48" y="285" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--color-accent)">ACCEPTED</text>
  <text x="48" y="312" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--color-text)">Verified release</text>
  <text x="48" y="335" font-family="IBM Plex Mono, monospace" font-size="9.5" fill="var(--color-text-subtle)">trusted name · known bytes</text>
  <rect x="270" y="404" width="180" height="72" rx="7" fill="var(--color-surface)" stroke="var(--color-border)"/>
  <text x="290" y="429" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--color-accent)">UPSTREAM UPDATE</text>
  <text x="290" y="454" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--color-text-subtle)">bot changes the manifest</text>
  <path d="M270 440 H12 V126 H20" stroke="var(--color-accent)" fill="none" marker-end="url(#imageArrowAccent)"/>
  <rect x="492" y="404" width="200" height="72" rx="7" fill="var(--color-surface)" stroke="var(--color-border)" stroke-dasharray="4 4"/>
  <text x="512" y="427" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.08em" fill="var(--color-text-subtle)">RESTART SEMANTICS</text>
  <text x="512" y="448" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--color-text-subtle)">build failure → new run</text>
  <text x="512" y="466" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--color-text-subtle)">publish retry → reuse digests</text>
</svg>

</div>
<figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — The release is accepted only when the registry digest matches the artifact that passed both architecture builds and their tests.</figcaption>
</figure>

The failure policy distinguishes recoverable interruptions from conflicting content:

| Condition | Publisher behavior |
| --- | --- |
| Version already points to the same digest | Continue without replacing it |
| Version exists with a different digest | Stop; never overwrite the release |
| Index assembly fails transiently | Retry publication using existing verified artifacts |
| An alias update fails | Retry the alias step; retain the verified version |
| An architecture build fails | Require a new build run before release |


Version tags are immutable. Convenience aliases such as `latest` can move, but only to the verified release. Digest artifacts also carry plan and run identity, allowing the publisher to reject artifacts that belong to a different build plan.

## Make migration repeatable for other engineers

I documented the conversion from the old builds into a playbook. Teammates could migrate components independently, which made the four-day rollout possible. The factory entered production in under a month and produced 35 releases in its first 20 days.

The implementation built on existing runners, dependency updates, review checks, and release automation. That foundation let this project concentrate on the image contract and publishing behavior.

## What changed

Images gained consistent ownership, versioning, tests, and a traceable release path. Upstream patching could flow through automated pull requests, and ARM builds made those images usable on ARM compute. The migration also removed the need to understand a shared build script before adding or maintaining one image.
