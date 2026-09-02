---
title: Turning a Terraform repository into a product
summary: Release automation, reusable stacks, documentation, and teaching made the central Terraform repository usable across teams.
topics:
  - developer experience
  - delivery
featured: false
spotlight: false
---

## The situation

The central Terraform repository was where all cloud infrastructure lived — and it showed its age. Shared modules were "versioned" with hand-made git tags in no consistent format: random suffixes, a mix of underscores and hyphens, no changelogs. The Terraform state itself was committed into the git repository. There was no release process, no consistent style, and no place to learn how to do things right.

## What I did

I treated the repository as a product with users. I moved the state out of git and into S3 backends — every stack, in one focused campaign.
I replaced hand-made tags with a real release pipeline: structured commit messages produce versioned, changelogged module releases automatically. I standardized the code itself — formatters and linters enforced automatically, guidelines and best practices written down, documentation curated and rewritten (including recorded terminal walkthroughs, so people could watch the workflow, not just read about it).
I introduced Terramate to manage the growing estate of stacks, designed the repository layout and the reusable imports, then migrated every legacy stack onto it. I stood up an internal Terraform registry to host our own providers ([the fork that needed a home](/case-studies/the-fork-that-needed-a-home/)).
And when navigation itself became the problem — hundreds of stacks across many accounts and regions — I built a terminal tool that answers "where is X deployed, and in which account?" in seconds:

<figure class="media-exhibit" data-exhibit style="--media-exhibit-width: 840px">
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename" title="terramate-stacks-explorer.mp4">terramate-stacks-explorer.mp4</span>
      <span class="exhibit-badge">MP4 · VIDEO</span>
    </div>
    <div class="media-exhibit-stage"><video src="/case-studies/turning-a-terraform-repository-into-a-product/terramate-stacks-explorer.mp4" poster="/case-studies/turning-a-terraform-repository-into-a-product/terramate-stacks-explorer-poster.png" width="1440" height="820" controls playsinline preload="metadata" aria-label="Terminal recording: the terramate stacks explorer browsing stacks, with filters for group, environment and region"></video></div>
  </div>
  <figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — Where is X deployed, and in which account? Answered in seconds</figcaption>
</figure>

Alongside the tooling I started the company's Terraform community channel, answered beginner questions, and taught people their first steps.

## The interesting part

The teaching mattered as much as the tooling. Standards that arrive as documentation get ignored; standards that arrive with a helpful human, worked examples, and automation that silently fixes your formatting get adopted.

## What it changed

Engineers across teams now propose infrastructure changes through the shared workflow, modules are versioned and reusable, and the repository scaled from dozens of stacks to hundreds with consistent navigation and release controls.
