# Data Model

Every passport is built from the same set of sections. Below is what each contains, conceptually, and where it "lives" (onchain vs. offchain).

> Storage split principle: **onchain stores proofs and pointers; offchain stores the actual content.** This keeps passports cheap to maintain and lets large documents/history grow without bloating the chain.

| Section | Contains | Typical storage |
|---|---|---|
| **Asset Identity** | Unique passport ID, asset type/category, jurisdiction, description, linked token contract(s) & chain(s) | Hash/pointer onchain, full detail offchain |
| **Issuer** | Issuer identifier, issuer verification status, registration references | Onchain identifier + offchain profile |
| **Tokenization Date** | Date and reference of the original tokenization event | Onchain event |
| **Ownership** | Current holder reference, custody model (self custody / custodial / fractional) | Onchain pointer; PII kept offchain if any |
| **Transfers** | Log of transfer events: from, to, timestamp, transaction reference | Onchain event log |
| **Valuation References** | Pointers to valuation reports/oracles: source, date, value, methodology reference | Offchain content, onchain hash + timestamp |
| **Supporting Documentation** | Legal docs, appraisals, insurance, certificates, all hash anchored | Offchain storage (content addressed), onchain hash |
| **Status Changes** | Active, Frozen, Disputed, Redeemed, Delisted, Defaulted, etc. | Onchain state + event log |
| **Corporate/Asset Events** | Dividends, coupon payments, maturity, redemption, physical incidents, fractional consolidation | Onchain event log, details offchain if large |

## Design Principles for the Schema

- **Extensible, not fixed.** New asset types (real estate, invoices, commodities, credit) will need extra fields: the schema should allow per asset type extensions without breaking the core.
- **Every field has a source.** Nothing is just "typed in": every field records *who asserted it* and *when*.
- **Every document is hash anchored.** The raw file can live anywhere offchain; what matters is that its hash is permanently recorded, so its authenticity is checkable forever, even if the original hosting disappears.
- **Human labels + machine codes.** Status and event types have both a human readable label ("Redeemed") and a stable machine code (`STATUS_REDEEMED`) so integrations don't break if the label text changes.
