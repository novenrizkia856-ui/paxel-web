# Overview

## Vision

A tokenized real world asset should carry its own verifiable identity and history for as long as it exists, independent of which platform is currently displaying it.

## Problem Statement

- RWA tokenization today is **platform centric**: each issuer/platform keeps its own records, in its own format, often offchain in a private database.
- There is no shared, neutral place to answer: *Is this really the asset it claims to be? Who issued it? What has happened to it since?*
- When platforms shut down, migrate, or get replaced, asset history is at risk of being lost.
- Buyers, lenders, and secondary platforms currently have no standard way to independently verify an asset's claims before relying on them.

## Goals

- Give every supported tokenized asset a **permanent, portable passport**.
- Make that passport **verifiable** rather than merely descriptive.
- Make it usable by **both humans** (a readable record) **and machines** (a queryable API/data structure).
- Let **any issuer or RWA platform** integrate via a common interface, instead of Paxel integrating one by one with every platform's internal format.

## Non Goals

- Paxel does **not** try to be a trading venue, custodian, or price oracle.
- Paxel does **not** try to enforce legal ownership: it **records** ownership and transfer claims and their evidence, and leaves legal enforceability to the applicable jurisdiction and the issuer's own legal wrapper.
- Paxel does **not** try to replace regulatory registries; it complements them by making the data those registries rely on easier to verify and reference.

## Target Users

| User | What they get from Paxel |
|---|---|
| **Issuers** (RWA originators) | A durable, verifiable record for every asset they tokenize |
| **RWA Platforms / Marketplaces** | A trust layer they can plug into instead of building their own from scratch |
| **Verifiers / Auditors** | A place to publish attestations that persist and are checkable by anyone |
| **Investors / Token holders** | A way to independently verify an asset before and after holding it |
| **Other protocols** (lending, insurance) | A reliable data source to price risk against |
