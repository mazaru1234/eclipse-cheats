import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.AES_SECRET_KEY;
  if (!secret || secret.length < 64) {
    throw new Error(
      "AES_SECRET_KEY must be a 64-character hex string (32 bytes). Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(secret, "hex");
}

export function encryptAES256(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptAES256(ciphertext: string): string {
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export function hashOrderProtection(
  orderId: string,
  userId: string,
  amount: number,
  secret: string
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderId}:${userId}:${amount}`)
    .digest("hex");
}

export function generateProtectionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateReferralCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
