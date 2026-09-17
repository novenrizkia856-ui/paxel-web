# Trust & Verification Model

Paxel's core promise is that passport data can be checked, not just read. This is achieved through four mechanisms.

## 1. Cryptographic Anchoring

Every document and every offchain data blob is hashed, and the hash is recorded onchain. Anyone can rehash the original content and confirm it matches, proving the content hasn't been altered since it was anchored.

## 2. Signed Attestations

Every write to a passport is signed by the identity making the claim (issuer, verifier, or delegated platform). This means every fact in a passport carries an answer to *"who said this, and can I check their signature?"*

## 3. Append Only Event Sourcing

Nothing is overwritten. A correction is a new, signed event that explicitly references what it amends. This makes it impossible to quietly rewrite history: the old claim and the correction both remain visible.

## 4. Verification Levels

Not all facts carry the same weight. Conceptually, each fact can carry a verification level:

| Level | Meaning |
|---|---|
| **L0: Self reported** | Asserted only by the issuer, no independent check |
| **L1: Attested** | Confirmed by at least one independent verifier |
| **L2: Multi attested** | Confirmed by multiple independent verifiers (e.g. auditor + custodian) |

A passport's overall "trust score" is not a single number Paxel invents: it's a transparent breakdown of which facts are L0/L1/L2, so consumers can decide their own risk tolerance.

## Disputes

A dispute doesn't delete or hide the disputed fact: it adds a **Disputed** status flag alongside it, with a reference to the dispute claim. Resolution (upheld, overturned, withdrawn) is itself recorded as a further event, keeping the entire disagreement auditable.
