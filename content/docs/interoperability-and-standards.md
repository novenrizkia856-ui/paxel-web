# Interoperability & Standards

Paxel's schema and mechanisms are designed to sit *alongside* existing standards, not compete with them.

## Standards Considered as Reference Points

- **Token metadata standards** (e.g. Metaplex Token Metadata and the SPL Token 2022 metadata extension): Paxel's passport metadata is designed to be a superset of what these standards already expect, so platforms already reading token metadata face minimal extra integration work.
- **Permissioned/RWA oriented token standards** (e.g. SPL Token 2022 extensions such as transfer hooks, default account state and permanent delegate): where such standards already define compliance/identity primitives, Paxel references and extends them rather than duplicating them.
- **Decentralized Identifiers (DID)**: a natural fit for representing issuer and verifier identity in a chain agnostic way.
- **Verifiable Credentials (W3C VC)**: a natural fit for representing individual attestations in a portable, standardized format.

## Why This Matters

- **Adoption cost**: platforms that already work with token metadata and identity standards should find Paxel's data shapes familiar, not foreign.
- **Longevity**: building on open standards instead of a proprietary format reduces the risk of the passport format becoming a dead end.

## Cross Chain Posture

Paxel's default model is **one home chain per passport**, Solana, with hash anchored facts that any other chain or platform can independently verify. Full cross chain mirroring/bridging is treated as a future extension, not a day one requirement.
