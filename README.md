# Paxel Contracts

Paxel is a permanent digital passport for tokenized real world assets: the identity, history and
verification layer for those assets. This repo holds the on chain registry and event log.

Every supported asset gets one passport. A passport is opened once by its issuer and never deleted.
Every change is a new entry in an append only history. Nothing is overwritten.

## Contracts

| Contract | Purpose |
| --- | --- |
| `src/PaxelRegistry.sol` | Opens passports and stores issuer, status, metadata URI and tokenization time. Holds the roles. |
| `src/PaxelEventLog.sol` | Append only lifecycle events per asset: event type, data hash, submitter, timestamp. |
| `src/interfaces/IPaxelRegistry.sol` | `isIssuerOf`, the only registry call the event log makes. |

### Roles

- `DEFAULT_ADMIN_ROLE` goes to the deployer. The admin grants and revokes `ISSUER_ROLE` and may call `updateStatus` on any published passport.
- `ISSUER_ROLE` is granted per address by the admin. A holder may register assets. It writes only to passports it registered, and only while it still holds the role.
- Reads need no role.

### PaxelRegistry

| Function | Who | Effect |
| --- | --- | --- |
| `registerAsset(bytes32 assetId, string metadataURI)` | `ISSUER_ROLE` | New passport in `Draft`, caller is issuer. Reverts on a zero id, an empty URI or an existing id. |
| `publishPassport(bytes32 assetId)` | the asset's issuer | `Draft` to `Issued`. |
| `updateStatus(bytes32 assetId, Status newStatus)` | the asset's issuer or an admin | Sets any status except `Draft`. Only on a published passport. |
| `getPassport(bytes32 assetId)` | anyone | Returns the passport. Reverts with `AssetNotFound` for an unknown id. |
| `isIssuerOf(bytes32 assetId, address account)` | anyone | True when `account` is the issuer and still holds `ISSUER_ROLE`. |
| `passports(bytes32 assetId)` | anyone | Public mapping getter. |

Status values: `Draft, Issued, Active, Frozen, Disputed, Redeemed, Delisted, Defaulted` (0 to 7).

### PaxelEventLog

| Function | Who | Effect |
| --- | --- | --- |
| `addEvent(bytes32 assetId, EventType eventType, bytes32 dataHash)` | the asset's issuer (checked through `registry.isIssuerOf`) | Appends one entry. Reverts on a zero data hash. |
| `getHistory(bytes32 assetId)` | anyone | Every entry, oldest first. |
| `historyLength(bytes32 assetId)` | anyone | Number of entries. |
| `getHistoryRange(bytes32 assetId, uint256 offset, uint256 limit)` | anyone | One page of entries, for long histories. |

Event types: `Transfer, DocumentAdded, ValuationReference, StatusChange, CorporateEvent` (0 to 4).

There is no function in either contract that deletes or overwrites a passport or an event.

## Build and test

Requires [Foundry](https://book.getfoundry.sh/).

```bash
git clone --recursive <repo url>
forge build
forge test
```

Tests:

- `test/PaxelRegistry.t.sol` covers registering, publishing, status updates and reads.
- `test/PaxelEventLog.t.sol` covers adding events and reading history.
- `test/PaxelSecurity.t.sol` covers role checks, revocation, duplicate ids and a fuzz pass on `registerAsset` and `addEvent`.

## Deploy

`script/Deploy.s.sol` deploys the registry, then the event log wired to it. It reads:

| Variable | Meaning |
| --- | --- |
| `RPC_URL` | RPC endpoint, passed as `--rpc-url` |
| `PRIVATE_KEY` | Deployer key. The deployer becomes the registry admin. |
| `CHAIN_ID` | Expected chain id. The script stops if the RPC reports another one. |

Copy `.env.example` to `.env`, fill it in, then:

```bash
source .env
forge script script/Deploy.s.sol --rpc-url $RPC_URL
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

The first command only simulates. The second one sends the transactions. The script prints the
addresses and the lines to paste into the web config.

After deploying, grant issuers from the admin key:

```bash
cast send <PaxelRegistry> "grantRole(bytes32,address)" $(cast keccak "ISSUER_ROLE") <issuer> --rpc-url $RPC_URL --private-key $PRIVATE_KEY
```

The script has been run against a local Anvil node only. Mainnet deployment is triggered manually
by the operator.

## Web handoff

Fill `config/contracts.config.js` in the web repo:

```js
export const CONTRACTS = {
  network: "",              // network name
  chainId: "",              // chain id
  tokenAddress: "",         // leave empty, no token yet
  passportRegistry: "",     // PaxelRegistry address
  eventLog: "",             // PaxelEventLog address
  accessControl: "",        // same as passportRegistry, roles live there
  attestationRegistry: ""   // leave empty, not built in this phase
};
```

## Not in this phase

Attestations, delegated write access, a soulbound identity token, cross chain mirroring and any
dispute workflow beyond the status flag are deliberately not implemented.

See `AUDIT.md` for the security checklist.
