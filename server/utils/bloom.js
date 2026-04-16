const { x86 } = require('murmurhash3js-revisited');
const User = require('../models/User');

const BIT_ARRAY_SIZE = 1024;
let bitArray = new Uint8Array(BIT_ARRAY_SIZE);
const seeds = [11, 23, 37];

const normalizeUsername = (username) => String(username || '').trim().toLowerCase();

const getHashIndex = (value, seed) => {
  const hashHex = x86.hash32(`${seed}:${value}`);
  const hashInt = Number.parseInt(hashHex, 16);
  return Math.abs(hashInt) % BIT_ARRAY_SIZE;
};

const addBit = (index) => {
  bitArray[index] = 1;
};

const hasBit = (index) => bitArray[index] === 1;

const rebuildUsernameBloomFilter = async () => {
  bitArray = new Uint8Array(BIT_ARRAY_SIZE);
  const users = await User.find({}, 'username').lean();
  users.forEach((user) => {
    const normalized = normalizeUsername(user.username);
    seeds.forEach((seed) => addBit(getHashIndex(normalized, seed)));
  });
};

const initializeUsernameBloomFilter = async () => {
  await rebuildUsernameBloomFilter();
  console.log(`[Bloom Filter] Initialized with m=${BIT_ARRAY_SIZE}, k=${seeds.length}`);
};

const maybeHasUsername = (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return false;
  return seeds.every((seed) => hasBit(getHashIndex(normalized, seed)));
};

const addUsernameToBloom = (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return;
  seeds.forEach((seed) => addBit(getHashIndex(normalized, seed)));
};

const bloomFilter = {
  check: maybeHasUsername,
  add: addUsernameToBloom,
  rebuild: rebuildUsernameBloomFilter,
};

const getUsernameBloomSnapshot = () => ({
  size: BIT_ARRAY_SIZE,
  hashes: seeds.length,
  hashFunction: 'murmurhash3_x86_32',
  bitset: Array.from(bitArray),
});

const getUsernameBloomMeta = () => ({
  size: BIT_ARRAY_SIZE,
  hashes: seeds.length,
  hashFunction: 'murmurhash3_x86_32',
  bitsSet: bitArray.reduce((count, bit) => count + bit, 0),
});

module.exports = {
  initializeUsernameBloomFilter,
  rebuildUsernameBloomFilter,
  maybeHasUsername,
  addUsernameToBloom,
  getUsernameBloomSnapshot,
  getUsernameBloomMeta,
  normalizeUsername,
  bloomFilter,
};
