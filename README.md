# AccessFi

**A Privacy-First Internet-Verifiable Data Marketplace**

AccessFi is an internet-verifiable market where sellers prove they own data (like emails) using zero-knowledge proofs and get paid instantly, while buyers receive cryptographically verified data tokens. Sensitive recipient data is encrypted inside a Phala TEE (CVM) and decryptable only by the token owner via wallet signature.

## The Problem

Companies currently buy data from shady brokers or scrape it without permission. They cannot verify data authenticity without accessing personal information. Users get zero reward for their own data, and privacy is constantly leaked.

## How AccessFi Works

1. **Sellers** upload a `.eml` file; zkEmail generates a proof locally in the browser.
2. **Recipient email** is encrypted inside Phala TEE and stored as an `encryptedCID`.
3. **zkVerify** validates proofs on Horizen testnet; AccessFi contracts verify and pay sellers.
4. **Data tokens (ERC-721)** are minted and transferred to buyers, who can decrypt via wallet signature.

Proof types are identified on-chain as `bytes32` IDs, while their human-readable details (title, description, blueprint ID) live off-chain in the app database. Buyers can choose existing proof templates or create a custom zkEmail template and optionally make it public.

## Key Components

- **Smart Contracts**: `FactoryAccessFiPool`, `FactoryUser`, `AccessfiPool`, `User`, `AccessFiDataToken`, `VerifyProof`
- **ZK Layer**: zkEmail (client-side proofs) + zkVerify (on-chain aggregation)
- **TEE Layer**: Phala CVM handles encryption/decryption and secure storage
- **Proof Registry**: off-chain metadata for proof types and templates

## Fees

- **5% platform fee** on pool funding (buyers pay once per funding action)
- Sellers receive the full **price per data**

## Repo Structure

- `contracts/` smart contracts (Foundry)
- `web/` Next.js app (UI + API routes + proof registry)
- `tee-service/` Phala CVM service (encrypt/decrypt)
