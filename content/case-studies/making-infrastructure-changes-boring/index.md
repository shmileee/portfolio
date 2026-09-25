---
title: Making infrastructure changes boring
summary: "Infrastructure changes gained a shared review process: Terraform plans and Kubernetes previews in pull requests, approved applies through Atlantis, and Kubernetes deployment on merge."
role: "Introduced Atlantis and Argo CD, built the Kubernetes diff bot, approval workflow, and Atlantis browser controls, and led the staged rollout of automatic deployment."
evidence: "Four Kubernetes upgrades in the first six weeks; a diff bot used for three and a half years; infrastructure changes reviewed and applied through shared tooling."
topics:
  - delivery
  - devex
  - reliability
  - security
order: 1
aliases:
  - 01-making-infrastructure-changes-boring
  - infrastructure-changes
  - approve-the-audited-escape-hatch
  - 02-approve-the-audited-escape-hatch
  - audited-approve
  - buttons-instead-of-incantations
  - 03-buttons-instead-of-incantations
  - self-service-buttons
  - kubernetes-upgrades
  - 09-kubernetes-upgrades
featured: false
spotlight: false
---

## Make changes visible before automating them

When I joined, engineers applied infrastructure changes manually with privileged access. Reviewers could read the configuration, but had no reliable preview of its effect on a running environment. The change history was incomplete.

The clusters were also years behind supported Kubernetes versions. I ran four consecutive upgrades in my first six weeks. That work made the immediate need clear: infrastructure changes needed a repeatable review and deployment process.

I introduced that process in stages. First I moved infrastructure into shared tooling, then added previews, and only then enabled automatic Kubernetes deployment.

## One review process, two execution paths

I migrated Kubernetes infrastructure into Argo CD component by component, until it managed its own configuration too. For Terraform, I introduced Atlantis so plans and applies ran from pull requests in a controlled environment.

**Terraform.** Reviewers see a plan, locking, and a cost estimate. Approved changes are applied through Atlantis.

**Kubernetes.** Reviewers see a rendered diff for affected applications in development. After merge, Argo CD reconciles the configuration.

Atlantis provided Terraform's preview. Kubernetes needed an equivalent, so I built a bot that renders affected applications through Argo CD and posts their differences on the pull request. Rendering errors fail the check before merge.

<figure class="media-exhibit wide" data-exhibit>
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename">argocd-diff-commenter</span>
      <span class="exhibit-badge">PR PREVIEW</span>
    </div>
    <div class="media-exhibit-stage"><img src="/case-studies/making-infrastructure-changes-boring/argocd-diff-commenter.png" width="1560" height="1008" loading="lazy" decoding="async" alt="The Argo CD diff bot posts a pull-request comment showing an AWS Load Balancer Controller chart update from 3.4.3 to 3.5.0, rendered against development Argo CD." /></div>
  </div>
  <figcaption class="exhibit-caption"><span>EXHIBIT 01</span> — A dependency update arrives with a rendered diff in the pull request. This excerpt shows version-label changes on a <code>Secret</code> and a <code>Service</code>. The bot identity is anonymized.</figcaption>
</figure>

The preview has a defined scope: selected platform directories and the development Argo CD instance. It helps reviewers catch manifest and dependency changes early; production-specific differences still need review during promotion.

A month after the migration, once reviewers had those previews and the pipeline had operating history, I enabled Kubernetes deployment on merge. Over time I added GitHub App authentication, approval checks, and performance improvements to Atlantis, and removed the obsolete configuration left by the migration.

## Make routine Atlantis commands discoverable

Atlantis is driven by pull request comments. Engineers repeatedly typed the same commands, looked up options, and corrected mistakes before the actual infrastructure work could begin. During migrations, that friction repeated across many pull requests.

I built a browser extension that puts the common commands above GitHub's comment box. It fills and submits the existing composer as the logged-in user. It needs no additional GitHub token, backend service, or bot identity; Atlantis receives the same attributed comment the engineer could have typed.

