# Personal VPN with Ad-Blocking

**Summary**  
Terraform-managed AWS infrastructure providing secure remote access via WireGuard VPN with integrated DNS-based ad-blocking. Optimized for personal use with cost-effective single-instance deployment.

**Role & Dates**  
Lead (solo) — Dec 2025–Present

**Problem**  
Secure remote access for mobile devices with privacy-focused ad-blocking, while maintaining low operational costs and avoiding third-party VPN services.

**Architecture**  
- Compute: **EC2 t2.micro** (free-tier eligible), **Amazon Linux 2023**  
- VPN: **WireGuard** (port 51820/udp) for modern, fast VPN protocol  
- Network: Custom **VPC** (10.10.0.0/16) with single public subnet in **us-east-1a**  
- Storage: **8GB gp3 EBS** (default AL2023 root volume)  
- Management: **AWS Systems Manager** for secure remote access without SSH key exposure  
- IaC: **Terraform** managing **10 resources** (VPC, subnet, IGW, route table, security group, EC2, IAM role/profile)

**Outcomes**  
- **Cost efficiency:** **~$9-12/month** (EC2 ~$8.47 + EBS ~$0.80) with free-tier eligibility  
- **Security:** IAM least privilege (SSM-only permissions), SSM Session Manager eliminates SSH key management  
- **Simplicity:** Single-instance deployment with minimal operational overhead  
- **Infrastructure as Code:** Complete Terraform automation for reproducible deployments across regions

**Highlights**  
- WireGuard chosen over OpenVPN for lower latency and simpler configuration  
- SSM Session Manager provides secure shell access without bastion hosts or exposed SSH keys  
- Security group restricts ingress to SSH (22/tcp) and WireGuard (51820/udp) only  
- Single-AZ deployment prioritizes cost optimization over high availability for personal use  
- Optional EC2 key pair for SSH fallback access

**Technologies**  
AWS (EC2, VPC, IAM, Systems Manager, EBS), Terraform, WireGuard, Amazon Linux 2023

**Links**  
Portfolio: https://vibebycory.dev  
GitHub: https://github.com/cmorgan3324/vpn-adblock

