#!/usr/bin/env node
// Usage: node hash.js <plaintext-password>
const bcrypt = require('bcryptjs');
const pw = process.argv[2];
if (!pw) { console.error('Usage: node hash.js <password>'); process.exit(1); }
console.log(bcrypt.hashSync(pw, 12));
