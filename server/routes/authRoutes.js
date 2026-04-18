const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  rebuildUsernameBloomFilter,
  bloomFilter,
  getUsernameBloomSnapshot,
  normalizeUsername,
} = require('../utils/bloom');

const router = express.Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

const createToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, username: user.username, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

const registerHandler = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedUsername = normalizeUsername(username);

    if (!name || !normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, username, email and password are required' });
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 chars, include 1 uppercase and 1 number',
      });
    }
    if (normalizedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // ── Bloom Filter bypassed — was causing false-positive blocks ──────────
    // const bloomHit = bloomFilter.check(normalizedUsername);
    // Direct DB check is the source of truth:
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const user = await User.create({
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      role: role || 'customer',
    });
    bloomFilter.add(normalizedUsername); // Keep the filter warm for the availability endpoint

    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token: createToken(user),
    });
  } catch (error) {
    const reason =
      error?.name === 'MongoServerSelectionError'
        ? 'Database Connection Refused'
        : error?.name === 'ValidationError'
          ? `Schema Validation Error: ${error.message}`
          : `Unhandled Signup Error: ${error.message}`;
    console.error(reason);
    return res.status(500).json({ message: 'Sign up failed', error: error.message });
  }
};

router.post('/signup', registerHandler);
router.post('/register', registerHandler);

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const normalizedIdentifier = String(identifier || '').trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token: createToken(user),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.get('/username-availability', async (req, res) => {
  const username = normalizeUsername(req.query.username);
  if (!username) return res.status(400).json({ message: 'Username is required' });
  console.log(`[Request Received] Username check for: ${username}`);

  const bloomHit = bloomFilter.check(username);
  if (!bloomHit) return res.json({ username, available: true, source: 'bloom' });

  const exact = await User.findOne({ username });
  return res.json({ username, available: !exact, source: 'bloom+db' });
});

router.get('/username-bloom-sync', async (_req, res) => {
  await rebuildUsernameBloomFilter();
  return res.json({ status: 'synced', ...getUsernameBloomSnapshot() });
});

module.exports = router;
