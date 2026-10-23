import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY || "sintia_super_secret_aes_key_32b!";
  // Garantizar exactamente 32 bytes con hash SHA-256
  return crypto.createHash("sha256").update(envKey).digest();
}

/**
 * Cifra un texto o token con AES-256-GCM
 * Formato devuelto: iv:authTag:encryptedHex
 */
export function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Descifra una cadena previamente cifrada con encrypt()
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return "";
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (err) {
    console.error("Error al descifrar contenido:", err);
    return "";
  }
}

/**
 * Enmascara un token para mostrarlo de forma segura en el panel
 * Ej: "ya29.a0AfH6SM...4aB"
 */
export function maskToken(token: string): string {
  if (!token) return "";
  if (token.length <= 8) return "••••••••";
  const start = token.slice(0, 4);
  const end = token.slice(-4);
  return `${start}••••••••${end}`;
}
