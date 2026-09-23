# Solana Program Design (Conceptual)

This section describes program level **responsibilities**, not code. It's meant to guide implementation, not replace it.

On Solana, logic lives in **programs** and state lives in **accounts**. Each component below maps to a set of program instructions and account types, typically program derived addresses (PDAs) seeded by the asset ID.

## Core Components

### 1. Passport Registry
- Source of truth for: does a given asset ID have a passport, who is its issuer, what is its current status, and a pointer to its metadata.
- Minimal onchain state: one passport account per asset ID, optimized to answer "does this exist and what's its current state," not to store history.

### 2. Event / History Log
- Append only. Every lifecycle event (transfer, valuation reference, document added, status change, corporate/asset event) is written here as a discrete, timestamped entry signed by the submitter's wallet.
- Entries live in their own accounts keyed by asset ID and index, so the full history of a passport can always be reconstructed by reading them in order.

### 3. Access Control
- Role based: `ISSUER_ROLE`, `VERIFIER_ROLE`, `ADMIN_ROLE`, and optionally `DELEGATE_ROLE` for platforms writing on an issuer's behalf.
- Roles are held in role accounts that the Registry and Event Log instructions check before writing: they do not themselves store passport content.

### 4. Attestation Registry
- Where verifiers publish signed attestations that reference a specific passport, a specific event/fact, and their own verifier identity.
- Kept as a separate account type (or program) so verification can be added *after* a passport exists, without needing to modify the passport itself.

## Optional: Passport Identity Token

A non transferable ("soulbound style") token can represent the *passport itself*, separate from the underlying RWA token. On Solana this maps naturally to a Token 2022 mint with the non transferable extension. It gives the passport its own permanent onchain address, which:

- Lets other programs reference "this passport" directly, independent of which RWA token mint is currently wrapping the asset.
- Survives even if the underlying token is reminted, rewrapped, or bridged.

## Key Design Tensions to Resolve During Implementation

- **Permanence vs. upgradability**: Solana programs are upgradable by their upgrade authority. The registry's accounts must outlive program upgrades, so account layouts need explicit versioning, and the upgrade authority should move to a multisig or be revoked once the design settles.
- **Rent and compute vs. completeness**: every byte stored in an account needs a rent exempt SOL deposit, and every instruction runs within a compute budget; the schema in [Data Model](data-model.md) already reflects a hash and pointer approach to keep this manageable.
- **Cross chain reach**: if a passport needs to be referenced from a chain other than Solana, this requires either a bridging/attestation mechanism or a read only mirror; this document intentionally leaves that as a Phase 2 decision (see [MVP Scope](mvp-scope.md)).
