import express from 'express';
import { randomUUID, webcrypto } from 'node:crypto';
import { isAddress } from 'viem';
import fs from 'node:fs/promises';
import path from 'node:path';
const PORT = Number(process.env.PORT || 8080);
const STORAGE_DIR = process.env.TEE_STORAGE_DIR || '/data';
const ENCRYPTION_SECRET = process.env.TEE_ENCRYPTION_SECRET || 'dev-only-secret';
const app = express();
app.use(express.json({ limit: '2mb' }));
const textEncoder = new TextEncoder();
function sha256Hex(input) {
    const data = textEncoder.encode(input);
    const hash = webcrypto.subtle.digest('SHA-256', data);
    return Promise.resolve(hash).then(async (h) => {
        const bytes = new Uint8Array(h);
        return '0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    });
}
function deriveKeyMaterial(secret) {
    return webcrypto.subtle.digest('SHA-256', textEncoder.encode(secret));
}
async function encryptPayload(plainText) {
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await deriveKeyMaterial(ENCRYPTION_SECRET);
    const key = await webcrypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const cipherBuffer = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textEncoder.encode(plainText));
    return {
        iv: Buffer.from(iv).toString('base64'),
        cipher: Buffer.from(cipherBuffer).toString('base64')
    };
}
async function decryptPayload(ivB64, cipherB64) {
    const iv = Buffer.from(ivB64, 'base64');
    const cipher = Buffer.from(cipherB64, 'base64');
    const keyMaterial = await deriveKeyMaterial(ENCRYPTION_SECRET);
    const key = await webcrypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plainBuffer = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return Buffer.from(plainBuffer).toString('utf8');
}
async function ensureStorageDir() {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
}
function makeStoragePath(cid) {
    return path.join(STORAGE_DIR, `${cid}.json`);
}
app.post('/encrypt', async (req, res) => {
    try {
        const { recipientEmail, poolAddress, sellerAddress } = req.body;
        if (!recipientEmail || !poolAddress || !sellerAddress) {
            return res.status(400).json({
                error: 'Missing required fields: recipientEmail, poolAddress, sellerAddress',
            });
        }
        if (!isAddress(poolAddress) || !isAddress(sellerAddress)) {
            return res.status(400).json({
                error: 'Invalid poolAddress or sellerAddress',
            });
        }
        await ensureStorageDir();
        const dataHash = await sha256Hex(`${recipientEmail}::${poolAddress}`);
        const encrypted = await encryptPayload(recipientEmail);
        const encryptedCID = `cvm_${randomUUID()}`;
        await fs.writeFile(makeStoragePath(encryptedCID), JSON.stringify({ encryptedCID, dataHash, ...encrypted }, null, 2), 'utf8');
        return res.json({
            encryptedCID,
            dataHash,
        });
    }
    catch (error) {
        console.error('[TEE Service] encrypt error', error);
        return res.status(500).json({ error: error?.message || 'Encrypt failed' });
    }
});
app.post('/decrypt', async (req, res) => {
    try {
        const { encryptedCID } = req.body;
        if (!encryptedCID) {
            return res.status(400).json({
                error: 'Missing required field: encryptedCID',
            });
        }
        const filePath = makeStoragePath(encryptedCID);
        const raw = await fs.readFile(filePath, 'utf8');
        const payload = JSON.parse(raw);
        const recipientEmail = await decryptPayload(payload.iv, payload.cipher);
        return res.json({ recipientEmail });
    }
    catch (error) {
        console.error('[TEE Service] decrypt error', error);
        return res.status(500).json({ error: error?.message || 'Decrypt failed' });
    }
});
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
app.listen(PORT, () => {
    console.log(`[TEE Service] listening on :${PORT}`);
});
