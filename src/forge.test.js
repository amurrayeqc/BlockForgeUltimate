import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Interface } from 'ethers';
import { forgeTransaction, formatResult, isReadFunction, parseAbi } from './forge.js';

const ABI = [{ type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }];
describe('transaction forge', () => {
  it('loads ABI arrays and compiler artifacts', () => {
    assert.equal(parseAbi(JSON.stringify(ABI)).functions.length, 1);
    assert.equal(parseAbi(JSON.stringify({ abi: ABI })).functions[0].name, 'transfer');
  });
  it('builds deterministic EVM calldata and wei values', () => {
    const { iface, functions } = parseAbi(JSON.stringify(ABI));
    const tx = forgeTransaction({ iface, fragment: functions[0], values: ['0x000000000000000000000000000000000000dEaD', '42'], contract: '0x000000000000000000000000000000000000bEEF', ethValue: '0' });
    assert.equal(tx.data, iface.encodeFunctionData('transfer', ['0x000000000000000000000000000000000000dEaD', 42]));
    assert.equal(tx.value, 0n);
  });
  it('rejects malformed addresses and typed arguments', () => {
    const { iface, functions } = parseAbi(JSON.stringify(ABI));
    assert.throws(() => forgeTransaction({ iface, fragment: functions[0], values: ['nope', '42'], contract: '0x000000000000000000000000000000000000bEEF' }), /valid address/);
    assert.throws(() => forgeTransaction({ iface, fragment: functions[0], values: ['0x000000000000000000000000000000000000dEaD', '4.2'], contract: '0x000000000000000000000000000000000000bEEF' }), /integer/);
  });
  it('identifies reads and formats bigint results', () => {
    const abi = [{ type: 'function', name: 'totalSupply', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }];
    const iface = new Interface(abi); const fragment = iface.getFunction('totalSupply');
    assert.equal(isReadFunction(fragment), true);
    assert.match(formatResult(iface, fragment, iface.encodeFunctionResult(fragment, [123n])), /123/);
  });
});