<figure class="media-exhibit wide" data-exhibit>
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename">atlantis-pr-buttons.png</span>
      <span class="exhibit-badge">COMMANDS</span>
    </div>
    <div class="media-exhibit-stage"><img src="/case-studies/making-infrastructure-changes-boring/atlantis-pr-buttons.png" width="1654" height="676" loading="lazy" decoding="async" alt="Atlantis Plan, Approve, and Apply controls directly above GitHub's pull request comment box." /></div>
  </div>
  <figcaption class="exhibit-caption"><span>EXHIBIT 02</span> — Common commands beside the composer they use. Each action posts as the logged-in engineer.</figcaption>
</figure>

- **Plan:** `atlantis plan` — one click.
- **Approve:** `/approve` — one click; the workflow checks authorization.
- **Apply:** `atlantis apply` — arm, then confirm.
- **Apply without auto-merge:** `atlantis apply --auto-merge-disabled` — select the option, then confirm.
- **Unlock:** `atlantis unlock` — select, then confirm.


Apply returns to its unarmed state after three seconds, and a short cooldown prevents double-posting. The extension limits itself to configured repositories and can check team membership before showing the controls. That browser-side check controls visibility; Atlantis and the approval workflow enforce authorization on the server.

<details>
<summary>Watch the command and confirmation flow</summary>

<figure class="media-exhibit wide" data-exhibit>
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename">atlantis-pr-buttons-demo.mp4</span>
      <span class="exhibit-badge">DEMO</span>
    </div>
    <div class="media-exhibit-stage"><video src="/case-studies/making-infrastructure-changes-boring/atlantis-pr-buttons-demo.mp4" poster="/case-studies/making-infrastructure-changes-boring/atlantis-pr-buttons-demo-poster.png" width="880" height="588" controls playsinline preload="none" aria-label="Demonstration on a fictional pull request: Plan, Approve, two-stage Apply, Apply without auto-merge, and Unlock."></video></div>
  </div>
  <figcaption class="exhibit-caption"><span>EXHIBIT 03</span> — The interaction demonstrated on a mock pull request with fictional data. Apply and Unlock require confirmation.</figcaption>
</figure>

</details>

## Make emergency approval explicit

Requiring approval before `atlantis apply` created a practical question: how should an authorized on-call engineer proceed when an urgent fix cannot wait for normal peer review? I built a separate, auditable approval path:

```text title="Pull request comment"
/approve reason="emergency: restore service"
```

The workflow takes the commenter and pull request number from the dispatch event, so named command arguments cannot substitute another identity or target. It checks active membership in the configured authorized teams. An unauthorized request receives an explanation and no approval. An authorized request causes the CI bot to submit an approving review marked **Break-glass approval**.

The review records the requester, the team that authorized them, the bot that executed the approval, and the reason when supplied. A Slack audit notification links to the pull request, diff, and original command. The review explicitly says that standard peer review was bypassed and calls for retrospective review under the break-glass policy.

This is a delegated approval, not a second engineer's review. The current workflow permits an authorized PR author to invoke it, and the reason is optional in code. Team membership is the authorization boundary; the recorded identity and retrospective-review policy make its use accountable. The command grants an approval—it does not run `atlantis apply` itself.

## Carry upgrades and deletion checks through the same process

Kubernetes upgrades now follow a fixed order: operations, development, staging, then production. Control-plane, node, and component changes are separate pull requests, so a problem can be investigated before it reaches the next environment.

I initially wrapped `kube-no-trouble` in an exporter to surface deprecated APIs on dashboards. The dashboard later moved to the API server's native `apiserver_requested_deprecated_apis` metric. Its table names the API group, version, resource, and removal release observed during the selected time window. It shows requests that actually occurred; repository scanning is still needed to find dormant manifests that nobody requested during that window.

I also added a Kyverno policy checking resource-preservation settings on Argo CD `Application` and `ApplicationSet` resources. The checked-in policy runs in audit mode: it reports missing settings for follow-up rather than blocking deletion. Whether a deletion cascades still depends on the application's actual configuration.

## What changed

Engineers gained a consistent place to propose, inspect, approve, and execute infrastructure changes. The Kubernetes diff bot remained in use for three and a half years as the surrounding platform evolved. That review process became the foundation for later migrations, dependency updates, and supervised agent work.
