---
title: "Zero-Downtime Deployments with Kubernetes: A Practical Guide"
date: 2025-01-15
description: "A deep dive into achieving zero-downtime deployments using Kubernetes rolling updates, readiness probes, and PodDisruptionBudgets."
tags: ["kubernetes", "devops", "deployment"]
draft: false
---

Achieving zero-downtime deployments sounds simple in theory, but it's surprisingly tricky in practice. In this post, I'll walk through the patterns I use in production to ensure your users never see a 502.

## The Problem

Every time you deploy a new version of your application, there's a brief window where old pods are terminating and new pods haven't started handling traffic yet. Without proper configuration, this window causes dropped requests.

## Rolling Updates

Kubernetes performs rolling updates by default. The key parameters to tune are in your `Deployment` spec:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

Setting `maxUnavailable: 0` ensures Kubernetes never removes an old pod until a new one is **ready**.

## Readiness Probes are Non-Negotiable

The most common mistake I see is deploying without a proper `readinessProbe`. Without it, Kubernetes routes traffic to a pod the moment it starts — before your app is actually ready.

```yaml
readinessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

## PodDisruptionBudgets

For critical services, add a `PodDisruptionBudget` to prevent voluntary disruptions (like node drains) from taking down too many pods at once:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: my-app
```

## Graceful Shutdown

Finally, make sure your application handles `SIGTERM` gracefully. Give it time to finish in-flight requests before exiting. Configure `terminationGracePeriodSeconds` in your pod spec accordingly.

```yaml
terminationGracePeriodSeconds: 30
```

## Conclusion

Zero-downtime deployments require a combination of proper rolling update strategy, readiness probes, PodDisruptionBudgets, and graceful shutdown logic. Get all four right, and your users will never notice a deploy is happening.
