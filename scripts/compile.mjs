import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import solc from 'solc';

const root = path.resolve(import.meta.dirname, '..');
const source = readFileSync(path.join(root, 'contracts', 'FileWitness.sol'), 'utf8');
const input = {
  language: 'Solidity',
  sources: { 'FileWitness.sol': { content: source } },
  settings: {
    evmVersion: 'shanghai',
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }
  }
};
const result = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (result.errors ?? []).filter(({ severity }) => severity === 'error');
if (errors.length) {
  for (const error of errors) process.stderr.write(`${error.formattedMessage}\n`);
  process.exitCode = 1;
} else {
  const contract = result.contracts['FileWitness.sol'].FileWitness;
  const artifact = { abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}` };
  const outputDir = path.join(root, 'src', 'generated');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'FileWitness.json'), `${JSON.stringify(artifact, null, 2)}\n`);
  process.stdout.write(`Compiled FileWitness with solc ${solc.version()}\n`);
}
