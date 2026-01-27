# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-01-27

### Added
- 3D text for splash screen ("rmzi" and "enter" button) using Text3D from drei
- Per-letter animation for "rmzi" (individual floating/bobbing like original HTML)
- Interactive T-pose body model on landing page (drag to spin)
- Rotating head model on Self page
- Extracted head.glb from full body model
- Mobile performance optimizations (device detection)

### Changed
- Navigation order: Self → Work → Connect
- Splash screen now fully 3D (removed HTML overlay text)
- T-pose model hidden after entering the experience
- Splash layout: T-pose navel centered in sphere, "rmzi" bottom-left, "enter" below sphere

### Performance
- Mobile: Disable post-processing (chromatic aberration, film grain)
- Mobile: Reduce 3D text geometry complexity (fewer curve/bevel segments)
- Mobile: Lower DPR to [1, 1] instead of [1, 1.5]
- Mobile: Reduce Voronoi background opacity

### Tests
- Updated tests for new liminal color palette
- Added tests for signal toggle, embed state, audio level, enter, and scene state
- 20 tests total, all passing

## [1.1.0] - 2026-01-27

### Added
- Algorithmic reverb with long decay (2-4s) for ambient atmosphere
- Ghost plucks (15% chance) with softer attacks
- Idle interaction hints ("drag", "explore", "scatter") after 5s inactivity
- Fluorescent/liminal color palette
- Soft edges, depth fog, and connecting lines between points
- Chromatic aberration and film grain post-processing (audio-reactive)
- Audio-reactive point size and brightness
- Signal button for continuous wave deformation
- VU meter visualization in dock (green to red)
- Voronoi background pattern (animated, 14-cell density)
- AWS SES email forwarding for hello@rmzi.world

### Changed
- Enhanced delay with more feedback and longer echoes
- Pluck envelope tweaks (longer release based on displacement)
- Drone dynamics with LFOs for volume, panning, and reverb
- Added subtle noise modulation to drone

## [1.0.0] - 2026-01-26

### Added
- Initial project scaffolding for monorepo (`client`, `admin`, `server`, `infrastructure`).
- Terraform configuration for S3 (frontend/admin hosting) and ECS (backend API).
- Node.js Express server with CRUD endpoints for `works` and `bio`.
- React-Admin panel for content management.
- Three.js Interactive Point Cloud Sphere with custom deformation shaders.
- Audio Player with sine wave oscillator and stereo panning.
- Fragmented navigation system (Work, Self, Connect) with Framer Motion transitions.
- "Work" page with dynamic card loading and expansions.
- "Self" page with biological data integration and Revolving Point Cloud placeholder.
- "Connect" modal for email contact.
- Global "Pause" state with dimming and hero text navigation.

### Infrastructure
- VPC, ECR, ECS (Fargate) boilerplate in Terraform.
- S3 Website Hosting configurations.
