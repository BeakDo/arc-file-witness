import { BrowserProvider, Contract, JsonRpcProvider, isAddress } from 'ethers';
import contractArtifact from './generated/FileWitness.json';
import { hashFile } from './fileDigest.js';
import { CONTRACT_ADDRESS, ARC_CHAIN_ID, ARC_RPC, ARC_EXPLORER } from './config.js';
import './style.css';

const fileInput = document.querySelector('#file');
const digestDisplay = document.querySelector('#digest');
const accountInput = document.querySelector('#account');
const anchorButton = document.querySelector('#anchor');
const verifyButton = document.querySelector('#verify');
const anchorStatus = document.querySelector('#anchor-status');
const verifyStatus = document.querySelector('#verify-status');
let currentDigest = '';

function setStatus(element, message, kind = '') {
  element.textContent = message;
  element.dataset.kind = kind;
}

function updateButtons() {
  const deployed = isAddress(CONTRACT_ADDRESS);
  anchorButton.disabled = !currentDigest || !deployed;
  verifyButton.disabled = !currentDigest || !deployed || !isAddress(accountInput.value.trim());
  if (!deployed) {
    setStatus(anchorStatus, 'Mainnet deployment is pending. Local fingerprinting is available now.');
    setStatus(verifyStatus, 'Verification opens after the mainnet contract address is published.');
  }
}

fileInput.addEventListener('change', async () => {
  currentDigest = '';
  digestDisplay.textContent = 'Calculating…';
  setStatus(anchorStatus, '');
  setStatus(verifyStatus, '');
  updateButtons();
  const file = fileInput.files?.[0];
  if (!file) {
    digestDisplay.textContent = 'Choose a file to begin';
    return;
  }
  try {
    currentDigest = await hashFile(file);
    digestDisplay.textContent = currentDigest;
  } catch (error) {
    digestDisplay.textContent = error.message;
  }
  updateButtons();
});

accountInput.addEventListener('input', updateButtons);

anchorButton.addEventListener('click', async () => {
  if (!currentDigest || !isAddress(CONTRACT_ADDRESS)) return;
  if (!window.ethereum) {
    setStatus(anchorStatus, 'An EVM browser wallet is required to anchor. Verification needs no wallet.', 'error');
    return;
  }
  anchorButton.disabled = true;
  try {
    const wallet = new BrowserProvider(window.ethereum);
    await wallet.send('eth_requestAccounts', []);
    const network = await wallet.getNetwork();
    if (network.chainId !== BigInt(ARC_CHAIN_ID)) {
      setStatus(anchorStatus, 'Switch your wallet to Arc mainnet (chain 5042), then try again.', 'error');
      return;
    }
    const signer = await wallet.getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);
    const account = await signer.getAddress();
    const prior = await contract.anchoredAt(account, currentDigest);
    if (prior !== 0n) {
      setStatus(anchorStatus, `Already recorded at ${new Date(Number(prior) * 1000).toLocaleString()}.`);
      accountInput.value = account;
      return;
    }
    const gas = await contract.anchor.estimateGas(currentDigest);
    const fee = await wallet.getFeeData();
    const upperBound = gas * (fee.maxFeePerGas ?? fee.gasPrice ?? 0n);
    const estimated = Number(upperBound) / 1e18;
    setStatus(anchorStatus, `Wallet confirmation required. Estimated gas ceiling: about ${estimated.toFixed(6)} USDC.`);
    const tx = await contract.anchor(currentDigest);
    setStatus(anchorStatus, 'Transaction sent. Waiting for confirmation…');
    await tx.wait();
    accountInput.value = account;
    setStatus(anchorStatus, `Recorded. Transaction: ${ARC_EXPLORER}/tx/${tx.hash}`, 'success');
    updateButtons();
  } catch (error) {
    setStatus(anchorStatus, error.shortMessage ?? error.message ?? 'The transaction was not completed.', 'error');
  } finally {
    updateButtons();
  }
});

verifyButton.addEventListener('click', async () => {
  if (!currentDigest || !isAddress(CONTRACT_ADDRESS)) return;
  const account = accountInput.value.trim();
  if (!isAddress(account)) return;
  verifyButton.disabled = true;
  setStatus(verifyStatus, 'Reading Arc mainnet…');
  try {
    const rpc = new JsonRpcProvider(ARC_RPC, ARC_CHAIN_ID, { staticNetwork: true });
    const contract = new Contract(CONTRACT_ADDRESS, contractArtifact.abi, rpc);
    const timestamp = await contract.anchoredAt(account, currentDigest);
    setStatus(
      verifyStatus,
      timestamp === 0n
        ? 'No matching record for this file and wallet.'
        : `Matching record: ${new Date(Number(timestamp) * 1000).toLocaleString()} (Arc block time).`,
      timestamp === 0n ? 'error' : 'success'
    );
  } catch (error) {
    setStatus(verifyStatus, error.shortMessage ?? error.message ?? 'Could not read Arc.', 'error');
  } finally {
    updateButtons();
  }
});

updateButtons();
