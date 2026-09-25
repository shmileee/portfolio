---
title: Self-service cloud functions for customer code
summary: "Customer extensions move from upload to a running Lambda through automated builds and a small provisioning API, with function-specific roles, authenticated invocation, and logs."
role: "Implemented the selected AWS architecture, introduced Crossplane, and built the infrastructure, build workflow, and provisioning controls."
evidence: "The SDK service provisions functions through a Kubernetes claim; the composition supplies a per-function IAM role, IAM-authenticated function URL, and log group."
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

## Deliver the selected runtime architecture

The product needed to run customer-written server-side extensions. An earlier evaluation compared hosted runtimes with an AWS implementation and selected Lambda based on isolation, maturity, data residency, and control over the platform.

I took that decision into implementation. I introduced Crossplane and built the Terraform infrastructure, build workflow, and provisioning integration. The goal was to let the product create functions without a platform engineer configuring cloud resources for each upload.

## Separate building code from provisioning resources

The build workflow starts when an extension is uploaded to S3 as `<name>/<version>/lambda.zip`. EventBridge starts a Step Functions execution, which records the version's build state in DynamoDB, runs CodeBuild, publishes a container image, and records the resulting image URI.

The provisioning workflow starts after a successful build. The SDK service creates a `LambdaFunction` claim in Kubernetes, and a Crossplane composition creates the corresponding AWS resources.

<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">EXHIBIT — FROM UPLOAD TO RUNNING FUNCTION</div>
  <svg aria-label="An app developer uploads an extension; the SDK service stores it in S3; an event rule starts a Step Functions state machine that takes a per-version lock in DynamoDB, has CodeBuild build an image from the shared Dockerfile, pushes it to the registry and records the version; the SDK service polls the build status and creates a LambdaFunction object that a Crossplane composition turns into a Lambda with a bounded IAM role, an IAM-authenticated function URL and its own log group" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 626" role="img"><defs><marker id="arrPL" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-text-muted)"></path></marker></defs><text x="180" y="18" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.16em" fill="var(--color-text-subtle)">BUILD PLANE · TERRAFORM + STEP FUNCTIONS</text><text x="540" y="18" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="0.16em" fill="var(--color-text-subtle)">PROVISIONING PLANE · CROSSPLANE</text><rect x="30" y="40" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="63" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">App developer</text><text x="180" y="81" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">uploads extension</text><path d="M180,98 L180,120" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="122" width="300" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="147" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">App SDK service</text><path d="M180,162 L180,184" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="186" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="209" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">S3</text><text x="180" y="227" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">lambda.zip</text><path d="M180,244 L180,266" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="268" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="291" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Step Functions</text><text x="180" y="309" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">event rule</text><path d="M180,326 L180,348" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="350" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="373" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Per-version lock</text><text x="180" y="391" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">DynamoDB · TTL reclaim</text><path d="M180,408 L180,430" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="432" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="455" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">CodeBuild</text><text x="180" y="473" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">image from shared Dockerfile</text><path d="M180,490 L180,512" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="30" y="514" width="300" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="180" y="539" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Registry</text><path d="M180,554 L180,576" stroke="var(--color-border)" stroke-width="1.2" fill="none" stroke-dasharray="3 4" marker-end="url(#arrPL)"></path><rect x="30" y="578" width="300" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="4 4"></rect><text x="180" y="603" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text-body)">Record version + latest pointer</text><rect x="390" y="40" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="63" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">App SDK service</text><text x="540" y="81" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">polls build status</text><path d="M540,98 L540,120" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="390" y="122" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="145" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">LambdaFunction object</text><text x="540" y="163" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">Kubernetes</text><path d="M540,180 L540,202" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="390" y="204" width="300" height="40" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="229" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Crossplane composition</text><path d="M540,244 L540,266" stroke="var(--color-border)" stroke-width="1.2" fill="none" marker-end="url(#arrPL)"></path><rect x="390" y="268" width="300" height="58" rx="6" fill="var(--color-surface)" stroke="var(--color-accent)" stroke-width="1"></rect><text x="540" y="291" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="var(--color-text)">Lambda</text><text x="540" y="309" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10.5" fill="var(--color-text-subtle)">IAM role · IAM-authenticated URL · logs</text></svg>
</div>

That separation keeps image construction and cloud-resource reconciliation independently observable. The SDK consumes the completed build record rather than reconstructing the build process.

## Keep the provisioning interface small

The SDK supplies the image and runtime settings through one object. This shortened example uses a fictional API group, image repository, and account:

```yaml title="functions/example-extension.yaml"
apiVersion: example.com/v1alpha1
kind: LambdaFunction
metadata:
  name: example-extension
spec:
  imageUri: >-
    111111111111.dkr.ecr.eu-west-1.amazonaws.com/functions:v1
  memorySize: 256
  timeout: 20
  permissionsBoundaryArn: >-
    arn:aws:iam::111111111111:policy/function-boundary
  resourceConfig:
    region: eu-west-1
  compositionSelector:
    matchLabels:
      type: container
```

The composition creates a function-specific IAM role and applies the supplied permissions boundary. Invocation uses an IAM-authenticated function URL with response streaming enabled. Each function also gets a log group so developers can inspect their extension's output.

The SDK service has a dedicated Kubernetes role for managing function claims. Customer code executes in the resulting Lambda; it does not receive the SDK's provisioning role. Platform ownership labels keep the dynamically created resources visible in shared monitoring.

## Handle retries and lifecycle edges explicitly

The build workflow checks for an active build or an existing successful version before starting work. It uses a version-scoped lock, handles lock contention, and includes recovery for expired locks. Successful versions have a separate artifact record, allowing repeated events to be recognized.

Cleanup also needed attention when a function object was removed partway through provisioning. The composition declares deletion behavior for its managed resources, and the integration includes cleanup for stale composite objects.

The selected runtime carries constraints: a 15-minute execution limit and cold-start latency. Those belong in the architecture decision because they affect which customer extensions the platform can support.

## What changed

The product gained an automated path from extension upload to a running function with its own identity, invocation controls, and logs. The platform team owns the shared build and provisioning machinery; individual functions use the same interface without a manual infrastructure request.
