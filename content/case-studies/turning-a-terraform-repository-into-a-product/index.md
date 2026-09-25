---
title: Turning a Terraform repository into a product
summary: "The shared Terraform repository grew from dozens of stacks to hundreds with remote state, automated module releases, consistent structure, and an inventory engineers could navigate."
role: "Led the repository improvements, designed the Terramate layout and release workflow, built the stack explorer, and supported adoption through a Terraform community channel."
evidence: "Migrated every stack to remote state; introduced versioned module releases and a terminal inventory spanning accounts, regions, and environments."
topics:
  - devex
  - delivery
order: 5
aliases:
  - 07-turning-a-terraform-repository-into-a-product
  - terraform-product
featured: false
spotlight: false
---

## Make a shared repository usable across teams

The central Terraform repository held the company's cloud infrastructure, but lacked the conventions needed to support a growing group of contributors. State files were committed to Git. Module tags used inconsistent names and had no changelogs. Finding the right stack or learning the release process depended on asking someone who already knew the repository.

I approached the work as a series of improvements to a shared product: state management first, then releases, structure, navigation, and support for the people using it.

## Establish a predictable state and release model

I moved every stack's state into S3 backends in one migration campaign. That separated Terraform's resource state from the source code engineers reviewed.

Next I replaced manual module tags with automated releases. Structured commit messages determine the version change and produce a changelog. Each releasable component runs in an isolated release job, avoiding interference between releases in the monorepo. The resulting tags also gave [dependency automation](/case-studies/dependency-updates-from-quarterly-panic-to-background-noise/) stable versions to track.

Formatting, linting, and documentation generation became automated checks. I rewrote the contributor documentation and recorded terminal walkthroughs so engineers could see the workflow being used.

## Separate a stack's identity from its deployments

I introduced Terramate, designed the shared imports and [repository layout](/blog/posts/structuring-a-terraform-monorepo-with-terramate/), and migrated legacy stacks into it. A simplified path illustrates the structure:

```text title="stacks/"
stacks/
  aws/
    development/
      eu-west-1/
        service-platform/
    production/
      eu-west-1/
        service-platform/
```

Shared imports generate backend and provider configuration. The deployment directory carries the configuration that varies by account and region. The migration runbook preserves the old state object as a rollback reference and verifies the new configuration through Atlantis before applying it.

As the inventory reached hundreds of stacks, directory conventions alone were insufficient. I built a terminal explorer that groups stacks by identity and shows where each is deployed, with evaluated account, region, and environment settings. It also exposes recent Git history and table, JSON, and CSV output for scripting. Browsing the inventory does not require cloud credentials or elevated access.

<figure class="media-exhibit wide" data-exhibit>
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename" title="terramate-stacks-explorer.mp4">terramate-stacks-explorer.mp4</span>
      <span class="exhibit-badge">MP4 · VIDEO</span>
    </div>
    <div class="media-exhibit-stage"><video src="/case-studies/turning-a-terraform-repository-into-a-product/terramate-stacks-explorer.mp4" poster="/case-studies/turning-a-terraform-repository-into-a-product/terramate-stacks-explorer-poster.webp" width="1400" height="800" controls playsinline preload="metadata" aria-label="Terminal recording: the stacks explorer lists twelve stacks; selecting one shows its four deployments grouped by environment, then the inventory is filtered to production and fuzzy-searched for eks"></video></div>
  </div>
  <figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — Twelve stacks, 22 deployments: browse, filter to one environment, search, then act on the selection</figcaption>
</figure>

The recording uses a demonstration inventory. The [implementation notes](/blog/posts/building-an-interactive-tui-for-terramate-stacks/) explain how the explorer resolves stack metadata.

## Support adoption alongside the tooling

I started a Terraform community channel, answered beginner questions, and provided worked examples. That support made the conventions easier to adopt and gave me feedback about where the workflow remained confusing.

The [internal provider registry](/case-studies/the-fork-that-needed-a-home/) later added a common distribution point for custom and mirrored providers.

## What changed

The repository grew from dozens of stacks to hundreds while retaining one release process and a consistent way to discover deployments. Engineers across teams could propose infrastructure changes through the shared workflow, with reusable modules, documented conventions, and support available when the automation was not enough.
