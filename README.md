# Arc File Witness

Arc File Witness lets a person timestamp a file's SHA-256 fingerprint on Arc mainnet. The file is hashed locally in the browser and never uploaded. A verifier with the original file and anchoring wallet address can independently recompute the digest and read its first onchain timestamp. The contract has no custody, payment, admin, or upgrade function.

This is a small open-source prototype, not a document-notarization service. A record proves only that a wallet anchored a digest by a block timestamp. It does **not** prove the wallet owner's identity, legal ownership, delivery, authorship, or the file's quality. Hashes of common or predictable files may reveal which file was used. Do not anchor sensitive files whose content could be guessed.

## Status

The contract and static app compile and pass local checks. **There is no Arc mainnet deployment yet.** `src/config.js` intentionally has an empty contract address, so anchoring and verification remain disabled until a deployment is independently checked and recorded. This repository must not be described as a live Arc submission before that step.

## Local development

Requires Node.js 22+.

```sh
npm ci
npm run compile
npm test
npm run build
npm run preview
```

The tests run a local EVM in memory, check first-anchor persistence, per-wallet separation, and duplicate/empty-digest rejection. The browser hashes exact file bytes, with a 20 MiB limit. No real USDC or network transaction is needed for local tests.

## Deploying to Arc mainnet

Arc mainnet uses chain ID `5042`, RPC `https://rpc.mainnet.arc.io`, and native USDC for gas. Confirm these values against [Arc's current network documentation](https://docs.arc.io/arc/references/connect-to-arc) before deployment. Deployment requires an EVM wallet under the user's control with enough **Arc-native USDC** for gas. An exchange deposit address cannot sign the deployment. Never export a private key or recovery phrase into this repository, a terminal, or chat.

1. Open the official [Remix IDE](https://remix.ethereum.org/) in the same browser as a self-custodial wallet. Paste `contracts/FileWitness.sol` into a new file. Compile with Solidity 0.8.37, optimizer enabled at 200 runs, and Shanghai EVM target. Compare the ABI with `src/generated/FileWitness.json`.
2. In the wallet, select Arc mainnet. In Remix, choose **Injected Provider**, select `FileWitness`, estimate the deployment gas, and review the wallet's USDC cost before approving. Keep the transaction hash and contract address.
3. Open the deployment in the official [Arc explorer](https://explorer.arc.io/), confirm chain `5042`, successful status, contract bytecode, and deployer address. Set the verified address in `src/config.js` and rebuild.
4. Anchor a non-sensitive sample file through the app, then verify the same file and wallet address. Change one byte and confirm it no longer matches. Confirm the transaction and record on Arc explorer.
5. Publish the repository and static `dist/` app. Add the live URL, contract address, deployment transaction, and sample transaction to this README. Only then is it ready for a public grant submission.

The maintainer is responsible for reviewing and approving each wallet action. No page visit, hash calculation, or verification triggers a signature.

## Design notes

- `FileWitness.anchor(bytes32)` stores only the first timestamp for a digest under the caller's address and emits `FileAnchored`.
- The mapping getter is a free read. Duplicate anchors from the same wallet and zero digests revert. Different wallets may anchor the same digest independently.
- The contract has no owner or privileged role and accepts no attached payment. Normal Arc network gas still applies to deployment and anchoring.
- Public records are permanent. The UI never sends file bytes to the Arc RPC; only the digest and wallet address are used.

## License

MIT. See [LICENSE](LICENSE).
