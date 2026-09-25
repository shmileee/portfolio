---
title: Environments you can create and destroy with one command
summary: "A complete environment became one Terraform stack, with GitOps bootstrap and optional network attachment. A custom provider verifies cleanup before allowing cluster and VPC destruction to continue."
role: "Designed the cell architecture with the platform team and wrote the provider that coordinates and verifies teardown."
evidence: "One stack provisions a cell with more than 20 available platform add-ons; teardown records progress and reports surviving resources when verification fails."
topics:
  - reliability
  - cost
  - delivery
order: 10
aliases:
  - 14-environments-you-can-create-and-destroy-with-one-command
  - ephemeral-environments
featured: true
spotlight: true
spotlightProof: "One stack provisions a cell; a custom lifecycle provider checks controller-created cloud resources before cluster and network destruction can proceed."
---

## Make the full environment lifecycle repeatable

Creating an environment required weeks of work across networking, Kubernetes, identity, secrets, DNS, and delivery. Deleting it was harder than reversing those steps: Kubernetes controllers created cloud resources that Terraform did not directly manage, leaving volumes, load balancers, and instances behind.

The business driver was expansion into new regions. I designed a cell architecture and built it with the platform team: a repeatable unit containing its network, cluster, and platform services. The same unit could support temporary test environments or dedicated customer environments where needed.

## Give Terraform and GitOps explicit responsibilities

A cell starts as one Terraform stack. A data-only metadata module validates its inputs, resolves network sizing, and supplies consistent names and access settings. Terraform provisions the VPC, EKS cluster, networking prerequisites, and supporting cloud resources.

Terraform then installs the Flux operator and declares the Flux runtime. Flux reads the cell's generated configuration and installs the enabled GitOps-managed add-ons. The catalog includes more than 20 add-ons; a cell selects what it needs rather than receiving every component automatically.

**Metadata module.** Validated inputs, naming, sizing, and derived configuration

**Terraform.** Cloud resources, cluster prerequisites, Flux bootstrap, and cell metadata

**Flux.** Reconciliation of enabled platform add-ons from Git

**Teardown provider.** Ordered cleanup and verification of supported controller-created resources

Cluster metadata crosses the Terraform-to-Flux boundary through a generated `ConfigMap`. Environment and region variations use reusable Kustomize components. Guardrails reject unresolved substitutions in generated paths, so missing metadata surfaces as a reconciliation failure.

Network attachment and [NAT optimization](/case-studies/the-nat-bill-and-the-fix-that-went-upstream/) are explicit options. The network attachment manager also maintains a registry consumed by network and secrets automation. Its key includes account, region, and cluster identity so equal names in different locations cannot overwrite one another.

## Make teardown an enforced dependency

I wrote a Terraform provider to close the gap between deleting declared infrastructure and cleaning up the resources its controllers had created. Its lifecycle resource runs before the cluster and the infrastructure it references are destroyed.

This reduced example shows that dependency relationship:

```hcl title="cell/teardown.tf"
resource "cellops_cell_runtime" "this" {
  cluster_name        = module.eks.cluster_name
  region              = var.region_name
  vpc_owned           = var.create_vpc
  require_clean_slate = true

  guard = {
    vpc = local.vpc_id
  }

  timeouts = {
    delete = "60m"
  }
}
```

1. **Preflight.** Establish whether the cluster API is reachable
2. **Freeze.** Pause reconciliation and remove webhooks that would obstruct deletion
3. **Evacuate.** Remove workloads and let live controllers release their resources
4. **Decommission.** Remove autoscaled capacity
5. **Reconcile.** Find and delete supported AWS resources within the cluster's ownership scope
6. **Verify.** Re-scan, wait for deletions in progress, and report anything still present

