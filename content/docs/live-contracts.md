# Live Contracts

{{deployStatus}} The build covers the four core contracts: a passport registry, an append only event log, access control and an attestation registry.

## Addresses

| Contract | Address |
|---|---|
| **Passport Registry** | {{passportRegistry}} |
| **Event Log** | {{eventLog}} |
| **Access Control** | {{accessControl}} |
| **Attestation Registry** | {{attestationRegistry}} |
| **Paxel token** | {{tokenAddress}} |

Access control lives in the Passport Registry. It holds `ISSUER_ROLE`, `VERIFIER_ROLE` and the admin role for every contract.

## Passport Registry

| Function | Who can call it | What it does |
|---|---|---|
| `registerAsset(assetId, metadataURI)` | Holder of `ISSUER_ROLE` | Opens a passport in Draft. The caller becomes its issuer. |
| `publishPassport(assetId)` | The passport's issuer | Moves the passport from Draft to Issued. |
| `updateStatus(assetId, status)` | The passport's issuer or an admin | Sets Active, Frozen, Disputed, Redeemed, Delisted or Defaulted. |
| `getPassport(assetId)` | Anyone | Returns issuer, status, metadata URI and tokenization time. |
| `isIssuerOf(assetId, account)` | Anyone | True while the account is the issuer and still holds `ISSUER_ROLE`. |
| `issuerOf(assetId)` | Anyone | Returns the address that registered the passport. |
| `isVerifier(account)` | Anyone | True while the account holds `VERIFIER_ROLE`. |

## Event Log

| Function | Who can call it | What it does |
|---|---|---|
| `addEvent(assetId, eventType, dataHash)` | The passport's issuer | Appends an entry with type, data hash, submitter and timestamp. |
| `getHistory(assetId)` | Anyone | Returns every entry, oldest first. |
| `historyLength(assetId)` | Anyone | Returns the number of entries. |
| `getHistoryRange(assetId, offset, limit)` | Anyone | Returns one page of entries for long histories. |

Event types are Transfer, Document added, Valuation reference, Status change and Corporate event.

## Attestation Registry

A verifier confirms one passport fact, named by its hash. Usually that is the data hash of a history entry. The evidence hash anchors the verifier's own report, which stays offchain.

| Function | Who can call it | What it does |
|---|---|---|
| `attest(assetId, factHash, evidenceHash)` | Holder of `VERIFIER_ROLE`, never the passport's issuer | Records a signed attestation and returns its id. |
| `revoke(id)` | The verifier who signed it | Marks the attestation revoked. The record stays readable. |
| `verificationLevel(assetId, factHash)` | Anyone | Returns 0 self reported, 1 attested or 2 multi attested. |
| `getAssetAttestations(assetId, offset, limit)` | Anyone | Returns one page of a passport's attestations with their ids. |
| `getFactAttestations(assetId, factHash)` | Anyone | Returns every attestation on one fact. |

Only standing attestations count toward a level. A revoked attestation, or one from a verifier who lost the role, stops counting at once.

No function in any contract deletes or overwrites a passport, an event or an attestation.

## Try It

The [Paxel app](/app) reads any passport without a wallet, with the level of every history entry. Issuers connect a wallet there to register, publish, update status and record events. Verifiers attest and revoke from the verifier console. An asset reference typed as text is hashed with keccak256 into the asset id.
