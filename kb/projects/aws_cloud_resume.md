# AWS Cloud Resume Challenge

**Summary**  
Static portfolio site with a serverless visitor counter and CI/CD, built to be fast, cheap, and repeatable via Infrastructure as Code.

**Role & Dates**  
Lead (solo) — May 2025–Present

**Problem**  
Replace a legacy Node.js site with a globally cached, low‑cost, low‑ops stack that’s easy to evolve.

**Architecture**  
- Front end: **S3 (private) + CloudFront (OAI/OAC)**, **Route 53** custom domain, **ACM** TLS  
- API: **API Gateway (HTTP) + Lambda (Python)**  
- Data: **DynamoDB** (on‑demand)  
- IaC/CI: **Terraform** modules; **GitHub Actions** deploy + CloudFront invalidation

**Outcomes**  
- **Ops cost:** **< $1/month** total (serverless‑first, cache‑heavy)  
- **CI/CD improvements:** **50s → 20s** deployment time; **60% cost reduction** in Actions minutes  
- **Reliability:** global CDN, versioned IaC, automated cache invalidations

**Highlights**  
- Repeatable single‑command deployments (Terraform remote state via S3 + DynamoDB lock)  
- Explicit **CORS** and least‑privilege IAM for API calls  
- SPA‑friendly CloudFront rules (HTML short TTL; assets longer)

**Technologies**  
AWS (S3, CloudFront, Route 53, ACM, API Gateway, Lambda, DynamoDB), Terraform, GitHub Actions, JavaScript

**Links**  
Portfolio: https://vibebycory.dev  
GitHub: https://github.com/cmorgan3324
