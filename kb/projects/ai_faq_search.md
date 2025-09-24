# AI Semantic FAQ Search (Weaviate + OpenAI)

**Summary**  
Proof‑of‑concept semantic search over FAQs with hybrid BM25 + vector retrieval and a simple Streamlit UI.

**Role & Dates**  
Lead (solo) — Jun 2025–Present

**Problem**  
Make FAQ answers discoverable beyond keywords; keep infra affordable for a personal portfolio.

**Architecture**  
- Compute: **EC2 t3.micro** (free‑tier), **Docker** for Weaviate + app  
- Vector DB: **Weaviate** with **OpenAI embeddings**  
- App/UI: **Streamlit**  
- IaC/CI: **Terraform** for VPC/EC2/roles; optional GitHub Actions

**Outcomes**  
- **Cost efficiency:** **~$7–8/month** with free‑tier EC2 and optimized storage  
- **Search quality:** hybrid **BM25 + vector** improves recall on paraphrases and synonyms  
- **Developer experience:** one‑shot Terraform bootstrap with dynamic IP management

**Highlights**  
- Ingestion pipeline for FAQ content → embeddings → Weaviate index  
- Health checks and basic relevance dashboarding in Streamlit

**Technologies**  
AWS (EC2, IAM, VPC, S3), Docker, Weaviate, OpenAI API, Streamlit, Terraform, Python

**Links**  
Portfolio: https://vibebycory.dev  
GitHub: https://github.com/cmorgan3324
