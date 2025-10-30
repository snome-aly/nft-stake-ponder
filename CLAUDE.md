# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Scaffold-ETH 2** (SE-2) project - a full-stack dApp development toolkit for Ethereum. It's a Yarn workspaces monorepo with three main packages:

1. **hardhat** (`packages/hardhat/`) - Solidity smart contract development, testing, and deployment
2. **nextjs** (`packages/nextjs/`) - React frontend using Next.js App Router (not Pages Router)
3. **ponder** (`packages/ponder/`) - Event indexing and GraphQL API for blockchain data

**Tech Stack:** Next.js, RainbowKit, Wagmi, Viem, Hardhat, Ponder, TypeScript

## Common Commands

### Development Workflow
```bash
# Start local blockchain
yarn chain

# Deploy contracts (requires chain to be running)
yarn deploy

# Start frontend (http://localhost:3000)
yarn start

# Start Ponder indexer (http://localhost:42069)
yarn ponder:dev
```

### Hardhat Commands
```bash
# Compile contracts
yarn hardhat:compile

# Run tests with gas reporting
yarn hardhat:test

# Type checking
yarn hardhat:check-types

# Format Solidity and TypeScript
yarn hardhat:format

# Lint
yarn hardhat:lint

# Clean artifacts
yarn hardhat:clean

# Verify on Etherscan
yarn hardhat:verify
```

### Next.js Commands
```bash
# Development server
yarn next:dev  # or yarn start

# Production build
yarn next:build

# Type checking
yarn next:check-types

# Format
yarn next:format

# Lint
yarn next:lint
```

### Ponder Commands
```bash
# Development mode (indexing + GraphQL server)
yarn ponder:dev

# Generate TypeScript types from schema
yarn ponder:codegen

# Production indexing
yarn ponder:start

# Production API server only
yarn ponder:serve

# Type checking
yarn ponder:typecheck
```

### Account Management
```bash
# Generate new deployer account
yarn account:generate

# Import existing account
yarn account:import

# View account details
yarn account
```

## Architecture

### Smart Contract Development (Hardhat)

- **Contracts:** `packages/hardhat/contracts/`
- **Deploy Scripts:** `packages/hardhat/deploy/` - Uses hardhat-deploy plugin with numbered files (e.g., `00_deploy_your_contract.ts`)
- **Tests:** `packages/hardhat/test/`
- **Config:** `packages/hardhat/hardhat.config.ts`

When modifying deployment scripts, ensure the deploy function exports include tags for proper deployment ordering.

### Frontend (Next.js)

- **App Router:** `packages/nextjs/app/` - Uses Next.js 15 App Router architecture
- **Scaffold Config:** `packages/nextjs/scaffold.config.ts` - Configure target networks, RPC endpoints, and wallet settings
- **Contract Definitions:**
  - `packages/nextjs/contracts/deployedContracts.ts` - Auto-generated from deployments
  - `packages/nextjs/contracts/externalContracts.ts` - Manually define external contracts
- **Hooks:** `packages/nextjs/hooks/scaffold-eth/` - Custom React hooks for contract interactions
- **Components:** `packages/nextjs/components/scaffold-eth/` - Reusable Web3 components

**Important:** The frontend uses the **App Router**, not Pages Router. All routing and page components should follow App Router conventions.

### Ponder Event Indexing

- **Config:** `packages/ponder/ponder.config.ts` - Automatically syncs with deployed contracts and target network from `scaffold.config.ts`
- **Schema:** `packages/ponder/ponder.schema.ts` - Define database schema using Ponder's onchainTable API
- **Indexers:** `packages/ponder/src/` - Event handlers named after contracts (e.g., `YourContract.ts`)
- **GraphQL API:** Runs on http://localhost:42069 in dev mode

Ponder automatically reads from `deployedContracts.ts` and the first network in `scaffoldConfig.targetNetworks`. When contracts are deployed, Ponder config updates automatically.

### Contract Interaction Patterns

**CRITICAL: Always use Scaffold-ETH hooks for contract interactions. Never use raw wagmi/viem calls.**

#### Reading Contract Data
```typescript
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const { data } = useScaffoldReadContract({
  contractName: "YourContract",
  functionName: "greeting",
  args: [], // optional
});
```

#### Writing to Contracts
```typescript
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const { writeContractAsync } = useScaffoldWriteContract("YourContract");

// Later in your code
await writeContractAsync({
  functionName: "setGreeting",
  args: ["Hello World"],
  value: parseEther("0.1"), // optional for payable functions
});
```

#### Reading Events
```typescript
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const { data: events } = useScaffoldEventHistory({
  contractName: "YourContract",
  eventName: "GreetingChange",
  watch: true, // optional - live updates
});
```

### Display Components

Always use Scaffold-ETH components for blockchain data:
- `Address` - Display Ethereum addresses
- `AddressInput` - Input field for addresses with ENS support
- `Balance` - Display ETH/USDC balance
- `EtherInput` - Number input with ETH/USD conversion

Located in `packages/nextjs/components/scaffold-eth/`

## Development Flow

1. Write smart contracts in `packages/hardhat/contracts/`
2. Update deployment script in `packages/hardhat/deploy/` if needed
3. Deploy: `yarn deploy`
4. Visit `http://localhost:3000/debug` to interact with contracts via auto-generated UI
5. Write tests in `packages/hardhat/test/`
6. Define Ponder schema in `packages/ponder/ponder.schema.ts`
7. Create event indexers in `packages/ponder/src/`
8. Build custom UI using SE-2 hooks and components
9. Query indexed data using GraphQL (`@tanstack/react-query` + `graphql-request`)

## Environment Variables

- `NEXT_PUBLIC_ALCHEMY_API_KEY` - Alchemy API key for RPC
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - WalletConnect project ID
- `NEXT_PUBLIC_PONDER_URL` - Production Ponder API endpoint
- `PONDER_RPC_URL_{CHAIN_ID}` - RPC URL for Ponder indexing

## Testing

- **Hardhat tests:** `yarn hardhat:test` - Uses Chai matchers with gas reporting
- Tests must be in `packages/hardhat/test/` with `.ts` extension
- Use `@nomicfoundation/hardhat-chai-matchers` for contract assertions

## Deployment

### Smart Contracts
```bash
# Deploy to live network (configured in hardhat.config.ts)
yarn deploy --network sepolia

# Verify on Etherscan
yarn verify --network sepolia
```

### Frontend
```bash
# Deploy to Vercel
yarn vercel

# Deploy to IPFS
yarn ipfs
```

### Ponder
Set custom start command to `yarn ponder:start` in your hosting platform, then configure `NEXT_PUBLIC_PONDER_URL` for the frontend.

## Key Constraints

- Node version: >= 20.18.3
- Package manager: Yarn (v3.2.3)
- Frontend routing: Next.js App Router only (no Pages Router)
- Contract interactions: Must use Scaffold-ETH hooks (`useScaffoldReadContract`, `useScaffoldWriteContract`, `useScaffoldEventHistory`)
- Never use raw `wagmi`/`viem` calls when SE-2 hooks are available
