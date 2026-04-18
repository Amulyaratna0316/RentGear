const { x86 } = require('murmurhash3js-revisited');
const User = require('../models/User');

// ─── Bloom Filter Configuration ──────────────────────────────────────────────
// m = 10,000 bits — large enough to avoid saturation for thousands of users
// k = 7 hash functions — optimal for low false-positive rate at this size
// False-positive probability ≈ (1 - e^(-kn/m))^k
//   At n = 500 users: ≈ 0.0003%   At n = 2000 users: ≈ 2.3%
const BIT_ARRAY_SIZE = 10000;
let bitArray = new Uint8Array(BIT_ARRAY_SIZE);
const seeds = [11, 23, 37, 53, 71, 89, 107]; // 7 independent seeds

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

// ─── clear() — resets the entire bit array to 0 ─────────────────────────────
const clearBloomFilter = () => {
  bitArray = new Uint8Array(BIT_ARRAY_SIZE);
  console.log('[Bloom Filter] Cleared — all bits reset to 0');
};

// ─── rebuild() — clear + re-populate from the database ──────────────────────
const rebuildUsernameBloomFilter = async () => {
  clearBloomFilter();
  const users = await User.find({}, 'username').lean();
  users.forEach((user) => {
    const normalized = normalizeUsername(user.username);
    if (normalized) {
      seeds.forEach((seed) => addBit(getHashIndex(normalized, seed)));
    }
  });
  const bitsSet = bitArray.reduce((count, bit) => count + bit, 0);
  console.log(`[Bloom Filter] Rebuilt from ${users.length} users — ${bitsSet}/${BIT_ARRAY_SIZE} bits set (${((bitsSet / BIT_ARRAY_SIZE) * 100).toFixed(1)}% full)`);
};

// ─── initialize() — runs at server startup ──────────────────────────────────
const initializeUsernameBloomFilter = async () => {
  await rebuildUsernameBloomFilter();
  console.log(`[Bloom Filter] Initialized with m=${BIT_ARRAY_SIZE}, k=${seeds.length}`);
};

// ─── check() — probabilistic lookup (may return false positives) ────────────
const maybeHasUsername = (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return false;
  return seeds.every((seed) => hasBit(getHashIndex(normalized, seed)));
};

// ─── add() — insert a username into the filter ──────────────────────────────
const addUsernameToBloom = (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return;
  seeds.forEach((seed) => addBit(getHashIndex(normalized, seed)));
};

const bloomFilter = {
  check: maybeHasUsername,
  add: addUsernameToBloom,
  rebuild: rebuildUsernameBloomFilter,
  clear: clearBloomFilter,
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
  saturationPercent: ((bitArray.reduce((c, b) => c + b, 0) / BIT_ARRAY_SIZE) * 100).toFixed(1),
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
