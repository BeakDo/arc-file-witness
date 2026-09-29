export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export async function sha256Hex(bytes) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return `0x${Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function hashFile(file) {
  if (file.size > MAX_FILE_BYTES) throw new Error('File exceeds the 20 MB limit.');
  return sha256Hex(await file.arrayBuffer());
}
