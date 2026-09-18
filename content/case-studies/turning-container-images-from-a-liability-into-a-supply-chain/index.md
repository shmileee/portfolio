---
title: Turning container images from a liability into a supply chain
summary: One manifest per image; the factory builds both architectures, tests, publishes once and reads the registry back to prove it holds exactly what was built.
role: Designed and built the image factory, then turned the migration into a playbook teammates could run.
evidence: "48 images migrated in four days; 35 releases in 20 days; 864 tests protected the publishing contract."
topics:
  - security
  - cost
  - delivery
order: 19
aliases:
  - 19-turning-container-images-from-a-liability-into-a-supply-chain
  - container-supply-chain
featured: true
spotlight: false
---

## The situation

We ran on dozens of internally maintained container images: patched third-party tools, custom bases, CI runners. Each was built its own way, and I had seen where that ends at every size of company. Internal images accumulate and end up managed either by one bake file or by a pile of shell scripts; either every change rebuilds everything in sequence, or the scripts grow so entangled that adding one image means understanding all of them.

When a vulnerability landed, patching meant hunting through repositories by hand. Nobody could say with confidence where a given image came from, and the cheaper ARM-based cloud servers were off limits because almost nothing was built for them.

## What I did

I built an internal image factory. Every image is described by one small configuration file, and the factory does the rest: builds it for both processor architectures, tests it, publishes it, and then independently checks that what landed in the registry is exactly what was built. The whole contract fits on one screen:

```yaml title="images/cloudwatch-exporter/image.yaml"
apiVersion: images.example.io/v1alpha1
kind: Image
metadata:
  name: cloudwatch-exporter
  owners: [team-sre]
  # a patched third-party image, as opposed to a fully internal one
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
          upstream_version: { from: spec.upstream.version }
      tags:
        primary: "2.0.0"
        aliases: [latest]
      tests:
        # the test stage must pass before publishing
        buildTargets: [test]
  # what the update bot watches for new versions
  upstream:
    datasource: docker
    image: docker.io/prom/cloudwatch-exporter
    version: "v0.18.0"
```

Because each image is a self-contained folder with a manifest, the factory discovers them independently: only changed images rebuild, builds run in parallel per architecture, and adding an image means adding a folder, not editing a script. The `upstream` block closes the security loop: the [dependency bot](/case-studies/dependency-updates-from-quarterly-panic-to-background-noise/) watches it and opens the version bump, and the factory rebuilds and republishes.

I migrated the entire fleet of internal images onto the factory, 48 of them in four days, with a playbook repeatable enough that teammates ran migrations without me. The first 20 days saw 35 releases.

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

## The interesting part

The scariest failure in image publishing is not a build that breaks. It is a wrong image landing under a trusted name. So the publisher is deliberately paranoid: published versions can never be overwritten, and every upload is read back and compared against what was actually built. A transient failure during publishing restarts from the planned state and reuses the existing digest artifacts without rebuilding; a failed platform build requires a new workflow run. The publishing contract is pinned down by 864 tests. The principle behind every one of those choices: a missing image is an inconvenience, a wrong image is a disaster.

## What it changed

Security patching became a routine automated flow. "Where did this image come from?" stopped being a research project. ARM support by default opened the door to meaningfully cheaper compute. The factory went from zero to production in under a month, which was possible only because pull-request automation, releases, runners and hooks already existed.
