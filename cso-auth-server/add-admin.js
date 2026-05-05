#!/usr/bin/env node
// Usage: node add-admin.js <email> "<Full Name>" <plaintext-password>
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const [, , email, name, pw] = process.argv;
if (!email || !name || !pw) {
  console.error('Usage: node add-admin.js <email> "<Full Name>" <password>');
  process.exit(1);
}
const file = path.join(__dirname, 'users.json');
const users = JSON.parse(fs.readFileSync(file, 'utf8'));
if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
  console.error('Admin with this email already exists.');
  process.exit(1);
}
users.push({
  id: 'admin-' + Date.now(),
  name, email,
  designation: "Chief Secretary's Office",
  role: 'system_admin',
  password_hash: bcrypt.hashSync(pw, 12),
});
fs.writeFileSync(file, JSON.stringify(users, null, 2));
console.log('Added', email);
