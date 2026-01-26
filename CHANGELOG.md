# Changelog

All notable changes to this project will be documented in this file.

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
