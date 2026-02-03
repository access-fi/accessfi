# AccessFi TEE Service (CVM)

This service runs inside a Phala Cloud CVM and handles encryption/decryption of the recipient email.

## API

- `POST /encrypt`
  - body: `{ recipientEmail, poolAddress, sellerAddress }`
  - returns: `{ encryptedCID, dataHash }`

- `POST /decrypt`
  - body: `{ encryptedCID }`
  - returns: `{ recipientEmail }`

## Local Development

1. Install deps:

```bash
cd tee-service
npm install
```

2. Run:

```bash
TEE_ENCRYPTION_SECRET=dev-secret npm run dev
```

## Phala Cloud CVM

1. Build and push image:

```bash
docker build -t YOUR_REGISTRY/accessfi-tee-service:latest ./tee-service
docker push YOUR_REGISTRY/accessfi-tee-service:latest
```

2. In Phala Cloud, create a CVM and paste `tee-service/docker-compose.yml`.

3. Set environment variables:
- `TEE_ENCRYPTION_SECRET` (required)
- `TEE_STORAGE_DIR=/data` (default)

4. Use the generated HTTPS endpoint as `TEE_SERVICE_URL` in the web app.

## Web App Integration

- Set `TEE_SERVICE_URL` in the web app environment to the CVM endpoint.
- Set `TEE_RPC_URL` or `RPC_URL_<CHAIN_ID>` so `/api/tee/decrypt` can verify `ownerOf`.
