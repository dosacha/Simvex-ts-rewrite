# AWS Deployment

## Live Demo
- Live URL: https://d1jk6rz3s30fgw.cloudfront.net
- API Health: https://d1jk6rz3s30fgw.cloudfront.net/api/health

## Demo Architecture
```text
User
  |
  v
CloudFront (Seoul edge)
  |-- /*      -> S3 private origin
  |              bucket: simvex-web-eunwoo-20260425
  |              access: Origin Access Control (OAC)
  |
  `-- /api/*  -> API Gateway HTTP API
                  |
                  v
                Lambda
                  name: simvex-api
                  runtime: Node.js 20
                  architecture: arm64
                  memory: 512 MB
                  |
                  v
                Neon PostgreSQL
                  region: Singapore
```

## Demo vs Production
| Area | Current demo environment | Production-oriented environment |
| --- | --- | --- |
| Frontend | S3 private bucket behind CloudFront OAC | Same pattern, with stricter cache policies and release promotion |
| API compute | Lambda + API Gateway HTTP API | ECS Fargate service behind ALB |
| Database | Neon PostgreSQL, Singapore region | Amazon RDS PostgreSQL Multi-AZ |
| Scaling | Lambda concurrency and API Gateway managed scaling | ECS service autoscaling by CPU, memory, or request metrics |
| Network | Public serverless endpoints with managed CloudFront/API Gateway integration | VPC private subnets, ALB ingress, security groups, private DB |
| Cost profile | Near-zero demo cost using free tiers | Higher baseline cost, stronger control over latency and availability |
| Operational fit | Good for demos, interviews, and low-traffic validation | Better for long-running workloads, predictable traffic, and stricter ops |

## Implementation Notes
- The frontend is deployed as static assets to S3 and served only through CloudFront.
- CloudFront routes `/api/*` requests to API Gateway while all other paths resolve to the S3 web origin.
- The Fastify API is reused through `buildServer()` and exposed to Lambda via `@fastify/aws-lambda`.
- API routes are grouped under the `/api` prefix to match the CloudFront behavior pattern and frontend fetch calls.
- Catalog source JSON files live under `apps/api/data/import` so Lambda builds do not depend on the legacy Java project path.
- The Lambda bundle is generated with esbuild as ESM output at `apps/api/dist/lambda/index.mjs`.

## Interview Talking Points
- I kept the application code portable by separating the Fastify app factory from the runtime entry point. The same server can run locally, in a container, or behind Lambda.
- I used CloudFront path-based routing to present one public origin while still separating static web hosting from API execution.
- I made the S3 origin private with OAC so users cannot bypass CloudFront.
- I moved catalog data into the TypeScript workspace because Lambda packages must be self-contained at runtime.
- I added graceful degradation in the catalog loader so a missing import directory returns an empty catalog instead of a 500.
- I chose Lambda and API Gateway for the demo because they minimize fixed cost and operational setup.
- For a production system, I would consider ECS Fargate, ALB, and RDS Multi-AZ when traffic is steady, latency needs are stricter, or operations require VPC-level control.
- I validated the deployment path with API typecheck, Lambda bundling, unit tests, and a secret scan before pushing.
