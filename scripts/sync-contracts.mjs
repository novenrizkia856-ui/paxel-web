// Copies the deployed contract addresses into config/contracts.config.js.
//
//   npm run contracts:sync                 reads ../paxel-contracts/deployments/mainnet.json
//   npm run contracts:sync -- <file.json>  reads another deployments file
//
// The deployments file is written by paxel-contracts/script/Deploy.s.sol after a broadcast.
// Only the address and deploy block lines change. The token CA stays in config/token.js.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, process.argv[2] ?? "../paxel-contracts/deployments/mainnet.json");
const target = join(root, "config/contracts.config.js");

const deployment = JSON.parse(readFileSync(source, "utf8"));
const isAddress = (value) => /^0x[0-9a-fA-F]{40}$/.test(String(value ?? ""));

if (String(deployment.chainId) !== "4663") throw new Error(`Expected Robinhood Chain (4663), got chain id ${deployment.chainId}`);
for (const key of ["passportRegistry", "eventLog", "accessControl", "attestationRegistry"]) {
  if (!isAddress(deployment[key])) throw new Error(`${key} is missing or not a 0x address in ${source}`);
}

const values = {
  chainId: String(deployment.chainId),
  passportRegistry: deployment.passportRegistry,
  eventLog: deployment.eventLog,
  accessControl: deployment.accessControl,
  attestationRegistry: deployment.attestationRegistry,
  deployBlock: String(deployment.deployBlock ?? ""),
};

let config = readFileSync(target, "utf8");
for (const [key, value] of Object.entries(values)) {
  const line = new RegExp(`^(  ${key}: )"[^"]*",$`, "m");
  if (!line.test(config)) throw new Error(`Could not find the ${key} line in config/contracts.config.js`);
  config = config.replace(line, `$1"${value}",`);
}
writeFileSync(target, config);

console.log(`Synced ${source}`);
for (const [key, value] of Object.entries(values)) console.log(`  ${key.padEnd(20)} ${value}`);
