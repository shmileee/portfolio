---
number: 3
slug: buttons-instead-of-incantations
title: Buttons instead of incantations
summary: The kind of small tool that costs a week and pays for itself every single day.
topics:
  - developer experience
featured: false
spotlight: false
---

## THE SITUATION

Atlantis is driven by typed pull-request comments: <span class="inline-code-unit"><code>atlantis plan</code>,</span> <span class="inline-code-unit"><code>atlantis apply</code>,</span> with project flags that must be exactly right. Power users type them from muscle memory; everyone else copies them from somewhere, gets a flag wrong, and waits for the bot to complain. During large migrations — dozens of pull requests a day — the typing itself became measurable friction.
The obvious fixes were all worse: a web service with GitHub tokens to manage, or yet another bot with write access.

## WHAT I DID

I built a small browser extension that injects the commands as buttons directly into the GitHub pull-request page.

{% mediaExhibit { source: "./atlantis-pr-buttons.png", alt: "Screenshot: Atlantis Plan, Approve and Apply buttons injected above the GitHub pull-request comment box", width: 1654, height: 676, maxWidth: 840, captionLabel: "EXHIBIT 01", caption: "Atlantis controls inside the GitHub pull-request comment box" } %}

One click writes and submits the comment — *as the logged-in user*, through the same comment box they would have typed into. That one design decision is the whole security story: there are no tokens, no server, no new identity, and nothing new to secure — GitHub sees an ordinary comment from an ordinary user with their ordinary permissions.
The extension only activates on the right repositories, checks team membership before showing itself, and the dangerous button is two-stage: `apply` must be armed before it fires, so nobody fat-fingers an apply while scrolling.

## WHAT IT CHANGED

Infrastructure pull-request interactions became one-click, typo-free, and slightly delightful — the kind of small tool that costs a week and pays for itself every single day.

Here it is in action:

{% mediaExhibit { source: "./atlantis-pr-buttons-demo.mp4", poster: "./atlantis-pr-buttons-demo-poster.png", alt: "Screen recording: Atlantis plan and apply buttons injected into a GitHub pull request", width: 880, height: 588, filename: "atlantis-pr-buttons-demo.mp4", badge: "MP4 · VIDEO", maxWidth: 840, captionLabel: "EXHIBIT 02", caption: "The one-click plan and apply flow in action" } %}
