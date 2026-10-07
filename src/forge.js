import { Interface, isAddress, parseEther } from 'ethers';

export function parseAbi(text) {
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('ABI must be valid JSON'); }
  const abi = Array.isArray(value) ? value : value.abi;
  if (!Array.isArray(abi)) throw new Error('Expected an ABI array or an artifact containing an abi array');
  const iface = new Interface(abi);
  const functions = iface.fragments.filter(fragment => fragment.type === 'function');
  if (!functions.length) throw new Error('ABI contains no callable functions');
  return { abi, iface, functions };
}

export function parseArgument(value, input) {
  const type = input.type;
  if (type.endsWith('[]') || type.startsWith('tuple')) {
    try { return JSON.parse(value); } catch { throw new Error(`${input.name || type} must be valid JSON`); }
  }
  if (type === 'bool') {
    if (value !== 'true' && value !== 'false') throw new Error(`${input.name || type} must be true or false`);
    return value === 'true';
  }
  if (type === 'address' && !isAddress(value)) throw new Error(`${input.name || type} is not a valid address`);
  if (/^u?int/.test(type) && !/^-?\d+$/.test(value)) throw new Error(`${input.name || type} must be an integer`);
  return value;
}

export function forgeTransaction({ iface, fragment, values, contract, ethValue = '0' }) {
  if (!isAddress(contract)) throw new Error('Contract address is invalid');
  if (values.length !== fragment.inputs.length) throw new Error('Every function argument is required');
  const args = fragment.inputs.map((input, index) => parseArgument(values[index], input));
  return {
    to: contract,
    data: iface.encodeFunctionData(fragment, args),
    value: parseEther(ethValue || '0'),
    args
  };
}

export function isReadFunction(fragment) {
  return fragment.stateMutability === 'view' || fragment.stateMutability === 'pure';
}

export function formatResult(iface, fragment, raw) {
  const decoded = iface.decodeFunctionResult(fragment, raw);
  return JSON.stringify(decoded, (_key, value) => typeof value === 'bigint' ? value.toString() : value, 2);
}
