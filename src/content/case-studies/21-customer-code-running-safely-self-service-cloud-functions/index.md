---
number: 21
slug: customer-code-running-safely-self-service-cloud-functions
title: "Customer code, running safely: self-service cloud functions"
summary: Uploaded customer code becomes an isolated, observable function without per-function platform intervention.
topics:
  - security
  - delivery
featured: false
spotlight: false
---

## THE SITUATION

The business came to our team with a concrete ask: the product's app platform needed to run customer-written server-side code, and they wanted an architecture and an implementation. An earlier evaluation had compared hosted runtimes — Deno Subhosting, Cloudflare Workers for Platforms — against building on AWS ourselves; hosted lost on data residency and vendor lock-in, AWS Lambda won on isolation and maturity. I took the chosen direction and went all in on the exploration and the build: I introduced Crossplane to the organization and built the automation around it, plus the Terraform, the build pipeline, and the safety rules.

## WHAT I DID

The platform splits into two planes, and the split is the design:

The build plane (Terraform + Step Functions). A developer's uploaded extension lands in S3 as <name>/<version>/lambda.zip. An event rule triggers a state machine: acquire a per-version lock in DynamoDB (so concurrent builds of the same version can't trample each other; stale locks expire and are reclaimed), have CodeBuild bake the code into a container image from a shared Dockerfile, push it to the registry, then record the version — and builds are safe to re-run, because a version that already succeeded is simply skipped.

The provisioning plane (Crossplane in Kubernetes). The SDK service polls for finished builds and then creates a small Kubernetes object — this is the entire provisioning API:

```yaml filename="composition.yaml"
apiVersion: example.com/v1alpha1
kind: LambdaFunction
metadata:
  name: example-extension
spec:
  imageUri: <registry>/cloud-functions:example-v1.0.0
  memorySize: 256
  timeout: 20
  compositionSelector:
    matchLabels:
      type: container        # or "zip" — two compositions, selected by label
```

Crossplane turns that object into the real thing: an isolated Lambda function, its own IAM role capped by a permissions boundary the platform patches in (customers get creative freedom inside a box they cannot climb out of), a URL requiring signed requests, streaming-response support (the functions live outside any VPC, per AWS guidance for low-latency streaming), and a per-function log group so app developers can see their own logs.

{% diagram "./self-service-cloud-functions-planes.svg", "EXHIBIT — FROM UPLOAD TO RUNNING FUNCTION", "Build and provisioning planes for self-service cloud functions" %}

The self-service needed a fence: the only identity allowed to create function objects is the SDK service itself. And the unglamorous correctness work mattered too — cleaning up cloud resources when a function object is deleted half-way, and making Crossplane's dynamically-spawned machinery carry proper team-ownership labels so it shows up in our monitoring like everything else. (Accepted trade-offs, documented in the decision record: Lambda's 15-minute execution cap, and cold starts mitigated — not eliminated — by container packaging.)

## WHAT IT CHANGED

Customer extension code goes from upload to a running, isolated, observable function without a platform engineer provisioning each function by hand.
