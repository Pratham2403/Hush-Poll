import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;
const HASH_SALT = process.env.HASH_SALT || "hushpoll-salt";

export const generateInviteCode = () => {
  return crypto.randomBytes(16).toString("hex");
};

export const encryptData = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decryptData = (text) => {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// New function to hash email for secure storage and matching
export const hashEmail = (email) => {
  return crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase() + HASH_SALT)
    .digest("hex");
};

// For regex patterns, we encrypt them instead of hashing
// so we can decrypt and use them for matching later
export const encryptRegexPattern = (pattern) => {
  return encryptData(pattern);
};

export const decryptRegexPattern = (encryptedPattern) => {
  return decryptData(encryptedPattern);
};
