# Resume PDF Update Instructions

## Current Status

- **Existing PDF**: `Cory_Morgan_SA_Resume.pdf` (dated Jul 28, 2025)
- **Resume HTML**: `resume/index.html` ✅ Updated with VPN-adblock project
- **Download Links**: 
  - `/resume/index.html` → `/Cory_Morgan_SA_Resume.pdf`
  - `/index.html` → `Cory_Morgan_SA_Resume.pdf`

## VPN-Adblock Project Added

The resume HTML has been updated with the following entry:

```html
<div class="project">
  <h3><a href="https://github.com/cmorgan3324/vpn-adblock">Personal VPN with Ad-Blocking</a></h3>
  <ul>
    <li>Deployed WireGuard VPN on AWS EC2 with Terraform automation for secure remote access.</li>
    <li>Implemented SSM Session Manager for secure instance management without SSH key exposure.</li>
    <li>Optimized for cost (~$11/month) using t2.micro and gp3 EBS storage.</li>
  </ul>
</div>
```

## Manual PDF Update Required

No automated PDF generation method detected. To update the PDF:

### Option 1: Browser Print-to-PDF (Recommended)

1. Start a local server or deploy to staging:
   ```bash
   cd portfolio-site
   python3 -m http.server 8000
   ```

2. Open in browser: `http://localhost:8000/resume/index.html`

3. Print to PDF:
   - **Chrome/Edge**: Ctrl/Cmd+P → Destination: "Save as PDF"
   - **Firefox**: Ctrl/Cmd+P → "Save to PDF"
   - **Safari**: Cmd+P → PDF → "Save as PDF"

4. Save as: `Cory_Morgan_SA_Resume.pdf`

5. Replace the existing PDF in the portfolio-site root directory

### Option 2: Use Existing Workflow

If you have a documented PDF generation workflow (LaTeX, Typst, Docx, etc.), use that method and ensure the VPN-adblock project is included.

### Option 3: Manual Edit

If the PDF is maintained separately (e.g., in Word, Google Docs, LaTeX):

1. Open the source document
2. Add the VPN-adblock project to the Projects section:
   ```
   Personal VPN with Ad-Blocking
   - Deployed WireGuard VPN on AWS EC2 with Terraform automation for secure remote access
   - Implemented SSM Session Manager for secure instance management without SSH key exposure
   - Optimized for cost (~$11/month) using t2.micro and gp3 EBS storage
   ```
3. Export/generate new PDF
4. Replace `Cory_Morgan_SA_Resume.pdf`

## Verification

After updating the PDF:

```bash
# Check file size changed
ls -lh portfolio-site/Cory_Morgan_SA_Resume.pdf

# Verify PDF contains VPN project
pdftotext portfolio-site/Cory_Morgan_SA_Resume.pdf - | grep -i "vpn\|wireguard"
```

## Deployment

Once PDF is updated, deploy to production:

```bash
cd portfolio-site
# Use your existing deployment method (AWS S3 sync, GitHub Actions, etc.)
```

The download links will automatically serve the updated PDF.
