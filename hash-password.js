// hash-password.js
const bcrypt = require('bcryptjs');
const password = 'SenggarangUjungPenghabisBensin234'; // Ganti ini!
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log('Password Anda:', password);
console.log('Simpan HASH ini di .env.local:', hash);