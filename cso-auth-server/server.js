/**
 * CSO Auth Server — self-hosted login + password reset for the GS Portal.
 * Run: `npm install && node server.js`
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const PORT = parseInt(process.env.PORT || '8787', 10);
const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const USERS_FILE = path.join(__dirname, 'users.json');
const TOKENS_FILE = path.join(__dirname, 'reset-tokens.json');

// ---------------- File helpers (atomic writes) ----------------
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}
function writeJson(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
function loadUsers()  { return readJson(USERS_FILE, []); }
function saveUsers(u) { writeJson(USERS_FILE, u); }
function loadTokens() {
  const all = readJson(TOKENS_FILE, []);
  const now = Date.now();
  // prune expired/used
  const fresh = all.filter(t => !t.used && t.expires_at > now);
  if (fresh.length !== all.length) writeJson(TOKENS_FILE, fresh);
  return fresh;
}
function saveTokens(t) { writeJson(TOKENS_FILE, t); }

// ---------------- Crypto helpers ----------------
function timingSafeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

// ---------------- Mail ----------------
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}
async function sendResetEmail(to, name, link) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937;">
      <h2 style="color:#0b2545;margin:0 0 16px;">GS Portal — Password Reset</h2>
      <p>Hello ${name || 'Administrator'},</p>
      <p>We received a request to reset the password for your CS Office account.
         Click the button below to choose a new password. This link is valid for 60 minutes
         and can be used only once.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${link}" style="background:#0b2545;color:#fff;text-decoration:none;
           padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block;">
          Reset password
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280;">If the button doesn't work, paste this URL into your browser:<br/>
        <span style="word-break:break-all;">${link}</span></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
      <p style="font-size:12px;color:#6b7280;">If you didn't request this, you can safely ignore this email.</p>
    </div>`;
  await getTransporter().sendMail({
    from, to, subject: 'GS Portal — Reset your password', html,
  });
}

// ---------------- App ----------------
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed: ' + origin));
  },
  methods: ['GET','POST','OPTIONS'],
}));

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Please try again later.' },
});
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 3,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many reset requests. Try again later.' },
  keyGenerator: (req) => (req.body && req.body.email ? String(req.body.email).toLowerCase() : req.ip),
});

// Health
app.get('/api/cso/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ---------------- LOGIN ----------------
app.post('/api/cso/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string' || email.length > 255 ||
      !password || typeof password !== 'string' || password.length > 128) {
    return res.status(400).json({ success: false, error: 'Valid email and password are required' });
  }
  const norm = email.toLowerCase().trim();
  const users = loadUsers();
  let candidate = null;
  for (const u of users) if (timingSafeEqual(u.email.toLowerCase(), norm)) candidate = u;

  let ok = false;
  if (candidate) {
    try { ok = await bcrypt.compare(password, candidate.password_hash); }
    catch { ok = false; }
  } else {
    // dummy compare to keep timing roughly constant
    try { await bcrypt.compare(password, '$2b$12$CwTycUXWue0Thq9StjUM0uJ8.JhE1m6QY8xZxRr1fUq7C9Gk5Y7iG'); }
    catch { }
  }
  if (!candidate || !ok) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }
  return res.json({
    success: true,
    user: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      designation: candidate.designation || "Chief Secretary's Office",
      role: candidate.role || 'system_admin',
    },
  });
});

// ---------------- FORGOT PASSWORD ----------------
app.post('/api/cso/forgot-password', forgotLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || email.length > 255) {
    return res.status(400).json({ success: false, error: 'Valid email is required' });
  }
  const norm = email.toLowerCase().trim();
  const users = loadUsers();
  const user = users.find(u => u.email.toLowerCase() === norm);

  // Always respond 200 — never leak whether the email exists
  if (user) {
    try {
      const tokens = loadTokens();
      const raw = crypto.randomBytes(32).toString('hex');
      const entry = {
        id: crypto.randomUUID(),
        user_id: user.id,
        token_hash: sha256(raw),
        expires_at: Date.now() + 60 * 60 * 1000, // 60 min
        used: false,
        created_at: Date.now(),
      };
      // invalidate previous tokens for this user
      const filtered = tokens.filter(t => t.user_id !== user.id);
      filtered.push(entry);
      saveTokens(filtered);

      const link = `${APP_URL}/reset-password?token=${raw}`;
      await sendResetEmail(user.email, user.name, link);
      console.log(`[forgot-password] sent reset email to ${user.email}`);
    } catch (e) {
      console.error('[forgot-password] error sending email:', e.message);
    }
  } else {
    console.log(`[forgot-password] no user for ${norm} (silent 200)`);
  }
  return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// ---------------- RESET PASSWORD ----------------
app.post('/api/cso/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || typeof token !== 'string' ||
      !newPassword || typeof newPassword !== 'string' ||
      newPassword.length < 10 || newPassword.length > 128) {
    return res.status(400).json({ success: false, error: 'Token and a password (10-128 chars) are required' });
  }
  const hash = sha256(token);
  const tokens = loadTokens();
  const entry = tokens.find(t => t.token_hash === hash && !t.used && t.expires_at > Date.now());
  if (!entry) {
    return res.status(400).json({ success: false, error: 'This reset link is invalid or has expired.' });
  }
  const users = loadUsers();
  const user = users.find(u => u.id === entry.user_id);
  if (!user) {
    return res.status(400).json({ success: false, error: 'Account not found.' });
  }
  user.password_hash = await bcrypt.hash(newPassword, 12);
  saveUsers(users);
  entry.used = true;
  saveTokens(tokens);
  console.log(`[reset-password] password rotated for ${user.email}`);
  return res.json({ success: true, message: 'Password updated. You can now sign in.' });
});

// ---------------- Boot ----------------
app.listen(PORT, () => {
  console.log(`CSO auth server listening on :${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ') || '(any)'}`);
  console.log(`App URL (for reset links): ${APP_URL || '(not set)'}`);
});
