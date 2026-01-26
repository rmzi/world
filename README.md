# rmzi.world - Personal Portfolio

An immersive personal website built with React, Three.js, and React-Admin.

![Point Cloud Sphere](/Users/rmzi/.gemini/antigravity/brain/e0655717-d681-4c36-b79e-b8d487c47ddf/frontend_verification_1769435782525.webp)

## ✨ Features

- **Interactive 3D Landing**: A point cloud sphere that deforms under mouse interaction
- **Spatial Audio**: Gentle sine wave panning left-to-right
- **Dynamic Content**: Work portfolio with expandable cards
- **Self Page**: Bio with revolving point cloud
- **Contact Modal**: Glassmorphism-styled contact form
- **Admin Panel**: React-Admin for content management

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd server && npm install
cd ../admin && npm install
cd ../client && npm install

# 2. Start the backend
cd server && npm start

# 3. Start the client (new terminal)
cd client && npm run dev

# 4. (Optional) Start admin panel (new terminal)
cd admin && npm run dev
```

| Service | URL |
|---------|-----|
| Client | http://localhost:5173 |
| Admin | http://localhost:5174 |
| API | http://localhost:3000 |

## 📁 Project Structure

```
rmzi.world/
├── client/          # React + Three.js frontend
├── admin/           # React-Admin panel
├── server/          # Node.js Express API
├── infrastructure/  # Terraform (AWS S3/ECS)
└── CHANGELOG.md
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Three.js (R3F), Framer Motion, Zustand |
| Admin | React-Admin |
| Backend | Node.js, Express |
| Infrastructure | Terraform (AWS S3, ECS Fargate) |

## ☁️ Deployment

```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

> [!NOTE]
> Ensure AWS credentials are configured before running Terraform.

## 📝 License

MIT
