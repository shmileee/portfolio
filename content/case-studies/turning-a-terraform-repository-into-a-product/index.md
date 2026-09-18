---
title: Turning a Terraform repository into a product
summary: State out of git, versioned module releases from structured commits, a Terramate layout for hundreds of stacks, an internal registry and a terminal explorer made the central Terraform repository usable across teams.
role: Owned the repository as a product; designed the Terramate layout and the release pipeline, built the stacks explorer, and ran the Terraform community channel.
evidence: Every stack moved to remote state in one campaign; the repository grew from dozens of stacks to hundreds with one release process and one navigation tool.
topics:
  - devex
  - delivery
order: 7
aliases:
  - 07-turning-a-terraform-repository-into-a-product
  - terraform-product
featured: false
spotlight: false
---

## The situation

The central Terraform repository was where all cloud infrastructure lived, and it showed its age. Shared modules were "versioned" with hand-made git tags in no consistent format: random suffixes, a mix of underscores and hyphens, no changelogs. The Terraform state itself was committed into the repository. There was no release process, no consistent style, and no place to learn how to do things right.

## What I did

I treated the repository as a product with users, one change at a time.

I moved the state out of git and into S3 backends, every stack, in one focused campaign.

I replaced hand-made tags with a release pipeline: structured commit messages produce versioned, changelogged module releases automatically.

I standardised the code. Formatters and linters run automatically, guidelines and best practices are written down, and the documentation was curated and rewritten, including recorded terminal walkthroughs so people could watch the workflow rather than read about it.

I introduced Terramate to manage the growing estate of stacks, designed the [repository layout](/blog/posts/structuring-a-terraform-monorepo-with-terramate/) and the reusable imports, and migrated every legacy stack onto it.

I stood up an internal Terraform registry to host our own providers, which began with [the fork that needed a home](/case-studies/the-fork-that-needed-a-home/).

And when navigation itself became the problem, hundreds of stacks across many accounts and regions, I built [a terminal tool](/blog/posts/building-an-interactive-tui-for-terramate-stacks/) that answers "where is X deployed, and in which account?" in seconds:

<figure class="media-exhibit wide" data-exhibit>
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename" title="terramate-stacks-explorer.mp4">terramate-stacks-explorer.mp4</span>
      <span class="exhibit-badge">MP4 · VIDEO</span>
    </div>
    <div class="media-exhibit-stage"><video src="/case-studies/turning-a-terraform-repository-into-a-product/terramate-stacks-explorer.mp4" poster="/case-studies/turning-a-terraform-repository-into-a-product/terramate-stacks-explorer-poster.png" width="1440" height="820" controls playsinline preload="metadata" aria-label="Terminal recording: the stacks explorer browsing stacks, filtered by group, environment and region"></video></div>
  </div>
  <figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — The stacks explorer, filtered by group, environment and region</figcaption>
</figure>

Alongside the tooling I started the company's Terraform community channel, answered beginner questions, and taught people their first steps.

## The interesting part

The teaching mattered as much as the tooling. Standards that arrive as documentation get ignored; standards that arrive with a helpful human, worked examples, and automation that fixes the formatting for you get adopted.

## What it changed

Engineers across teams propose infrastructure changes through the shared workflow, modules are versioned and reusable, and the repository scaled from dozens of stacks to hundreds with consistent navigation and release controls.
