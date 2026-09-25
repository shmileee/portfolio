---
title: The NAT bill and the fix that went upstream
summary: "NAT instances became the default egress path with managed-gateway fallback. I contributed the deployment changes needed to run the failover function without a container build."
role: "Adopted alterNAT, integrated it into the cell platform, and contributed Zip packaging and dependency removal upstream."
evidence: "Two merged upstream pull requests; the production configuration uses the Zip deployment path and checks connectivity every minute."
topics:
  - cost
  - networking
order: 11
aliases:
  - the-nat-bill-and-the-open-source-fix-i-helped-ship
  - 15-the-nat-bill-and-the-open-source-fix-i-helped-ship
  - nat-cost
featured: false
spotlight: false
---

## Change the cost structure while retaining fallback

Our outbound traffic passed through managed NAT gateways, whose processing charges grew with traffic volume. I adopted alterNAT to move the normal path onto EC2 NAT instances while retaining managed gateways as fallback.

This removes the managed gateway's per-gigabyte processing charge from traffic that stays on the instance path. EC2, standby gateways, and other applicable network charges remain part of the cost. The trade-off is operating NAT instances and their health checks in exchange for a different cost structure.

## Make the failure path part of the design

alterNAT checks connectivity every minute. Failed checks or an instance termination trigger a route change to the managed gateway. A replacement instance restores the instance route during startup. Upstream also supports health-based restoration of a recovered instance through a separate opt-in setting.

<figure class="concept-diagram" data-concept-diagram>
<div class="diagram-exhibit" data-exhibit>
<div class="diagram-exhibit-label">ALTERNAT · NORMAL ROUTE AND MANAGED FALLBACK</div>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 692" role="img" aria-labelledby="alternat-routing-title alternat-routing-desc">
<title id="alternat-routing-title">Alternat Routing</title>
<desc id="alternat-routing-desc">Simplified alterNAT routing for one availability zone. A private workload uses a default route through an EC2 NAT instance and its Elastic IP. If a connectivity check fails or the instance is replaced, Lambda changes the route to a standby managed NAT gateway with a different Elastic IP. Both paths reach the internet through the VPC internet gateway. A replacement instance restores the instance route when it boots.</desc>
<defs>
<marker id="alternat-routing-accent" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="var(--color-accent)"/></marker>
<marker id="alternat-routing-muted" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="var(--color-text-subtle)"/></marker>
</defs>
<text x="360" y="20" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">ONE AVAILABILITY ZONE · TWO POSSIBLE EGRESS PATHS</text>
<rect x="244" y="42" width="232" height="68" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="360.0" y="71" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Private workloads</text>
<text x="360.0" y="95" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Outbound traffic</text>
<path d="M360 110 V139" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#alternat-routing-accent)"/>
<rect x="244" y="146" width="232" height="70" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="360.0" y="175" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-accent)">Private route table</text>
<text x="360.0" y="199" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">0.0.0.0/0</text>
<path d="M360 216 V238 H176 V281" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#alternat-routing-accent)"/>
<path d="M360 238 H544 V281" fill="none" stroke="var(--color-text-subtle)" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="5 5" marker-end="url(#alternat-routing-muted)"/>
<text x="112" y="269" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-accent)">NORMAL PATH</text>
<text x="626" y="269" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-subtle)">FALLBACK PATH</text>
<rect x="32" y="288" width="288" height="102" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="176.0" y="317" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-accent)">EC2 NAT instance</text>
<text x="176.0" y="341" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Auto Scaling group</text>
<text x="176.0" y="361" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Elastic IP A</text>
<rect x="400" y="288" width="288" height="102" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4" stroke-dasharray="6 5"/>
<text x="544.0" y="317" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Managed NAT gateway</text>
<text x="544.0" y="341" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Standby gateway</text>
<text x="544.0" y="361" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Elastic IP B</text>
<path d="M176 390 V420 H360 V447" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#alternat-routing-accent)"/>
<path d="M544 390 V420 H360" fill="none" stroke="var(--color-text-subtle)" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="5 5"/>
<rect x="244" y="454" width="232" height="64" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="360.0" y="483" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Internet gateway</text>
<text x="360.0" y="507" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">VPC egress</text>
<path d="M360 518 V545" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#alternat-routing-accent)"/>
<text x="360" y="568" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="17" font-weight="500" fill="var(--color-text)">Internet</text>
<path d="M20 594 H700" fill="none" stroke="var(--color-border)" stroke-width="1.8" stroke-linejoin="round"/>
<text x="124" y="621" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-accent)">DETECT</text>
<text x="124" y="648" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">Checks every minute</text>
<text x="124" y="668" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">or termination event</text>
<text x="360" y="621" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-accent)">SWITCH</text>
<text x="360" y="648" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">Lambda updates</text>
<text x="360" y="668" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">the default route</text>
<text x="596" y="621" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-accent)">RESTORE</text>
<text x="596" y="648" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">Replacement boots</text>
<text x="596" y="668" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">and restores route</text>
</svg>
</div>
<figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — One zone shown; each configured zone has its own instance and standby gateway. The routes use separate Elastic IPs. Based on the <a href="https://github.com/chime/terraform-aws-alternat#architecture-overview">upstream architecture</a>.</figcaption>
</figure>

The check interval is a detection cadence, not a guarantee of recovery within one minute.

I introduced the system in the main VPCs, then made it an option in the [cell platform](/case-studies/environments-you-can-create-and-destroy-with-one-command/). The configuration uses ARM instances. It also allocates separate Elastic IPs for the instance and fallback gateway, allowing both egress addresses to be known and allowlisted ahead of a switch.

## Remove an unnecessary deployment dependency

The version of alterNAT we adopted required a container image for its failover function. That added a build and registry dependency to infrastructure automation running through pull requests.

I contributed two changes upstream:

- [Zip deployment support, PR #44](https://github.com/chime/terraform-aws-alternat/pull/44), allowing the function to use the standard Lambda runtime without an image registry.
- [Dependency removal, PR #52](https://github.com/chime/terraform-aws-alternat/pull/52), replacing `requests` with the standard library and removing the Terraform-time dependency installation step. The function still uses `boto3`, supplied by the Lambda runtime.

The cell configuration uses that deployment path:

```hcl title="cell/nat.tf"
# Selected inputs from the alterNAT module invocation.
architecture        = "arm64"
lambda_package_type = "Zip"
create_nat_gateways  = true
```

## What changed

Normal traffic gained an instance-based egress path with automatic managed-gateway fallback. The integration fit the existing Terraform workflow, and the deployment changes shipped upstream, where they could be maintained and reused beyond our own installation.
