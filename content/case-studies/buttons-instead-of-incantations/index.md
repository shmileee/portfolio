---
title: Buttons instead of incantations
summary: A browser extension turns the Atlantis pull request commands into buttons that post as the logged-in user, so there are no tokens, no server and no new identity to secure.
role: Designed and built the extension, including its team check and the two-stage apply.
evidence: One click writes the same comment the user would have typed; GitHub sees an ordinary comment with the user's ordinary permissions.
topics:
  - devex
order: 3
aliases:
  - 03-buttons-instead-of-incantations
  - self-service-buttons
featured: false
spotlight: false
---

## The situation

Atlantis is driven by typed pull request comments, `atlantis plan` and `atlantis apply`, with project flags that have to be exactly right. Power users type them from memory; everyone else copies them from somewhere, gets a flag wrong, and waits for the bot to complain. During large migrations, with dozens of pull requests a day, the typing itself was measurable friction.

The obvious fixes were worse than the problem: a web service with GitHub tokens to manage, or one more bot with write access.

## What I did

I built a small browser extension that adds the commands as buttons on the GitHub pull request page.

<figure class="media-exhibit wide" data-exhibit>
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename" title="atlantis-pr-buttons.png">atlantis-pr-buttons.png</span>
      <span class="exhibit-badge">PNG</span>
    </div>
    <div class="media-exhibit-stage"><img src="/case-studies/buttons-instead-of-incantations/atlantis-pr-buttons.png" alt="An Atlantis toolbar above the GitHub comment box with Plan, Approve and a two-stage Apply button" width="1654" height="676" loading="lazy" decoding="async"></div>
  </div>
  <figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — Atlantis controls above the GitHub pull request comment box</figcaption>
</figure>

One click writes and submits the comment as the logged-in user, through the same comment box they would have typed into. That decision is the whole security story: no tokens, no server, no new identity, nothing new to secure. GitHub sees an ordinary comment from an ordinary user with their ordinary permissions. The Approve button sits beside Plan for the same reason: the [audited override](/case-studies/approve-the-audited-escape-hatch/) is a comment too, and it keeps its audit trail.

The extension activates only on the right repositories, checks team membership before it shows itself, and the dangerous button is two-stage: `apply` has to be armed before it fires, so nobody applies by accident while scrolling.

<figure class="media-exhibit wide" data-exhibit>
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename" title="atlantis-pr-buttons-demo.mp4">atlantis-pr-buttons-demo.mp4</span>
      <span class="exhibit-badge">MP4 · VIDEO</span>
    </div>
    <div class="media-exhibit-stage"><video src="/case-studies/buttons-instead-of-incantations/atlantis-pr-buttons-demo.mp4" poster="/case-studies/buttons-instead-of-incantations/atlantis-pr-buttons-demo-poster.png" width="880" height="588" controls playsinline preload="metadata" aria-label="Screen recording: planning and applying an Atlantis pull request with the injected buttons"></video></div>
  </div>
  <figcaption class="exhibit-caption"><span>EXHIBIT 02</span> — Plan and apply, one click each</figcaption>
</figure>

## What it changed

Infrastructure pull request interactions became one click and typo-free, with the user's existing permissions and audit trail untouched.
