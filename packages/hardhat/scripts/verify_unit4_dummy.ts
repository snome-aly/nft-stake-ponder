import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Starting Unit 4 Verification: Wiring & Permissions");

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // 1. Get Contracts
  // We need to get the addresses from the deployments or just assume they are the latest
  // Since we run on localhost, we can use deployments? Or just hardcode logic if we assume deterministic?
  // Better to use `getContract` which hardhat-deploy plugin enhances or just use ethers (but need address).
  // actually hardhat-deploy usually saves deployments.
  // let's try to get them by name which works if hardhat-deploy is active in "hardhat" network too.

  // Note: locally we might not have 'deployments' available in this script context easily without importing 'hardhat-deploy' machinery
  // But wait, we just ran `yarn deploy` to localhost (default).
  // If we run this script on localhost, it should access them.

  // Actually, let's look at the log addresses or simpler: just use `deployments.get` if possible.
  // But standard scripts don't have `deployments` global.
  // We can use `ethers.getContractAt` with the addresses from the log? No that's manual.
  // We can use `hre.deployments` if we import hre.

  // This requires the script to be run with `hardhat run ... --network localhost` usually
  // Or if we deployed to Hardhat Network, it's in memory... wait.
  // `yarn deploy --reset` was run. If I run a script now, is it the SAME Hardhat Network process?
  // NO. `yarn deploy` starts a process, does stuff, and exits.
  // If it was `localhost` (node running separate), then state persists.
  // If it was `hardhat` (default), state is LOST after command finishes.

  // CRITICAL CHECK:
  // hardhat.config.ts `defaultNetwork` is `localhost`.
  // Did I start a node?
  // I did NOT start a `yarn chain` or `npx hardhat node`.
  // I just ran `yarn deploy`.
  // If `defaultNetwork` is `localhost`, it tries to connect to 127.0.0.1:8545.
  // If no node is running, it usually fails connection.
  // Wait, did it fail?
  // Log said "Deploying to local network...".
  // If no node was running, maybe it fell back to ephemeral hardhat network?
  // Or maybe user has a node running?
  // User info says "Active Document...". Doesn't say if node is running.

  // Logs said: "deploying ... (tx: 0x...)"
  // If it successfully deployed, either a node is running OR it used ephemeral network.
  // If it used ephemeral network, the state is GONE.

  // Let's check `hardhat.config.ts` again.
  // `defaultNetwork: "localhost"`.
  // `localhost: { url: "http://127.0.0.1:8545" ... }`

  // If I run `yarn deploy` and it works, likely a node IS running?
  // OR, Hardhat automatically starting one? No, hardhat doesn't auto-start a persisted node for a command unless it's `hardhat node`.

  // Wait, if I cannot persist state, I cannot verify it in a separate script run.
  // I must run verification as part of the deploy OR usage `hardhat test`.

  // However, `Unit 5` is a "Smoke Test" which is a test file.
  // Test files run their own deployment (using fixture usually).

  // For Unit 4 verification, I should probably write a TEST file that uses `deployments.fixture(["Governance"])`.
  // This ensures checking the state defined by the deploy scripts.

  // Let's do that. Create `test/verify_unit4.test.ts`.

  console.log("⚠️  Skipping script verification, creating a Test file instead to ensure state persistence.");
}

main();
