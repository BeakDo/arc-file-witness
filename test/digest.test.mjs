import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex, hashFile, MAX_FILE_BYTES } from '../src/fileDigest.js';

test('SHA-256 uses the exact file bytes', async () => {
  const bytes = new TextEncoder().encode('abc');
  assert.equal(
    await sha256Hex(bytes),
    '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
  assert.notEqual(await sha256Hex(new TextEncoder().encode('abc\n')), await sha256Hex(bytes));
});

test('oversized files are rejected before reading', async () => {
  let read = false;
  const file = { size: MAX_FILE_BYTES + 1, arrayBuffer: async () => { read = true; } };
  await assert.rejects(hashFile(file), /20 MB/);
  assert.equal(read, false);
});
