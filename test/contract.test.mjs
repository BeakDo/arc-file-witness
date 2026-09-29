import test from 'node:test';
import assert from 'node:assert/strict';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, ZeroHash } from 'ethers';
import artifact from '../src/generated/FileWitness.json' with { type: 'json' };
import { sha256Hex } from '../src/fileDigest.js';

test('the first digest anchor is public, account-bound, and cannot be overwritten', async () => {
  const chain = ganache.provider({ logging: { quiet: true } });
  const provider = new BrowserProvider(chain);
  const alice = await provider.getSigner(0);
  const bob = await provider.getSigner(1);
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, alice);
  const witness = await factory.deploy();
  await witness.waitForDeployment();

  const digest = await sha256Hex(new TextEncoder().encode('known sample file'));
  assert.equal(await witness.anchoredAt(await alice.getAddress(), digest), 0n);

  const transaction = await witness.anchor(digest);
  const receipt = await transaction.wait();
  const timestamp = await witness.anchoredAt(await alice.getAddress(), digest);
  assert.ok(timestamp > 0n);
  assert.equal(await witness.anchoredAt(await bob.getAddress(), digest), 0n);
  assert.equal(receipt.logs.length, 1);
  assert.equal(witness.interface.parseLog(receipt.logs[0]).name, 'FileAnchored');

  await assert.rejects(witness.anchor.staticCall(digest), /AlreadyAnchored/);
  await assert.rejects(witness.anchor.staticCall(ZeroHash), /EmptyDigest/);
  await (await witness.connect(bob).anchor(digest)).wait();
  assert.ok(await witness.anchoredAt(await bob.getAddress(), digest) > 0n);
  assert.equal(await witness.anchoredAt(await alice.getAddress(), digest), timestamp);
});
