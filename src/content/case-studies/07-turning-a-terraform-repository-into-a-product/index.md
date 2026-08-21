---
number: 7
slug: turning-a-terraform-repository-into-a-product
title: Turning a Terraform repository into a product
summary: Terraform stopped being a specialist skill.
topics:
  - developer experience
  - delivery
featured: false
spotlight: false
---

## THE SITUATION

The central Terraform repository was where all cloud infrastructure lived — and it showed its age. Shared modules were "versioned" with hand-made git tags in no consistent format: random suffixes, a mix of underscores and hyphens, no changelogs. The Terraform state itself was committed into the git repository. There was no release process, no consistent style, and no place to learn how to do things right.

## WHAT I DID

I treated the repository as a product with users. I moved the state out of git and into S3 backends — every stack, in one focused campaign.
I replaced hand-made tags with a real release pipeline: structured commit messages produce versioned, changelogged module releases automatically. I standardized the code itself — formatters and linters enforced automatically, guidelines and best practices written down, documentation curated and rewritten (including recorded terminal walkthroughs, so people could watch the workflow, not just read about it).
I introduced Terramate to manage the growing estate of stacks, designed the repository layout and the reusable imports, then migrated every legacy stack onto it. I stood up an internal Terraform registry to host our own providers ([case study 18](/case-studies/18-the-fork-that-needed-a-home/)).
And when navigation itself became the problem — hundreds of stacks across many accounts and regions — I built a terminal tool that answers "where is X deployed, and in which account?" in seconds:

{% mediaExhibit { source: "./terramate-stacks-explorer.mp4", poster: "./terramate-stacks-explorer-poster.png", alt: "Terminal recording: the terramate stacks explorer browsing stacks, with filters for group, environment and region", width: 1440, height: 820, filename: "terramate-stacks-explorer.mp4", badge: "MP4 · VIDEO", maxWidth: 840, captionLabel: "EXHIBIT 01", caption: "Where is X deployed, and in which account? Answered in seconds" } %}

Alongside the tooling I started the company's Terraform community channel, answered beginner questions, and taught people their first steps.

## THE INTERESTING PART

The teaching mattered as much as the tooling. Standards that arrive as documentation get ignored; standards that arrive with a helpful human, worked examples, and automation that silently fixes your formatting get adopted.

## WHAT IT CHANGED

Terraform stopped being a specialist skill. Engineers across teams now propose infrastructure changes routinely, modules are versioned and reusable, and the repository scaled from dozens of stacks to hundreds without becoming unmanageable.
