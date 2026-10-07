import { useMemo, useState } from 'react';
import { BrowserProvider } from 'ethers';
import { forgeTransaction, formatResult, isReadFunction, parseAbi } from './forge';
import './App.css';

const SAMPLE_ABI = JSON.stringify([
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }
], null, 2);

export default function App() {
  const [abiText, setAbiText] = useState(SAMPLE_ABI);
  const [contract, setContract] = useState('');
  const [selected, setSelected] = useState('');
  const [values, setValues] = useState([]);
  const [ethValue, setEthValue] = useState('0');
  const [account, setAccount] = useState('');
  const [chain, setChain] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: 'Paste an ABI and choose a function to begin.' });

  const parsed = useMemo(() => {
    try { return { ...parseAbi(abiText), error: '' }; }
    catch (error) { return { functions: [], error: error.message }; }
  }, [abiText]);
  const fragment = parsed.functions.find(item => item.format('sighash') === selected) || parsed.functions[0];

  function chooseFunction(signature) {
    setSelected(signature);
    const next = parsed.functions.find(item => item.format('sighash') === signature);
    setValues(next ? next.inputs.map(() => '') : []);
    setStatus({ type: 'idle', message: 'Arguments changed; forge calldata to validate the transaction.' });
  }

  async function connect() {
    if (!window.ethereum) { setStatus({ type: 'error', message: 'No injected EVM wallet was found. Install a wallet such as MetaMask.' }); return; }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      setAccount(await signer.getAddress()); setChain(`${network.name} · ${network.chainId}`);
      setStatus({ type: 'success', message: 'Wallet connected. Always verify the target, chain, calldata, and value before signing.' });
    } catch (error) { setStatus({ type: 'error', message: error.message }); }
  }

  function build() {
    if (!fragment || parsed.error) throw new Error(parsed.error || 'Choose a function');
    return forgeTransaction({ iface: parsed.iface, fragment, values, contract, ethValue });
  }

  function preview() {
    try {
      const tx = build();
      setStatus({ type: 'success', message: JSON.stringify({ to: tx.to, valueWei: tx.value.toString(), data: tx.data }, null, 2) });
    } catch (error) { setStatus({ type: 'error', message: error.message }); }
  }

  async function execute() {
    if (!window.ethereum) { setStatus({ type: 'error', message: 'Connect an injected EVM wallet first.' }); return; }
    try {
      const tx = build();
      const provider = new BrowserProvider(window.ethereum);
      if (isReadFunction(fragment)) {
        const raw = await provider.call(tx);
        setStatus({ type: 'success', message: formatResult(parsed.iface, fragment, raw) });
      } else {
        const signer = await provider.getSigner();
        setStatus({ type: 'pending', message: 'Confirm the transaction in your wallet…' });
        const response = await signer.sendTransaction(tx);
        setStatus({ type: 'pending', message: `Submitted ${response.hash}. Waiting for confirmation…` });
        const receipt = await response.wait();
        setStatus({ type: 'success', message: `Confirmed in block ${receipt.blockNumber}. Transaction: ${response.hash}` });
      }
    } catch (error) { setStatus({ type: 'error', message: error.shortMessage || error.message }); }
  }

  const activeValues = values.length === (fragment?.inputs.length || 0) ? values : (fragment?.inputs || []).map(() => '');

  return <div className="app-shell">
    <header className="topbar">
      <div><span className="eyebrow">EVM TRANSACTION WORKBENCH</span><h1>BlockForge<span>Ultimate</span></h1></div>
      <button className="wallet" onClick={connect}>{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Connect wallet'}</button>
    </header>
    <main>
      <section className="hero"><p>Turn contract ABIs into inspectable calldata, safe read calls, and wallet-approved transactions.</p><div className="chain">{chain || 'Wallet disconnected · Offline forging available'}</div></section>
      <div className="workspace">
        <section className="panel abi-panel"><div className="panel-title"><b>01</b><h2>Contract interface</h2></div>
          <label>Contract address<input value={contract} onChange={event => setContract(event.target.value)} placeholder="0x…" spellCheck="false" /></label>
          <label>ABI or artifact JSON<textarea value={abiText} onChange={event => setAbiText(event.target.value)} spellCheck="false" /></label>
          {parsed.error && <p className="field-error">{parsed.error}</p>}
        </section>
        <section className="panel call-panel"><div className="panel-title"><b>02</b><h2>Forge call</h2></div>
          <label>Function<select value={fragment?.format('sighash') || ''} onChange={event => chooseFunction(event.target.value)}>{parsed.functions.map(fn => <option key={fn.format('sighash')} value={fn.format('sighash')}>{fn.format('sighash')} · {fn.stateMutability}</option>)}</select></label>
          {fragment?.inputs.map((input, index) => <label key={`${input.name}-${index}`}>{input.name || `argument ${index + 1}`} <small>{input.type}</small><input value={activeValues[index]} onChange={event => { const next = [...activeValues]; next[index] = event.target.value; setValues(next); }} placeholder={input.type.endsWith('[]') ? '[…]' : input.type} spellCheck="false" /></label>)}
          {fragment?.stateMutability === 'payable' && <label>ETH value<input value={ethValue} onChange={event => setEthValue(event.target.value)} inputMode="decimal" /></label>}
          <div className="actions"><button className="secondary" onClick={preview}>Forge calldata</button><button className="primary" onClick={execute}>{isReadFunction(fragment) ? 'Run read call' : 'Send with wallet'}</button></div>
        </section>
      </div>
      <section className={`console ${status.type}`}><div><i />OUTPUT</div><pre>{status.message}</pre></section>
    </main>
    <footer>Client-side only · No private keys or ABIs leave your browser</footer>
  </div>;
}
