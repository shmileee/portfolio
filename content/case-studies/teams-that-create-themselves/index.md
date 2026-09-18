---
title: Teams that create themselves
summary: One JSON file in one folder provisions a team's GitHub team, Slack channels, on-call schedule, catalog entry and alert routing through a reviewed pull request.
role: Designed the team definition and built the automation that turns it into every connected system.
evidence: About 30 team stacks are provisioned this way; a new team's alerts reach its own channel from day one without a platform engineer involved.
topics:
  - devex
  - delivery
order: 6
aliases:
  - 06-teams-that-create-themselves
  - self-service-teams
featured: false
spotlight: false
---

## The situation

Setting up a new engineering team was a pile of tickets: a GitHub team here, a Slack channel there, an on-call rotation, a service-catalog entry, alert routing. Each was owned by a different administrator and each was done slightly differently.

## What I did

I made "team" a piece of infrastructure. A developer creates one folder with one small JSON file describing the team, and a Terraform stack in that folder generates everything else: the GitHub teams, synced to our identity provider; the Slack channels; the on-call schedule; the service-catalog entry; and the team's alert channels, with the alerting system already invited.

```json title="teams/payments/team.json"
{
  "team_name_readable": "Team Payments",
  "portfolio": "Commerce",
  "github": {
    "teams": [
      { "type": "default", "description": "Payments engineers" },
      { "type": "frontend", "description": "Payments web client" }
    ]
  },
  "slack": {
    "channel": "team-payments",
    "topic": "Payments services: questions, on-call and alerts"
  },
  "alerts": {
    "create_am_config": true,
    "create_slack_channels": true
  },
  "firehydrant": {
    "team_oncall_enabled": true,
    "schedules": [
      {
        "timezone": "Europe/Copenhagen",
        "daily_start_time": "09:00:00",
        "daily_end_time": "15:00:00"
      },
      {
        "timezone": "America/Toronto",
        "daily_start_time": "10:00:00",
        "daily_end_time": "16:00:00"
      }
    ]
  }
}
```

The `alerts` block is the part that used to need a platform engineer: `create_am_config` generates the Alertmanager routing for the team's services, and `create_slack_channels` creates the channels those alerts go to. The two schedules are one on-call rotation covering both offices.

The generator itself is described in [a note on the blog](/blog/posts/generating-terraform-for-teams-from-one-json-file/). The `firehydrant` block drives the on-call schedules through FireHydrant's Terraform provider, which broke at this scale and became [its own story](/case-studies/the-fork-that-needed-a-home/).

## The interesting part

Monitoring alerts for a team's services land in that team's channel from the day the pull request merges. Nothing routes through a shared channel first, and nobody on the platform team touches an alerting configuration for a new team.

## What it changed

Team setup went from a multi-ticket, multi-day chore to a self-service pull request that engineers outside the platform team open themselves, with one directory as the reviewed definition for every connected system.
