---
number: 15
slug: the-nat-bill-and-the-open-source-fix-i-helped-ship
title: The NAT bill, and the open-source fix I helped ship
summary: The per-gigabyte NAT tax is gone from the default path.
topics:
  - cost
  - networking
featured: false
spotlight: false
---

## The situation
One of AWS's quietest taxes: the managed NAT Gateway charges not just per hour but per gigabyte processed — about 4.5 cents/GB. Push serious traffic through it and the data-processing line dwarfs the gateways themselves; the project's own arithmetic shows ~10 TB/month costing roughly $950 through a managed gateway versus roughly half that through a self-managed NAT instance, which pays no per-gigabyte fee at all.

## What I did
I adopted AlterNAT — an open-source project that replaces managed NAT gateways with auto-scaled EC2 NAT instances, while keeping a standby managed gateway as a safety net: a small function checks connectivity every minute and flips the route tables to the managed gateway if an instance ever fails, then back when it recovers. Cheap path by default, expensive path as insurance.

I ran it first in our main VPCs, then designed it into the cell architecture ([case study 14](/case-studies/14-environments-you-can-create-and-destroy-with-one-command/)) as a per-environment toggle — on ARM instances, naturally ([case study 19](/case-studies/19-turning-container-images-from-a-liability-into-a-supply-chain/) made that free). A later overhaul pre-allocates all the public IPs with the VPC — the NAT instances' and the standby gateways' — so flipping the toggle never changes the addresses the outside world has allowlisted.

## The interesting part
I didn't just consume the project — I contributed the deployment model we needed upstream. Early AlterNAT required building and hosting a container image for its failover function; in shared automation (CI, pull-request-driven Terraform) that's a build dependency nobody wants.

My merged upstream pull requests added the native Zip deployment path ([chime/terraform-aws-alternat#44 ↗](https://github.com/chime/terraform-aws-alternat/pull/44)) — package the function for the standard runtime, no image registry involved — and then removed the last third-party dependency from the function so it runs on the standard library alone ([#52 ↗](https://github.com/chime/terraform-aws-alternat/pull/52)). Production at our company runs on exactly the code path I upstreamed; four more filed issues fed the maintainers' roadmap.

## What it changed
The per-gigabyte NAT tax is gone from the default path, failover to the managed gateway is automatic and tested every minute, and — the part I value most — the fix lives upstream where everyone gets it, instead of in a private fork only we maintain.
