## AffidBlock - Decentralized Affidavit Management System

## Overview

AffidBlock is a full-stack web application built with Next.js, integrating blockchain technology for secure, tamper-proof affidavit management. It lets users create, verify, and store affidavits with on-chain proofs to ensure immutability and transparency. The frontend uses React + TypeScript and Tailwind CSS. Smart contracts and blockchain tooling live in the /blockchain folder.

This repository was developed as a Final Year Project (FYP). Update the project/author fields below as needed.

## Features

- Affidavit creation, signing and upload
- On-chain verification via Solidity smart contracts
- Status tracking (pending, verified, notarized) using events
- Wallet login / connection (MetaMask)
- Search and verify affidavits by hash or ID
- Responsive UI built with Tailwind CSS

## Tech stack

- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
- Blockchain: Ethers.js + Hardhat (contracts in /blockchain)
- Backend: Next.js API routes and middleware
- Database: Optional (see .env variables) — this repo contains MongoDB dependencies but DB usage depends on your deployment

## Prerequisites

- Node.js 18+ (LTS recommended)
- Git
- A Web3 wallet for development (MetaMask)
- A package manager: pnpm is available (this repo contains pnpm-lock.yaml), npm and yarn also work
- Recommended editor: VS Code with TypeScript, Tailwind and ESLint extensions

For blockchain testing you may want a testnet RPC (e.g., Sepolia) and test funds from a faucet.

## Installation

1) Clone this repository:

    git clone https://github.com/mistershah-numl/Affdiblock_Vercel.git
    cd Affdiblock_Vercel

2) Install dependencies (choose one):

    - pnpm (recommended, lockfile present):

        pnpm install

    - npm:

        npm install

    - yarn:

        yarn install

3) Environment variables

This repo does not include a .env.example file. Create a local env file at .env.local with the values your deployment requires. Example variables used by the project:

    # Next.js
    NEXTAUTH_SECRET=your-super-secret-key
    NEXTAUTH_URL=http://localhost:3000

    # Blockchain
    ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your-infura-project-id
    CONTRACT_ADDRESS=0xYourDeployedContractAddress
    PRIVATE_KEY=your-wallet-private-key  # ONLY use test keys in development

    # Database (if applicable)
    DATABASE_URL=postgresql://user:pass@localhost:5432/affidblock

    # External APIs
    INFURA_PROJECT_ID=your-infura-id

On Windows PowerShell you can create a copy like:

    Copy-Item .\env.example .\.env.local  # if you add an env example file later

Security note: Never commit .env.local or private keys. Use secret managers in production.

4) Build blockchain contracts (if you need to compile/deploy locally):

    cd blockchain
    pnpm install   # or npm install
    npx hardhat compile
    cd ..

Deploy contracts to a testnet and update CONTRACT_ADDRESS in .env.local when ready.

## Running the project

Development (hot reload):

    pnpm dev
    # or: npm run dev

Open http://localhost:3000 and connect a wallet for blockchain features.

Production build:

    pnpm build && pnpm start
    # or: npm run build && npm start

## Available scripts (from package.json)

Only scripts present in package.json are listed here. If you need a type-check script, you can add it.

- dev — Run in development mode (next dev)
- build — Build for production (next build)
- start — Run production server (next start)
- lint — Run ESLint (next lint)

To add a TypeScript-only check script, add this to package.json scripts:

    "type-check": "tsc --noEmit"

## Troubleshooting

- Port in use: change port or kill the process using it
- Dependency issues: delete node_modules and reinstall with the package manager you use (pnpm, npm, or yarn)
- Blockchain errors: verify RPC URL, contract address, and that the contract is deployed on the same chain
- Tailwind not applying: ensure tailwind.config.js and globals.css are set and restart dev server

## Deployment

Vercel (recommended for Next.js):

1. Install Vercel CLI if you like: pnpm add -g vercel or npm i -g vercel
2. Run vercel in the project root and follow prompts
3. Add env vars in the Vercel dashboard and deploy vercel --prod

Docker example (optional): adapt if you use pnpm in production

    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production
    COPY . .
    RUN npm run build
    EXPOSE 3000
    CMD ["npm", "start"]

## Contributing

Fork, branch, commit, push, and open a PR. Run pnpm lint (or npm run lint) before submitting.

## License

This project is licensed under the MIT License — add a LICENSE file if missing.

---

*Last Updated: November 05, 2025*

---

