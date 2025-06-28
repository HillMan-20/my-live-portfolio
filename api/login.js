// api/login.js (VERSI DEBUGGING DENGAN NILAI LANGSUNG)
if (!process.env.VERCEL) {
    require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
}
 // Biarkan ini untuk konsistensi
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    // --- DATA KONFIGURASI MANUAL UNTUK TES ---
    // Salin-tempel nilai dari file .env.local Anda ke sini:
    const adminUsername = process.env.ADMIN_USERNAME; 
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH; 
    const jwtSecret = process.env.JWT_SECRET;
    // -------------------------------------------
    

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, password } = req.body;

    // Validasi input form
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Cek username dan bandingkan password yang sudah di-hash
    const isPasswordCorrect = await bcrypt.compare(password, adminPasswordHash);

    if (username === adminUsername && isPasswordCorrect) {
        // Jika benar, buat token
        const token = jwt.sign({ username: adminUsername }, jwtSecret, { expiresIn: '8h' });
        return res.status(200).json({ token });
    } else {
        // Jika salah, kirim error yang benar
        return res.status(401).json({ error: 'Invalid username or password.' });
    }
};