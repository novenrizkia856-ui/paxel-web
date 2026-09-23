# Glossary

| Term | Meaning |
|---|---|
| **Passport** | The permanent, append only record for a single tokenized asset |
| **Issuer** | The entity that tokenizes an asset and opens its passport |
| **RWA** | Real World Asset: a physical or offchain financial asset represented onchain via a token |
| **Verifier / Attestor** | An independent party that confirms specific facts in a passport |
| **Attestation** | A signed statement by a verifier confirming a specific passport fact |
| **Append only** | A record keeping style where nothing is deleted or overwritten, only added to |
| **Hash Anchoring** | Recording the cryptographic hash of offchain content onchain, to prove later that the content hasn't changed |
| **Home Chain** | The blockchain where a passport's registry entry canonically lives. For Paxel, this is Solana |
| **Program** | Onchain code on Solana. Paxel's registry, event log and access control are program instructions |
| **Program Derived Address (PDA)** | An account address derived from a program ID and seeds, such as an asset ID, that only that program can sign for |
| **SPL Token** | The Solana token standard. A token is identified by its mint address |
| **Transaction Signature** | The unique ID of a Solana transaction, used to look it up in an explorer |
| **Soulbound Token (SBT)** | A non transferable token, here proposed as an optional way to give a passport its own permanent onchain identity. On Solana, a Token 2022 mint with the non transferable extension |
| **DID** | Decentralized Identifier: a standard for chain agnostic identity |
| **Verifiable Credential (VC)** | A W3C standard for portable, cryptographically verifiable claims |
