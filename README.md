# BlockForgeUltimate

BlockForgeUltimate is a client-side EVM contract workbench. Paste a contract ABI or compiler artifact, choose a function, enter typed arguments, inspect the generated calldata, run read-only calls, or submit state-changing transactions through an injected wallet.

## Capabilities

- Accepts ABI arrays and compiler artifacts containing an `abi` field
- Discovers overloaded contract functions by full signature
- Validates addresses, integers, booleans, arrays, and tuple JSON
- Encodes deterministic calldata with ethers v6
- Converts optional payable value from ETH to wei
- Runs `view` and `pure` calls without a signature
- Submits writes through an injected EIP-1193 wallet and waits for confirmation
- Keeps ABI, arguments, and transaction construction entirely in the browser

## Run locally

```bash
git clone https://github.com/centxyz/BlockForgeUltimate.git
cd BlockForgeUltimate
npm install
npm run dev
```

Open the displayed local URL. Offline calldata forging works without a wallet. Read and write execution requires an injected EVM wallet connected to the intended chain.

## Verify

```bash
npm test
npm run build
```

Tests cover ABI/artifact parsing, typed input validation, deterministic calldata, wei conversion, read-function detection, and result decoding.

## Safety

BlockForgeUltimate never requests or stores private keys. Wallet approval is still a real signature: verify the chain, contract address, function, arguments, calldata, and value before confirming.

## License

MIT © cent
