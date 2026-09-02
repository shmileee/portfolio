---
title: Turning container images from a liability into a supply chain
summary: A missing image is an inconvenience; a wrong image is a disaster.
role: Designed and built the image factory, then turned the migration into a playbook teammates could run.
evidence: "48 images migrated in four days; 35 releases in 20 days; 864 tests protected the publishing contract."
topics:
  - security
  - cost
  - delivery
featured: true
spotlight: false
---

## The situation

We ran on dozens of internally-maintained container images — patched third-party tools, custom bases, CI runners. Each built its own way.

I'd seen this exact problem at every scale of company: internal images accumulate, and they end up managed either by a docker bake file or a pile of bash scripts. It never holds. Either every change rebuilds everything in sequence, or the scripts grow so entangled that adding one image means understanding all of them.

Meanwhile, when a vulnerability landed, patching meant hunting through repositories by hand; nobody could say with confidence where a given image came from; and the cheaper ARM-based cloud servers were off-limits because almost nothing was built for them.

## What I did

I built an internal "image factory": every image is described by one small config file, and the factory does the rest — builds it for both processor architectures, tests it, publishes it, and then independently checks that what landed in the registry is exactly what was built. The whole contract fits on one screen:

```yaml title="images/cloudwatch-exporter/image.yaml"
apiVersion: images.example.io/v1alpha1
kind: Image
metadata:
  name: cloudwatch-exporter
  owners: [team-sre]
  category: patched            # a patched third-party image (vs. fully internal)
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
        buildTargets: [test]   # test stage must pass before publish
  upstream:                    # what the update bot watches for new versions
    datasource: docker
    image: docker.io/prom/cloudwatch-exporter
    version: "v0.18.0"
```

Because each image is a self-contained folder with a manifest, the factory discovers them independently: only changed images rebuild, builds run in parallel per architecture, and adding a new image means adding a folder — not editing a script. The upstream block closes the security loop: the dependency bot watches it and opens the version bump; the factory rebuilds and republishes. I migrated the entire fleet of internal images onto this using a playbook repeatable enough that teammates ran migrations without me.

