# PDMS Electron App

Electron shell for the PDMS / Dewey DM webapp. Serves a pre-built Angular application within an Electron window.

## Prerequisites
- Node.js 20+ (Electron 41.3.0 requires Node 18+)
- npm 10+
- macOS, Windows, or Linux

## Development Workflow
Before you start development, run 'npm i' in both this directory and the webapp directory.

Then, there are 4 npm commands
```bash
npm run build:webapp  # Just builds the webapp
npm run build  # Builds the webapp and the electron app
npm run start  # Builds the webapp, the electron app, and runs electron
npm run package  # Generates a desktop app executable
```

