# Security & Compliance Considerations

## Key Management

- Every write is signed by the writer's key (issuer, verifier, or delegate). Loss or compromise of an issuer's key is a critical risk: multi signature control is recommended for issuer accounts responsible for high value or many assets.
- Verifier keys should be independently rotatable without invalidating past attestations (past attestations reference the key/version active at the time of signing).

## Data Privacy

- Personally identifiable information (PII), such as a natural person's identity behind an "Owner" field, should generally **not** be stored onchain, even hashed, if it could later need to be forgotten (e.g. under GDPR style "right to be forgotten" rules).
- Recommended pattern: onchain stores a reference/hash to an offchain identity record; the offchain record can later be deleted or redacted while the onchain proof of existence remains (proving *that* a record existed at a point in time, without necessarily exposing *what* it said, if properly designed).

## Document Authenticity vs. Availability

- Anchoring a hash guarantees **authenticity** (you can prove a document hasn't changed): it does not guarantee **availability** (the document itself could still become inaccessible if its offchain host disappears). Long term storage strategy for documents is a separate, important decision to make during implementation.

## Regulatory Disclaimer

Paxel is a **data and verification layer**: it does not replace jurisdiction specific legal or regulatory registries, licensed custodianship, or securities law compliance. Where a jurisdiction requires a licensed registry or custodian for a given asset class, Paxel is designed to **reference and complement** that requirement, not substitute for it.
