# MVP Scope: Two Day Build

This document is conceptual by design, but since implementation starts immediately after, here is the recommended cut down scope for a first working smart contract build.

## In Scope for MVP

- **Passport Registry**: register an asset, store issuer, current status, metadata pointer.
- **Event Log**: append basic events (transfer, document added, status change) with timestamp + hash + submitter.
- **Basic Access Control**: a single `ISSUER_ROLE`; only the registered issuer (or admin) can write to a given passport.
- **Read functions**: fetch current passport state and full event history for a given asset ID.

## Explicitly Out of Scope for MVP (Phase 2+)

- Attestation Registry / multi party verification levels
- Delegated write access for platforms
- Soulbound Passport Identity Token
- Cross chain mirroring/bridging
- Dispute resolution workflow
- Full API/SDK layer (MVP can expose raw contract calls; SDK wrapper comes after)

## Why This Cut

The MVP proves the **core mechanic**: a permanent, append only, per asset record with basic access control, without taking on the added complexity of multi party trust (attestations) or cross chain design, both of which are architecturally significant and shouldn't be rushed in a 2 day build.
