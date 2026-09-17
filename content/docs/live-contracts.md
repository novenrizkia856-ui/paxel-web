# Live Contracts

The first Paxel build is live on **{{network}}** (chain id {{chainId}}). It implements the MVP scope: a passport registry, an append only event log and basic access control.

## Addresses

| Contract | Address |
|---|---|
| **Passport Registry** | [`{{passportRegistry}}`]({{explorer}}/address/{{passportRegistry}}) |
| **Event Log** | [`{{eventLog}}`]({{explorer}}/address/{{eventLog}}) |
| **Access Control** | Roles live in the Passport Registry: [`{{accessControl}}`]({{explorer}}/address/{{accessControl}}) |

The Attestation Registry and a Paxel token are not deployed in this phase.

## Passport Registry

| Function | Who can call it | What it does |
|---|---|---|
| `registerAsset(assetId, metadataURI)` | Holder of `ISSUER_ROLE` | Opens a passport in Draft. The caller becomes its issuer. |
| `publishPassport(assetId)` | The passport's issuer | Moves the passport from Draft to Issued. |
| `updateStatus(assetId, status)` | The passport's issuer or an admin | Sets Active, Frozen, Disputed, Redeemed, Delisted or Defaulted. |
| `getPassport(assetId)` | Anyone | Returns issuer, status, metadata URI and tokenization time. |
| `isIssuerOf(assetId, account)` | Anyone | True while the account is the issuer and still holds `ISSUER_ROLE`. |

## Event Log

| Function | Who can call it | What it does |
|---|---|---|
| `addEvent(assetId, eventType, dataHash)` | The passport's issuer | Appends an entry with type, data hash, submitter and timestamp. |
| `getHistory(assetId)` | Anyone | Returns every entry, oldest first. |
| `historyLength(assetId)` | Anyone | Returns the number of entries. |
| `getHistoryRange(assetId, offset, limit)` | Anyone | Returns one page of entries for long histories. |

Event types are Transfer, Document added, Valuation reference, Status change and Corporate event. No function in either contract deletes or overwrites a passport or an event.

## Try It

The [Paxel app](/app) reads any passport without a wallet. Issuers connect a wallet there to register, publish, update status and record events. An asset reference typed as text is hashed with keccak256 into the asset id.
