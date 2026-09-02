---
title: Buttons instead of incantations
summary: Pull-request commands became one-click actions without adding tokens, a server, or a new identity.
topics:
  - developer experience
featured: false
spotlight: false
---

## The situation

Atlantis is driven by typed pull request comments: <span class="inline-code-unit"><code>atlantis plan</code>,</span> <span class="inline-code-unit"><code>atlantis apply</code>,</span> with project flags that must be exactly right. Power users type them from muscle memory; everyone else copies them from somewhere, gets a flag wrong, and waits for the bot to complain. During large migrations — dozens of pull requests a day — the typing itself became measurable friction.
The obvious fixes were all worse: a web service with GitHub tokens to manage, or yet another bot with write access.

## What I did

I built a small browser extension that injects the commands as buttons directly into the GitHub pull request page.

<figure class="media-exhibit" data-exhibit style="--media-exhibit-width: 840px">
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename" title="atlantis-pr-buttons.png">atlantis-pr-buttons.png</span>
      <span class="exhibit-badge">PNG</span>
    </div>
    <div class="media-exhibit-stage"><img src="/case-studies/buttons-instead-of-incantations/atlantis-pr-buttons.png" alt="Screenshot: Atlantis Plan, Approve and Apply buttons injected above the GitHub pull request comment box" width="1654" height="676" loading="lazy" decoding="async"></div>
  </div>
  <figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — Atlantis controls inside the GitHub pull request comment box</figcaption>
</figure>

One click writes and submits the comment — *as the logged-in user*, through the same comment box they would have typed into. That one design decision is the whole security story: there are no tokens, no server, no new identity, and nothing new to secure — GitHub sees an ordinary comment from an ordinary user with their ordinary permissions.
The extension only activates on the right repositories, checks team membership before showing itself, and the dangerous button is two-stage: `apply` must be armed before it fires, so nobody fat-fingers an apply while scrolling.

## What it changed

Infrastructure pull request interactions became one-click and typo-free while preserving the logged-in user's existing permissions and audit trail.

Here it is in action:

<figure class="media-exhibit" data-exhibit style="--media-exhibit-width: 840px">
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename" title="atlantis-pr-buttons-demo.mp4">atlantis-pr-buttons-demo.mp4</span>
      <span class="exhibit-badge">MP4 · VIDEO</span>
    </div>
    <div class="media-exhibit-stage"><video src="/case-studies/buttons-instead-of-incantations/atlantis-pr-buttons-demo.mp4" poster="/case-studies/buttons-instead-of-incantations/atlantis-pr-buttons-demo-poster.png" width="880" height="588" controls playsinline preload="metadata" aria-label="Screen recording: Atlantis plan and apply buttons injected into a GitHub pull request"></video></div>
  </div>
  <figcaption class="exhibit-caption"><span>EXHIBIT 02</span> — The one-click plan and apply flow in action</figcaption>
</figure>
