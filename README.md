# NomadPi

A monorepo for managing WireGuard VPN configurations on AWS instances.

## Features

- User authentication and management
- Device registration and configuration
- WireGuard configuration file generation and download
- AWS integration for VPN management

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.0.0 or later)
- MongoDB
- AWS Account with configured WireGuard instance

## Project Structure

```
.
├── apps/
│   ├── api/          # Express.js API server
│   └── web/          # Next.js web application
├── packages/
│   └── shared/       # Shared types and utilities
└── package.json      # Workspace configuration
```

## Setup Instructions

1. Install root dependencies and setup workspaces:
   ```bash
   bun install
   ```

2. Configure environment variables:
   ```bash
   # API environment
   cd apps/api
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Build shared packages:
   ```bash
   cd packages/shared
   bun run build
   ```

4. Start development servers:
   ```bash
   # From root directory, start all services
   bun dev
   
   # Or start services individually:
   cd apps/api && bun dev    # API server
   cd apps/web && bun dev    # Web interface
   ```

The API will run on http://localhost:5000 and the web interface on http://localhost:3000

## Development

From the root directory:
- Start all services: `bun dev`
- Build all packages: `bun run build`
- Lint all packages: `bun run lint`

Or work on individual packages:
- API: `cd apps/api && bun dev`
- Web: `cd apps/web && bun dev`
- Shared: `cd packages/shared && bun run build`

## License

MIT License - See LICENSE file for details
