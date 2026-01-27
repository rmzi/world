# rmzi.world

[![Live Site](https://img.shields.io/badge/🌐_Live-rmzi.world-black?style=flat-square)](https://rmzi.world)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org)
[![AWS](https://img.shields.io/badge/AWS-S3_+_CloudFront-FF9900?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?style=flat-square&logo=terraform&logoColor=white)](https://terraform.io)

An interactive audiovisual experience and personal portfolio site featuring a physics-driven point cloud sphere, generative audio, and a liminal space aesthetic.

![rmzi.world preview](https://rmzi.world/og-image.png)

## ✨ Features

### 🎨 Visual Experience
- **Interactive Point Cloud Sphere** - 500 points with spring physics, deforms under touch/mouse
- **Animated Voronoi Background** - Organic cell pattern with subtle movement
- **Connecting Lines** - Threads between points and to center create web-like structure
- **Displacement Color Mapping** - Points shift color based on deformation stress
- **Post-Processing Effects** - Chromatic aberration and film grain reactive to audio
- **3D Typography** - Animated letterforms on splash screen

### 🔊 Generative Audio
- **Ambient Drone** - Layered sine oscillators with LFO modulation for breathing texture
- **Pluck Sounds** - Pentatonic scale triggered by point displacement
- **Audio-Visual Sync** - Visual parameters map to audio (color → timbre, stroke → delay)
- **Dynamic Limiter** - Prevents peaking with real-time level monitoring

### 📄 Content Pages
- **Self** - Bio with interactive 3D head model (drag to spin)
- **Work** - Accordion of Lot Radio DJ mixes with YouTube embeds
- **Connect** - Mailto contact form

### 🎛️ Interactive Controls
- **Shuffle** - Randomize visual parameters
- **Scatter** - Trigger wave deformations across the sphere
- **Signal** - Toggle continuous generative deformation
- **Leva Panel** - Hidden debug controls (top-right gear icon)

## 🚀 Quick Start

```bash
# Install dependencies
make install

# Start dev server (http://localhost:5173)
make dev

# Run tests
make test
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| 3D Graphics | Three.js, React Three Fiber, Drei |
| Animation | Framer Motion |
| State | Zustand |
| Audio | Web Audio API |
| Styling | CSS Variables, Glassmorphism |
| Testing | Vitest |
| Hosting | AWS S3 + CloudFront |
| DNS/SSL | AWS Route53 + ACM |
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

Builds the client, syncs to S3, and invalidates CloudFront cache.

## 📁 Project Structure

```
rmzi.world/
├── client/                 # React + Three.js frontend
│   ├── public/             # Static assets (fonts, models, images)
│   └── src/
│       ├── components/     # Scene, PointCloudSphere, Overlay, AudioPlayer
│       ├── pages/          # Self, Work, Connect views
│       ├── store.js        # Zustand state management
│       └── data.js         # Static content (bio, works)
├── infrastructure/         # Terraform (S3, CloudFront, Route53, SES)
├── CHANGELOG.md            # Version history
└── Makefile                # Build & deploy commands
```

## 🎵 Audio Architecture

```
Oscillators (A1 + sub) → Filter → Gain → Panner ─┐
                                                  ├→ Delay Network → Limiter → Output
Pluck Generator → Envelope → Gain ───────────────┘
                                                  
LFOs modulate: volume (breath), pan, filter cutoff, delay time
```

## 📝 License

MIT © [rmzi](https://github.com/rmzi)
