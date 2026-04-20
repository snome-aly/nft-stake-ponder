# NFT Staking Platform

A full-stack decentralized NFT staking platform built on Scaffold-ETH 2. Users can mint blind-box NFTs, stake them to earn ERC-20 reward tokens, and participate in on-chain governance — all from a single interface.

## Features

- **Blind-Box NFT Minting** — 100 total supply with four rarity tiers (Common / Rare / Epic / Legendary) distributed via a shuffle algorithm. Rarity is revealed after mint using Chainlink VRF for provably fair randomness.
- **NFT Staking** — Stake your NFTs to earn `RWRD` tokens. Reward multipliers scale with rarity.
- **Reward Token (RWRD)** — ERC-20 with `ERC20Votes` support, zero initial supply, minted exclusively through staking. Supports gasless approvals via ERC-2612 Permit.
- **On-Chain Governance** — `MyGovernor` (OpenZeppelin Governor) + `Timelock` controller. RWRD token holders can propose and vote on protocol changes.
- **Event Indexing** — Ponder indexer tracks staking/unstaking/reward events and exposes a GraphQL API for the frontend.

## Smart Contracts

| Contract | Description |
|---|---|
| `StakableNFT` | ERC-721 blind-box NFT with Chainlink VRF rarity reveal, role-based access (Admin / Operator / Pauser), batch mint (0.001 ETH each, max 20 per wallet) |
| `NFTStakingPool` | Staking pool with rarity-weighted reward emission, pause/unpause support |
| `RewardToken` | ERC-20 governance token minted by the staking pool |
| `MyGovernor` | OpenZeppelin Governor with 4% quorum, 1-block voting delay, 50-block voting period |
| `Timelock` | TimelockController for time-delayed execution of governance proposals |

## Tech Stack

- **Smart Contracts** — Solidity 0.8.20, Hardhat, OpenZeppelin, Chainlink VRF
- **Frontend** — Next.js 15 (App Router), RainbowKit, Wagmi, Viem, TypeScript
- **Indexer** — Ponder (GraphQL API at `localhost:42069`)
- **Package Manager** — Yarn workspaces (v3)

## Prerequisites

- Node.js >= 20.18.3
- Yarn v3
- Git

## Quick Start

**1. Install dependencies**

```bash
yarn install
```

**2. Start a local blockchain**

```bash
yarn chain
```

**3. Deploy contracts** (new terminal)

```bash
yarn deploy
```

**4. Start the frontend** (new terminal)

```bash
yarn start
```

Visit `http://localhost:3000`. Use the **Debug Contracts** page at `/debug` to interact with contracts directly.

**5. Start the Ponder indexer** (new terminal, optional)

```bash
yarn ponder:dev
```

GraphQL playground available at `http://localhost:42069`.

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/mint` | Mint blind-box NFTs |
| `/my-nfts` | View your NFT collection and rarity |
| `/stake` | Stake / unstake NFTs, claim rewards |
| `/governance` | Browse and vote on governance proposals |
| `/admin` | Admin panel (operator / pauser roles only) |
| `/stats` | Protocol-level statistics from the Ponder indexer |
| `/debug` | Scaffold-ETH auto-generated contract debugger |

## Development Commands

```bash
# Hardhat
yarn hardhat:compile        # Compile contracts
yarn hardhat:test           # Run tests with gas report
yarn hardhat:check-types    # TypeScript type check

# Next.js
yarn next:build             # Production build
yarn next:check-types       # TypeScript type check
yarn next:lint              # Lint

# Ponder
yarn ponder:dev             # Dev mode (indexing + GraphQL)
yarn ponder:codegen         # Generate types from schema
yarn ponder:typecheck       # TypeScript type check
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Alchemy RPC key |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID |
| `NEXT_PUBLIC_PONDER_URL` | Deployed Ponder API endpoint (production) |
| `PONDER_RPC_URL_{CHAIN_ID}` | RPC URL used by the Ponder indexer |

## Deployment

### Contracts

```bash
yarn deploy --network sepolia
yarn hardhat:verify --network sepolia
```

### Frontend

```bash
yarn vercel     # Deploy to Vercel
yarn ipfs       # Deploy to IPFS
```

### Ponder Indexer

Set the custom start command to `yarn ponder:start` on your hosting platform, then set `NEXT_PUBLIC_PONDER_URL` in the frontend environment.

## Project Structure

```
packages/
  hardhat/
    contracts/        # Solidity contracts
    deploy/           # Deployment scripts (hardhat-deploy)
    test/             # Contract tests
  nextjs/
    app/              # Next.js App Router pages
    components/       # Reusable UI components (Scaffold-ETH)
    hooks/            # Scaffold-ETH contract interaction hooks
    contracts/        # Auto-generated ABI / address files
  ponder/
    ponder.config.ts  # Auto-synced from scaffold.config.ts
    ponder.schema.ts  # Database schema (onchainTable API)
    src/              # Event indexing handlers
```

## Contributing

PRs and issues are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
