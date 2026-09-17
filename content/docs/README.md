# Paxel

> A permanent digital passport for tokenized real world assets (RWA).

## The One Line Pitch

Paxel is the **identity, history, and verification layer** for tokenized real world assets, not another marketplace, but the record that every marketplace, custodian, and holder can trust.

## The Problem

Real world assets are tokenized across many platforms, chains, and custodians. Once minted, a token typically carries almost no durable record of *what it actually represents*, *who issued it*, *what happened to it over time*, or *how to verify any of that independently*.

When a token moves, between wallets, platforms, or even chains, its history usually doesn't move with it. Buyers, lenders, and platforms are left trusting whatever the current interface tells them, with no portable way to check it.

## The Idea

Every supported asset gets a **passport**: a permanent, append only record that travels with the asset regardless of where it is traded, held, or displayed. The passport is:

- **Verifiable**: backed by cryptographic anchors and signed attestations, not just a claim in a database.
- **Permanent**: history is never deleted or overwritten, only extended.
- **Portable**: not owned by any single marketplace; any platform can read it, and (with permission) write to it.
- **Dual readable**: a human can open it and understand an asset's story; an application can query it as structured data.

## What Paxel Is

- A **registry + history layer** for tokenized RWA lifecycle data.
- A set of **APIs/SDKs** issuers and RWA platforms use to write and read passport data.
- A **verification framework** so third parties (auditors, custodians, other platforms) can attest to specific facts in a passport.

## What Paxel Is Not

- **Not an RWA marketplace.** Paxel does not list, trade, or price assets.
- **Not a custodian.** It does not hold assets or tokens.
- **Not a valuation oracle.** It references valuations from external sources; it does not produce them.
- **Not a compliance/KYC provider.** It can reference compliance attestations issued elsewhere, but does not perform compliance itself.

## How to Read This Document

This is a **conceptual design document**, written before implementation begins. It defines the mechanism, data model, and system boundaries, not code, contract addresses, or specific tech stack choices. Implementation should follow this document, not the other way around.
