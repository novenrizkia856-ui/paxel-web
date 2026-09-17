# Roles & Actors

| Role | Description | Typical permissions |
|---|---|---|
| **Issuer** | The entity that tokenizes the asset and opens its passport | Register asset, add events, update status, attach documents |
| **RWA Platform** | A marketplace/platform integrating Paxel to display or reference passports | Read access by default; write access only if also acting as issuer or granted delegated rights |
| **Verifier / Attestor** | An independent party (auditor, custodian, licensed valuer, oracle) | Submit attestations against specific passport facts |
| **Asset Owner / Token Holder** | Current holder of the tokenized asset | Read own passport; may raise a dispute flag |
| **Admin / Governance** | Maintains the protocol's rules (e.g. approving new issuer categories, resolving disputes) | Configuration level actions only, not day to day data writes |
| **Public / Consumer** | Anyone, no relationship required | Read only access to any passport |

## Why Separate "Issuer" from "Platform"

An issuer is responsible for the asset's truth; a platform is responsible for distribution and user experience. Keeping them separate means:

- A platform can display passports it did not create, without needing write access.
- An asset's passport stays valid and portable even if it later gets listed on a different platform.
- Trust is anchored to the issuer (and verifiers), not to whichever platform happens to be showing the data today.

## Delegated Write Access (Concept)

An issuer can delegate limited write permissions to a platform (e.g. "this platform may log transfer events on my behalf"), but the issuer remains the accountable identity, and any delegated write is recorded as *"written by Platform X, on behalf of Issuer Y."*
