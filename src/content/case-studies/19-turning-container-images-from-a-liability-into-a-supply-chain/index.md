---
number: 19
slug: turning-container-images-from-a-liability-into-a-supply-chain
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

## THE SITUATION

We ran on dozens of internally-maintained container images — patched third-party tools, custom bases, CI runners. Each built its own way.

I'd seen this exact problem at every scale of company: internal images accumulate, and they end up managed either by a docker bake file or a pile of bash scripts. It never holds. Either every change rebuilds everything in sequence, or the scripts grow so entangled that adding one image means understanding all of them.

Meanwhile, when a vulnerability landed, patching meant hunting through repositories by hand; nobody could say with confidence where a given image came from; and the cheaper ARM-based cloud servers were off-limits because almost nothing was built for them.

## WHAT I DID

I built an internal "image factory": every image is described by one small config file, and the factory does the rest — builds it for both processor architectures, tests it, publishes it, and then independently checks that what landed in the registry is exactly what was built. The whole contract fits on one screen:

```yaml filename="images/cloudwatch-exporter/image.yaml"
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
{% diagram "./verified-image-pipeline.svg", "EXHIBIT — IMAGE PROVENANCE · MANIFEST TO VERIFIED PUBLISH", "Container image pipeline from a declarative manifest through parallel architecture builds, tests, immutable publishing and digest verification" %}
<figcaption class="exhibit-caption"><span>EXHIBIT</span> — The release is accepted only when the registry digest matches the artifact that passed both architecture builds and their tests.</figcaption>
</figure>

> The scariest failure in image publishing isn't a build that breaks — it's a wrong image quietly landing under a trusted name.

So the publisher is deliberately paranoid: published versions can never be overwritten, and every upload is read back and compared against what was actually built. A transient failure during publishing can restart from the planned state and reuse existing digest artifacts without rebuilding; a failed platform build requires a new workflow run. The principle: a missing image is an inconvenience; a wrong image is a disaster — every design choice guards against the disaster.

## THE INTERESTING PART

The factory got boring in the best way: images became data, not scripts; ARM became a default instead of a special project; and the update bot became the front door to the whole supply chain.

## WHAT IT CHANGED

Security patching became a routine automated flow. "Where did this image come from?" stopped being a research project. ARM support by default opened the door to meaningfully cheaper compute. Built from zero to production in under a month — possible only because pull request automation, releases, runners, and hooks already existed.
