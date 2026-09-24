---
title: Self-service cloud functions for customer code
summary: Uploaded customer code becomes an isolated, observable Lambda function through a Step Functions build plane and a Crossplane provisioning plane, with no platform engineer in the loop per function.
role: Took the chosen direction, introduced Crossplane to the organization and built the automation around it, plus the Terraform, the build pipeline and the safety rules.
evidence: One Kubernetes object per function is the whole provisioning API; only the SDK service may create one, and each function runs under a permissions boundary the platform patches in.
topics:
  - security
  - delivery
order: 16
aliases:
  - 21-customer-code-running-safely-self-service-cloud-functions
  - cloud-functions
featured: false
spotlight: false
---

## The situation

The business came to our team with a concrete ask: the product's app platform needed to run customer-written server-side code, and they wanted an architecture and an implementation. An earlier evaluation had compared hosted runtimes, Deno Subhosting and Cloudflare Workers for Platforms, against building on AWS ourselves. Hosted lost on data residency and vendor lock-in; AWS Lambda won on isolation and maturity. I took the chosen direction and built it: I introduced Crossplane to the organization and built the automation around it, plus the Terraform, the build pipeline and the safety rules.

## What I did

The platform splits into two planes: one turns uploaded code into an image, the other turns that image into a running function.

### The build plane

Terraform and Step Functions. A developer's uploaded extension lands in S3 as `<name>/<version>/lambda.zip`. An event rule triggers a state machine: acquire a per-version lock in DynamoDB, have CodeBuild bake the code into a container image from a shared Dockerfile, push it to the registry, then record the version.

### The provisioning plane

Crossplane in Kubernetes. Crossplane turns Kubernetes objects into cloud resources, so the SDK service polls for finished builds and then creates one small object, which is the entire provisioning API:

```yaml title="functions/example-extension.yaml"
apiVersion: example.com/v1alpha1
kind: LambdaFunction
metadata:
  name: example-extension
spec:
  imageUri: >-
    111111111111.dkr.ecr.eu-west-1.amazonaws.com/cloud-functions:v1.0.0
  memorySize: 256
  timeout: 20
  compositionSelector:
    matchLabels:
      # or "zip": two compositions, selected by label
      type: container
```

Crossplane turns that object into the real thing: an isolated Lambda function; its own IAM role, capped by a permissions boundary the platform patches in, so customer code cannot widen its own permissions; a URL that requires signed requests; streaming-response support, with the functions living outside any VPC as AWS advises for low-latency streaming; and a per-function log group, so app developers can see their own logs.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — FROM UPLOAD TO RUNNING FUNCTION</div>
  <svg aria-label="An app developer uploads an extension; the SDK service stores it in S3; an event rule starts a Step Functions state machine that takes a per-version lock in DynamoDB, has CodeBuild build an image from the shared Dockerfile, pushes it to the registry and records the version; the SDK service polls the build status and creates a LambdaFunction object that a Crossplane composition turns into a Lambda with a bounded IAM role, a signed URL and its own log group" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 626" role="img"><defs><marker id="arrPL" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><text x="180" y="18" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.16em" fill="var(--color-text-subtle)">BUILD PLANE · TERRAFORM + STEP FUNCTIONS</text><text x="540" y="18" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.16em" fill="var(--color-text-subtle)">PROVISIONING PLANE · CROSSPLANE</text><rect x="30" y="40" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="63" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">App developer</text><text x="180" y="81" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">uploads extension</text><path d="M180,98 L180,120" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="122" width="300" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="147" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">App SDK service</text><path d="M180,162 L180,184" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="186" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="209" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">S3</text><text x="180" y="227" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">lambda.zip</text><path d="M180,244 L180,266" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="268" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="291" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Step Functions</text><text x="180" y="309" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">event rule</text><path d="M180,326 L180,348" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="350" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="373" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Per-version lock</text><text x="180" y="391" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">DynamoDB · TTL reclaim</text><path d="M180,408 L180,430" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="432" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="455" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">CodeBuild</text><text x="180" y="473" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">image from shared Dockerfile</text><path d="M180,490 L180,512" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="514" width="300" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="539" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Registry</text><path d="M180,554 L180,576" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrPL)"></path><rect x="30" y="578" width="300" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="180" y="603" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Record version + latest pointer</text><rect x="390" y="40" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="63" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">App SDK service</text><text x="540" y="81" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">polls build status</text><path d="M540,98 L540,120" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="390" y="122" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="145" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">LambdaFunction object</text><text x="540" y="163" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">Kubernetes</text><path d="M540,180 L540,202" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="390" y="204" width="300" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="229" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Crossplane composition</text><path d="M540,244 L540,266" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="390" y="268" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="291" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Lambda</text><text x="540" y="309" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">bounded IAM role · signed URL · log group</text></svg>
</div>

The self-service needed a fence: the only identity allowed to create function objects is the SDK service itself. The unglamorous correctness work mattered too: cleaning up cloud resources when a function object is deleted half-way, and making Crossplane's dynamically spawned machinery carry proper team-ownership labels so it shows up in our monitoring like everything else.

## A build plane safe to re-run

The build plane is safe to re-run. The per-version lock means concurrent builds of the same version cannot trample each other, stale locks expire and are reclaimed, and a version that already succeeded is simply skipped, so a retried or duplicated event is a no-op rather than a second image under the same name.

Two trade-offs are accepted and written into the decision record: Lambda's 15-minute execution cap, and cold starts that container packaging mitigates but does not eliminate.

## What it changed

Customer extension code goes from upload to a running, isolated, observable function without a platform engineer provisioning anything by hand.
