import ganache from 'ganache';
import { BrowserProvider, ContractFactory } from 'ethers';
import artifact from '../src/generated/FileWitness.json' with { type: 'json' };

const provider = new BrowserProvider(ganache.provider({ logging: { quiet: true } }));
const signer = await provider.getSigner();
const contract = await new ContractFactory(artifact.abi, artifact.bytecode, signer).deploy();
const receipt = await contract.deploymentTransaction().wait();
process.stdout.write(`Local-EVM deployment gas: ${receipt.gasUsed}\n`);
