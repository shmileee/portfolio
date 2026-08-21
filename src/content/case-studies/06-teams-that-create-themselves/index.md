---
number: 6
slug: teams-that-create-themselves
title: Teams that create themselves
summary: "Because teams are code, nothing drifts: the directory is the org chart."
topics:
  - developer experience
  - delivery
featured: false
spotlight: false
---

## THE SITUATION

Setting up a new engineering team was a pile of tickets: a GitHub team here, a Slack channel there, on-call rotation, service catalog entry, alert routing — each owned by a different admin, each done slightly differently.

## WHAT I DID

I made "team" a piece of infrastructure. A developer creates one folder with one small JSON file describing their team; automation generates everything else: the GitHub team (synced to our identity provider), the Slack channels, the on-call schedule, the service-catalog entry — and, crucially, the team's alert channels, with the alerting system already invited. Monitoring alerts for a team's services land in that team's channel from day one, with no platform-team involvement.

```json filename="team.json"
{
  "team_name_readable": "Team Full Example",
  "portfolio": "Global Developer Enablement",
  "github": {
    "teams": [
      { "type": "default",  "description": "example description" },
      { "type": "frontend", "description": "example description" }
    ]
  },
  "slack": {
    "channel": "team-example-very-awesome-channel",
    "topic": "Something insightful describing the purpose/usage of the channel"
  },
  "alerts": {
    "create_am_config": true,
    "create_slack_channels": true
  },
  "firehydrant": {
    "team_oncall_enabled": true,
    "schedules": [
      { "timezone": "Europe/Copenhagen", "daily_start_time": "09:00:00", "daily_end_time": "15:00:00" },
      { "timezone": "America/Toronto",   "daily_start_time": "10:00:00", "daily_end_time": "16:00:00" }
    ]
  }
}
```

## THE INTERESTING PART

The proof it worked: engineers outside our team now add their own teams without asking us. The request queue for "can you set up..." simply disappeared.

## WHAT IT CHANGED

Team setup went from a multi-ticket, multi-day chore to a self-service pull request — and because teams are code, nothing drifts: the directory is the org chart.
