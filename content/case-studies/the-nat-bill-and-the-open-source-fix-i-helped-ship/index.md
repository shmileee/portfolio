---
title: The NAT bill and the fix that went upstream
summary: Self-managed NAT instances with automatic failover to the managed gateway removed the per-gigabyte charge from the default path, and the deployment model we needed was merged into the open-source project itself.
role: Adopted alterNAT in the main VPCs, designed it into the cell platform as a toggle, and contributed the Zip deployment path and the dependency-free failover function upstream.
evidence: Two merged upstream pull requests; production runs on exactly the code path they added; failover is tested every minute.
topics:
  - cost
  - networking
order: 15
aliases:
  - 15-the-nat-bill-and-the-open-source-fix-i-helped-ship
  - nat-cost
featured: false
spotlight: false
---

## The situation

The managed NAT Gateway charges per hour and per gigabyte processed, about 4.5 cents per gigabyte. Push serious traffic through it and the data-processing line dwarfs the gateways themselves. The [alterNAT project's own arithmetic](https://github.com/chime/terraform-aws-alternat) puts about 10 TB a month at roughly $950 through a managed gateway, against roughly half that through a self-managed NAT instance, which pays no per-gigabyte fee at all.

## What I did

I adopted alterNAT, an open-source project that replaces managed NAT gateways with auto-scaled EC2 NAT instances while keeping a standby managed gateway as a safety net. A small function checks connectivity every minute and flips the route tables to the managed gateway if an instance ever fails, then back when it recovers. Cheap path by default, expensive path as insurance.

I ran it first in our main VPCs, then designed it into the [cell architecture](/case-studies/environments-you-can-create-and-destroy-with-one-command/) as a per-environment toggle, on ARM instances, which the [image factory](/case-studies/turning-container-images-from-a-liability-into-a-supply-chain/) had made free. A later overhaul pre-allocates all the public IPs with the VPC, the NAT instances' and the standby gateways', so flipping the toggle never changes the addresses the outside world has allowlisted.

## The interesting part

I did not only consume the project; I contributed the deployment model we needed. Early alterNAT required building and hosting a container image for its failover function, and in shared automation, CI and Terraform run from pull requests, that is a build dependency nobody wants.

My merged upstream pull requests added the native Zip deployment path ([#44](https://github.com/chime/terraform-aws-alternat/pull/44)), which packages the function for the standard runtime with no image registry involved, and then removed the last third-party dependency from the function so it runs on the standard library alone ([#52](https://github.com/chime/terraform-aws-alternat/pull/52)). Production at our company runs on exactly the code path I upstreamed.

## What it changed

The per-gigabyte NAT charge is gone from the default path, failover to the managed gateway is automatic and tested every minute, and the fix lives upstream where everyone gets it instead of in a private fork only we maintain.