<figure class="concept-diagram" data-concept-diagram>
<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — IMAGE PROVENANCE · MANIFEST TO VERIFIED PUBLISH</div>
  <svg aria-label="Container image pipeline from a declarative manifest through parallel architecture builds, tests, immutable publishing and digest verification" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 500" role="img">
  <defs>
    <marker id="imageArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="var(--w5, #aab4c3)"/>
    </marker>
    <marker id="imageArrowAccent" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="var(--ab4, #60a5fa)"/>
    </marker>
  </defs>
  <text x="360" y="27" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.15em" fill="var(--w45, #aab4c3)">DECLARATION → TESTED ARTIFACT → VERIFIED RELEASE</text>
  <rect x="28" y="76" width="180" height="100" rx="7" fill="var(--bg, #0b1220)" stroke="var(--ab4, #60a5fa)"/>
  <text x="48" y="101" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--ab4, #60a5fa)">01 · DECLARE</text>
  <text x="48" y="128" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--w88, #fff)">Image manifest</text>
  <text x="48" y="151" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--w45, #aab4c3)">owner · upstream · tests</text>
  <path d="M208 126 H262" stroke="var(--w42, #aab4c3)" marker-end="url(#imageArrow)"/>
  <rect x="270" y="62" width="180" height="128" rx="7" fill="var(--bg, #0b1220)" stroke="var(--ab4, #60a5fa)"/>
  <text x="290" y="87" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--ab4, #60a5fa)">02 · BUILD</text>
  <text x="290" y="114" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--w88, #fff)">Parallel targets</text>
  <rect x="290" y="132" width="140" height="21" rx="3" fill="var(--bg, #0b1220)" stroke="var(--w42, #aab4c3)"/>
  <text x="360" y="147" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--w45, #aab4c3)">linux / amd64</text>
  <rect x="290" y="159" width="140" height="21" rx="3" fill="var(--bg, #0b1220)" stroke="var(--w42, #aab4c3)"/>
  <text x="360" y="174" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--w45, #aab4c3)">linux / arm64</text>
  <path d="M450 126 H504" stroke="var(--w42, #aab4c3)" marker-end="url(#imageArrow)"/>
  <rect x="512" y="76" width="180" height="100" rx="7" fill="var(--bg, #0b1220)" stroke="var(--ab4, #60a5fa)"/>
  <text x="532" y="101" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--ab4, #60a5fa)">03 · TEST</text>
  <text x="532" y="128" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--w88, #fff)">Build + package</text>
  <text x="532" y="151" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--w45, #aab4c3)">both platforms must pass</text>
  <path d="M602 176 V252" stroke="var(--w42, #aab4c3)" marker-end="url(#imageArrow)"/>
  <rect x="512" y="260" width="180" height="100" rx="7" fill="var(--bg, #0b1220)" stroke="var(--ab4, #60a5fa)"/>
  <text x="532" y="285" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--ab4, #60a5fa)">04 · PUBLISH</text>
  <text x="532" y="312" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--w88, #fff)">Immutable version</text>
  <text x="532" y="335" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--w45, #aab4c3)">write once to registry</text>
  <path d="M512 310 H458" stroke="var(--w42, #aab4c3)" marker-end="url(#imageArrow)"/>
  <rect x="270" y="260" width="180" height="100" rx="7" fill="var(--bg, #0b1220)" stroke="var(--ab4, #60a5fa)"/>
  <text x="290" y="285" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--ab4, #60a5fa)">05 · VERIFY</text>
  <text x="290" y="312" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--w88, #fff)">Registry read-back</text>
  <text x="290" y="335" font-family="IBM Plex Mono, monospace" font-size="9.5" fill="var(--w45, #aab4c3)">published = tested digest</text>
  <path d="M270 310 H216" stroke="var(--ab4, #60a5fa)" marker-end="url(#imageArrowAccent)"/>
  <rect x="28" y="260" width="180" height="100" rx="7" fill="var(--bg, #0b1220)" stroke="var(--ab4, #60a5fa)" stroke-width="2"/>
  <text x="48" y="285" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--ab4, #60a5fa)">ACCEPTED</text>
  <text x="48" y="312" font-family="IBM Plex Mono, monospace" font-size="14" fill="var(--w88, #fff)">Verified release</text>
  <text x="48" y="335" font-family="IBM Plex Mono, monospace" font-size="9.5" fill="var(--w45, #aab4c3)">trusted name · known bytes</text>
  <rect x="270" y="404" width="180" height="72" rx="7" fill="var(--bg, #0b1220)" stroke="var(--w42, #aab4c3)"/>
  <text x="290" y="429" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.1em" fill="var(--ab4, #60a5fa)">UPSTREAM UPDATE</text>
  <text x="290" y="454" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--w45, #aab4c3)">bot changes the manifest</text>
  <path d="M270 440 H12 V126 H20" stroke="var(--ab4, #60a5fa)" fill="none" marker-end="url(#imageArrowAccent)"/>
  <rect x="492" y="404" width="200" height="72" rx="7" fill="var(--bg, #0b1220)" stroke="var(--w42, #aab4c3)" stroke-dasharray="4 4"/>
  <text x="512" y="427" font-family="IBM Plex Mono, monospace" font-size="11" letter-spacing="0.08em" fill="var(--w45, #aab4c3)">RESTART SEMANTICS</text>
  <text x="512" y="448" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--w45, #aab4c3)">build failure → new run</text>
  <text x="512" y="466" font-family="IBM Plex Mono, monospace" font-size="10" fill="var(--w45, #aab4c3)">publish retry → reuse digests</text>
</svg>

</div>
<figcaption class="exhibit-caption"><span>EXHIBIT</span> — The release is accepted only when the registry digest matches the artifact that passed both architecture builds and their tests.</figcaption>
</figure>

> The scariest failure in image publishing isn't a build that breaks — it's a wrong image quietly landing under a trusted name.

So the publisher is deliberately paranoid: published versions can never be overwritten, and every upload is read back and compared against what was actually built. A transient failure during publishing can restart from the planned state and reuse existing digest artifacts without rebuilding; a failed platform build requires a new workflow run. The principle: a missing image is an inconvenience; a wrong image is a disaster — every design choice guards against the disaster.

## The interesting part

The factory got boring in the best way: images became data, not scripts; ARM became a default instead of a special project; and the update bot became the front door to the whole supply chain.

## What it changed

Security patching became a routine automated flow. "Where did this image come from?" stopped being a research project. ARM support by default opened the door to meaningfully cheaper compute. Built from zero to production in under a month — possible only because pull request automation, releases, runners, and hooks already existed.
