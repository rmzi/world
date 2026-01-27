# rmzi.world

A personal portfolio site with an interactive 3D point cloud sphere.

## ✨ Features

- **Interactive 3D Landing**: Point cloud sphere that deforms under mouse interaction
- **Spatial Audio**: Gentle sine wave drone with stereo panning
- **Work Portfolio**: Expandable project cards
- **Self Page**: Bio section
- **Contact Modal**: Glassmorphism-styled contact form

## 🚀 Quick Start

```bash
# Install dependencies
make install

# Start dev server (http://localhost:5173)
make dev
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Three.js (R3F), Framer Motion, Zustand |
| Hosting | AWS S3 + CloudFront |
| Domain | Route53 (rmzi.world) |
| IaC | Terraform |

## ☁️ Deployment

### First-time infrastructure setup

```bash
# Ensure AWS credentials are configured for 'personal' profile
make deploy-infra
```

This creates:
- S3 bucket for static hosting
- CloudFront distribution with HTTPS
- ACM certificate for rmzi.world
- Route53 DNS records

### Deploy updates

```bash
make deploy
```

This builds the client and syncs to S3, then invalidates the CloudFront cache.

## 📁 Project Structure

```
rmzi.world/
├── client/          # React + Three.js frontend
│   └── src/
│       ├── components/  # 3D scene, overlays, audio
│       ├── pages/       # Work, Self views
│       └── data.js      # Static content
├── infrastructure/  # Terraform (S3, CloudFront, Route53)
└── Makefile         # Build & deploy commands
```

## 📝 License

MIT
