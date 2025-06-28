// api/upload-image.js
require('dotenv').config(); // Untuk memuat environment variables jika Anda menguji secara lokal
const cloudinary = require('cloudinary').v2; // Memuat library Cloudinary
const jwt = require('jsonwebtoken'); // Memuat library JWT untuk verifikasi token

// Konfigurasi Cloudinary
// Mengambil kredensial dari environment variables yang telah Anda atur di Vercel
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Ini adalah fungsi serverless utama yang akan dieksekusi oleh Vercel
module.exports = async (req, res) => {
    // Hanya izinkan metode POST untuk upload gambar
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // --- Verifikasi Token Admin (PENTING untuk keamanan) ---
    // Pastikan hanya admin yang terotentikasi yang bisa mengunggah gambar
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    // Mengambil JWT_SECRET dari environment variables Vercel
    const jwtSecret = process.env.JWT_SECRET; 

    try {
        jwt.verify(token, jwtSecret); // Memverifikasi apakah token valid
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    // --- Akhir Verifikasi Token Admin ---

    // Mengambil data gambar Base64 dari body request
    // Frontend akan mengirim gambar dalam format Base64
    const { imageBase64 } = req.body;

    if (!imageBase64) {
        return res.status(400).json({ error: 'No image data provided.' });
    }

    try {
        // Melakukan upload gambar ke Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageBase64, {
            folder: "portfolio-images", // Tentukan folder di Cloudinary Anda
            // Anda bisa menambahkan opsi lain di sini, seperti:
            // resource_type: "auto", // Mendeteksi tipe file secara otomatis
            // transformation: [{ width: 500, height: 500, crop: "limit" }] // Contoh: resize gambar
        });

        // Mengembalikan URL publik dari gambar yang berhasil diunggah
        return res.status(200).json({ url: uploadResult.secure_url });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        // Memberikan detail error hanya di konsol server, tidak ke frontend untuk keamanan
        return res.status(500).json({ error: 'Failed to upload image to Cloudinary.' });
    }
};