<figure class="concept-diagram" data-concept-diagram>
<div class="diagram-exhibit" data-exhibit>
<div class="diagram-exhibit-label">CELL LIFECYCLE · CREATION AND VERIFIED TEARDOWN</div>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 658" role="img" aria-labelledby="cell-lifecycle-title cell-lifecycle-desc">
<title id="cell-lifecycle-title">Cell Lifecycle</title>
<desc id="cell-lifecycle-desc">Terraform creates the cluster and bootstraps Flux, whose add-ons create cloud resources through controllers. During destruction the lifecycle provider runs preflight, freeze, evacuate, decommission, reconcile and verify before Terraform can destroy the cluster and its owned infrastructure. If the cluster API is unavailable, cleanup proceeds to AWS reconciliation. Incomplete cleanup stops destruction, reports survivors and can be retried from checkpointed phases.</desc>
<defs>
<marker id="cell-lifecycle-accent" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="var(--color-accent)"/></marker>
<marker id="cell-lifecycle-muted" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 Z" fill="var(--color-text-subtle)"/></marker>
</defs>
<text x="20" y="20" text-anchor="start" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-accent)">CREATE · DECLARED INFRASTRUCTURE</text>
<rect x="20" y="38" width="212" height="88" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="126.0" y="67" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-accent)">Terraform</text>
<text x="126.0" y="91" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">VPC + EKS + metadata</text>
<text x="126.0" y="111" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Bootstrap Flux</text>
<rect x="254" y="38" width="212" height="88" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="360.0" y="67" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-accent)">Flux</text>
<text x="360.0" y="91" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Enabled platform</text>
<text x="360.0" y="111" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">add-ons</text>
<rect x="488" y="38" width="212" height="88" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="594.0" y="67" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Controllers</text>
<text x="594.0" y="91" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Cloud resources:</text>
<text x="594.0" y="111" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">volumes, LBs, nodes</text>
<path d="M232 82 H249" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#cell-lifecycle-accent)"/>
<path d="M466 82 H483" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#cell-lifecycle-accent)"/>
<path d="M20 151 H700" fill="none" stroke="var(--color-border)" stroke-width="1.8" stroke-linejoin="round"/>
<text x="20" y="180" text-anchor="start" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-accent)">DESTROY · LIFECYCLE PROVIDER RUNS FIRST</text>
<rect x="20" y="206" width="212" height="98" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="126.0" y="235" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">01 · Preflight</text>
<text x="126.0" y="259" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Is the cluster API</text>
<text x="126.0" y="279" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">reachable?</text>
<rect x="254" y="206" width="212" height="98" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="360.0" y="235" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">02 · Freeze</text>
<text x="360.0" y="259" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Pause reconciliation</text>
<text x="360.0" y="279" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Unblock deletion</text>
<rect x="488" y="206" width="212" height="98" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="594.0" y="235" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">03 · Evacuate</text>
<text x="594.0" y="259" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Remove workloads</text>
<text x="594.0" y="279" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Controllers clean up</text>
<rect x="488" y="390" width="212" height="98" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="594.0" y="419" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">04 · Decommission</text>
<text x="594.0" y="443" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Remove autoscaled</text>
<text x="594.0" y="463" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">capacity</text>
<rect x="254" y="390" width="212" height="98" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4"/>
<text x="360.0" y="419" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">05 · Reconcile</text>
<text x="360.0" y="443" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">AWS cleanup within</text>
<text x="360.0" y="463" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">ownership scope</text>
<rect x="20" y="390" width="212" height="98" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="126.0" y="419" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-accent)">06 · Verify</text>
<text x="126.0" y="443" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Re-scan and wait</text>
<text x="126.0" y="463" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Report survivors</text>
<path d="M232 255 H249" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#cell-lifecycle-accent)"/>
<path d="M466 255 H483" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#cell-lifecycle-accent)"/>
<path d="M594 304 V385" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#cell-lifecycle-accent)"/>
<path d="M488 439 H471" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#cell-lifecycle-accent)"/>
<path d="M254 439 H237" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#cell-lifecycle-accent)"/>
<path d="M126 304 V354 H360 V385" fill="none" stroke="var(--color-text-subtle)" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="5 5" marker-end="url(#cell-lifecycle-muted)"/>
<text x="245" y="342" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">API unavailable → AWS cleanup</text>
<path d="M126 488 V518 H170 V548" fill="none" stroke="var(--color-accent)" stroke-width="1.8" stroke-linejoin="round" marker-end="url(#cell-lifecycle-accent)"/>
<text x="212" y="539" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-accent)">clean</text>
<path d="M126 518 H540 V548" fill="none" stroke="var(--color-text-subtle)" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="5 5" marker-end="url(#cell-lifecycle-muted)"/>
<text x="595" y="539" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="400" fill="var(--color-text-subtle)">incomplete</text>
<rect x="20" y="554" width="300" height="90" rx="10" fill="var(--color-accent-surface)" stroke="var(--color-accent)" stroke-width="1.4"/>
<text x="170.0" y="583" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-accent)">Continue destruction</text>
<text x="170.0" y="607" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Terraform removes cluster</text>
<text x="170.0" y="627" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">and owned infrastructure</text>
<rect x="380" y="554" width="320" height="90" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.4" stroke-dasharray="6 5"/>
<text x="540.0" y="583" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="var(--color-text)">Stop + report survivors</text>
<text x="540.0" y="607" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">Retry resumes checkpointed</text>
<text x="540.0" y="627" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="400" fill="var(--color-text-subtle)">phases; cleanup stays visible</text>
</svg>
</div>
<figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — The provider must complete cleanup before Terraform can remove the cluster and its owned infrastructure. The AWS phases still run when the cluster API is unavailable.</figcaption>
</figure>

If Kubernetes is unavailable, the provider continues to the AWS cleanup stages. Those final stages determine whether teardown can proceed. A resource still deleting is distinguished from one that is stuck; a failed verification stops destruction and lists the survivors.

Progress is checkpointed in Terraform's private state. A retry can resume completed work, but each phase is also safe to re-enter if the checkpoint is unavailable. During normal refresh, the provider reports attached resources outside its tag-based discovery scope, exposing potential cleanup problems before a destroy is requested.

## What changed

Provisioning gained a reusable interface, and teardown gained explicit completion criteria. New regional environments could use a reviewed stack definition. Failed cleanup remained visible and recoverable instead of being hidden behind a successful-looking infrastructure deletion.
