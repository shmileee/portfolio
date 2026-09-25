---
title: Teams that create themselves
summary: "Engineering teams provision their collaboration tools, on-call schedules, and alert routing through a reviewed pull request backed by one team definition."
role: "Designed the team definition and built the Terraform and Terramate automation across the connected services."
evidence: "About 30 team stacks used the workflow; engineers outside the platform team could provision team resources and alert destinations themselves."
topics:
  - devex
  - delivery
order: 4
aliases:
  - 06-teams-that-create-themselves
  - self-service-teams
featured: false
spotlight: false
---

## Turn team setup into one reviewed change

Creating an engineering team required separate requests for GitHub membership, Slack channels, on-call schedules, a service-catalog entry, and alert routing. Different administrators handled each system, so setup took several days and produced inconsistent results.

I built a self-service workflow around one directory and one JSON definition per team. Terramate generates the Terraform configuration, and the existing plan-and-approval process provisions the requested resources.

## One engineering team can own several GitHub teams

The directory identifies the engineering team, and its configuration selects the integrations it needs. The GitHub teams are a list: one engineering team can have a default group and separate frontend and backend groups, each with its own membership and repository access.

This fictional team uses all three GitHub groups, a shared Slack channel, a service-catalog entry, alert channels, and on-call schedules in two time zones:

```json title="teams/payments/team.json"
{
  "team_name_readable": "Payments",
  "portfolio": "Commerce",
  "github": {
    "teams": [
      { "type": "default", "description": "All Payments engineers" },
      { "type": "frontend", "description": "Payments web client" },
      { "type": "backend", "description": "Payments APIs and workers" }
    ]
  },
  "slack": {
    "create": true,
    "channel": "team-payments",
    "topic": "Payments services: questions, on-call and alerts"
  },
  "opslevel": {
    "create": true
  },
  "alerts": {
    "create_slack_channels": true
  },
  "firehydrant": {
    "create": true,
    "team_oncall_enabled": true,
    "schedules": [
      {
        "timezone": "Europe/London",
        "daily_start_time": "09:00:00",
        "daily_end_time": "17:00:00"
      },
      {
        "timezone": "America/New_York",
        "daily_start_time": "09:00:00",
        "daily_end_time": "17:00:00"
      }
    ]
  }
}
```

<figure class="concept-diagram" data-concept-diagram>
<div class="diagram-exhibit" data-exhibit>
<div class="diagram-exhibit-label">ONE TEAM DEFINITION · SEVERAL CONNECTED SERVICES</div>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" role="img" aria-labelledby="team-provisioning-title team-provisioning-desc">
<title id="team-provisioning-title">Team Provisioning</title>
<desc id="team-provisioning-desc">One Payments engineering team defines team.json. Terramate generates Terraform, which is planned and applied after approval. The definition provisions three GitHub teams: default, frontend and backend. It also provisions a Slack channel, a service-catalog entry, two on-call schedules in London and New York, and alert destinations selected by owner, environment and urgency.</desc>
<defs>
<marker id="team-provisioning-accent" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="var(--color-accent)"/></marker>
<marker id="team-provisioning-muted" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="var(--color-text-subtle)"/></marker>
</defs>
<rect x="170" y="18" width="380" height="84" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="360.0" y="47" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-accent)">Payments</text>
<text x="360.0" y="71" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">One engineering team · team.json</text>
<path d="M360 102 V131" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#team-provisioning-accent)"/>
<rect x="170" y="138" width="380" height="84" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="360.0" y="167" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-accent)">Terramate → Terraform</text>
<text x="360.0" y="191" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Generate → plan → approved apply</text>
<path d="M360 222 V258 H138 V288" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#team-provisioning-accent)"/>
<path d="M360 258 H294 V654" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round"/>
<path d="M294 330 H319" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#team-provisioning-accent)"/>
<path d="M294 438 H319" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#team-provisioning-accent)"/>
<path d="M294 546 H319" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#team-provisioning-accent)"/>
<path d="M294 654 H319" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#team-provisioning-accent)"/>
<rect x="20" y="294" width="236" height="390" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="138" y="325" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="17" font-weight="500" fill="var(--color-accent)">GitHub teams</text>
<text x="138" y="348" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">Three groups, one owner</text>
<rect x="42" y="372" width="192" height="80" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="138.0" y="401" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">default</text>
<text x="138.0" y="425" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">All engineers</text>
<rect x="42" y="472" width="192" height="80" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="138.0" y="501" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">frontend</text>
<text x="138.0" y="525" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Web client</text>
<rect x="42" y="572" width="192" height="80" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="138.0" y="601" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">backend</text>
<text x="138.0" y="625" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">APIs and workers</text>
<rect x="326" y="294" width="374" height="78" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="513.0" y="323" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Slack</text>
<text x="513.0" y="347" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">#team-payments</text>
<rect x="326" y="402" width="374" height="78" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="513.0" y="431" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Service catalog</text>
<text x="513.0" y="455" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Payments ownership entry</text>
<rect x="326" y="510" width="374" height="90" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="513.0" y="539" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">On-call schedules</text>
<text x="513.0" y="563" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">London · 09:00–17:00</text>
<text x="513.0" y="583" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">New York · 09:00–17:00</text>
<rect x="326" y="618" width="374" height="78" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="513.0" y="647" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Alert destinations</text>
<text x="513.0" y="671" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Owner + environment + urgency</text>
</svg>
</div>
<figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — The Payments example creates three GitHub teams and two on-call schedules. The engineering team remains the common owner across the connected services.</figcaption>
</figure>

A schema documents the accepted attributes. The generated Terraform is separated by integration, so the plan exposes what will change in GitHub, Slack, the service catalog, and the on-call system. Identity-provider synchronization can manage membership for the GitHub groups. The two schedule entries let the engineering team define coverage across time zones within the same team definition.

## Include alert routing in the definition

Provisioning channels alone would still leave a manual handoff. I connected team setup to alert routing so alerts for the team's services reach its own destinations once the configuration is applied.

The routing contract uses a team owner label together with environment and urgency. Shared routing rules consume those labels, while the team module creates the schedules, escalation policies, and channels they resolve to. That keeps new teams from requiring another bespoke set of routing rules.

The [generator walkthrough](/blog/posts/generating-terraform-for-teams-from-one-json-file/) covers the configuration flow. As adoption grew, the FireHydrant provider's rate limiting and state behavior became a separate reliability problem, addressed in [the provider fork](/case-studies/the-fork-that-needed-a-home/).

## What changed

About 30 team stacks adopted the model. Engineers outside the platform team could request their own setup through a pull request, with a visible plan and a versioned definition of the connected resources. Alert routing became part of that setup instead of a follow-up ticket.
