// Lightweight E2EE helpers using Web Crypto API
// - Generates/stores per-user RSA-OAEP keypair (private in localStorage)
// - Decrypts conversation wrapped keys and caches them
// - Encrypts/decrypts message content using AES-GCM

import { userAPI, chatAPI } from '../services/api';

const RSA_PRIVATE_KEY_KEY = 'e2ee_rsa_private_pem';
const RSA_PUBLIC_KEY_KEY = 'e2ee_rsa_public_pem';

// In-memory cache: conversationId -> { keyVersion, rawKey: ArrayBuffer }
const conversationKeyCache = new Map();

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/g, '')
                 .replace(/-----END [^-]+-----/g, '')
                 .replace(/\s+/g, '');
  return base64ToArrayBuffer(b64);
}

function arrayBufferToPem(buffer, label) {
  const b64 = arrayBufferToBase64(buffer);
  const wrapped = b64.match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----`;
}

async function importPrivateKeyFromPem(pem) {
  const keyData = pemToArrayBuffer(pem);
  return crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
}

async function exportPublicKeyPem(publicKey) {
  const spki = await crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToPem(spki, 'PUBLIC KEY');
}

async function exportPrivateKeyPem(privateKey) {
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey);
  return arrayBufferToPem(pkcs8, 'PRIVATE KEY');
}

export async function ensureUserKeyPair() {
  let pubPem = localStorage.getItem(RSA_PUBLIC_KEY_KEY);
  let privPem = localStorage.getItem(RSA_PRIVATE_KEY_KEY);

  if (pubPem && privPem) {
    return { pubPem, privPem };
  }

  const { publicKey, privateKey } = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );

  pubPem = await exportPublicKeyPem(publicKey);
  privPem = await exportPrivateKeyPem(privateKey);
  localStorage.setItem(RSA_PUBLIC_KEY_KEY, pubPem);
  localStorage.setItem(RSA_PRIVATE_KEY_KEY, privPem);

  // Save to backend for superadmin grants
  try { await userAPI.setPublicKey(pubPem); } catch {}
  return { pubPem, privPem };
}

async function getOrImportPrivateKey() {
  const privPem = localStorage.getItem(RSA_PRIVATE_KEY_KEY);
  if (!privPem) return null;
  try {
    return await importPrivateKeyFromPem(privPem);
  } catch {
    return null;
  }
}

export async function fetchAndCacheConversationKey(conversationId) {
  // Fetch encryption metadata for conversation
  const meta = await chatAPI.getConversationEncryption(conversationId);
  if (!meta.enabled) return null;

  let entry = conversationKeyCache.get(conversationId);
  if (entry && entry.keyVersion === meta.keyVersion) return entry;

  if (!meta.wrappedKey) return null; // user not granted yet
  const privateKey = await getOrImportPrivateKey();
  if (!privateKey) return null;
  const wrapped = base64ToArrayBuffer(meta.wrappedKey);
  const rawKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, wrapped);
  entry = { keyVersion: meta.keyVersion, rawKey };
  conversationKeyCache.set(conversationId, entry);
  return entry;
}

export async function encryptMessage(conversationId, plaintext) {
  if (!plaintext || !plaintext.trim()) return null;
  const entry = await fetchAndCacheConversationKey(conversationId);
  if (!entry) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey('raw', entry.rawKey, { name: 'AES-GCM' }, false, ['encrypt']);
  const enc = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
  return {
    isEncrypted: true,
    keyVersion: entry.keyVersion,
    iv: arrayBufferToBase64(iv.buffer),
    // WebCrypto returns ciphertext+authTag appended; backend can parse last 16 bytes
    ciphertext: arrayBufferToBase64(ciphertext)
  };
}

export async function decryptMessageIfNeeded(conversationId, message) {
  if (!message?.encryption?.isEncrypted) return message;
  try {
    const entry = await fetchAndCacheConversationKey(conversationId);
    if (!entry) return message;
    const iv = base64ToArrayBuffer(message.encryption.iv);
    const ct = base64ToArrayBuffer(message.encryption.ciphertext);
    const key = await crypto.subtle.importKey('raw', entry.rawKey, { name: 'AES-GCM' }, false, ['decrypt']);
    const ptBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, ct);
    const plaintext = new TextDecoder().decode(ptBuf);
    return { ...message, content: plaintext };
  } catch {
    return message;
  }
}

export function clearConversationKeyCache(conversationId) {
  if (conversationId) conversationKeyCache.delete(conversationId);
  else conversationKeyCache.clear();
}

export async function bootstrapE2EE() {
  try { await ensureUserKeyPair(); } catch {}
}

export default {
  ensureUserKeyPair,
  fetchAndCacheConversationKey,
  encryptMessage,
  decryptMessageIfNeeded,
  clearConversationKeyCache,
  bootstrapE2EE
};


