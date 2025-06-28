// api/data.js (VERSI OPTIMASI)
if (!process.env.VERCEL) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
}

const { db } = require('@vercel/postgres');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  const client = await db.connect();

  try {
    if (req.method === 'POST') {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const token = authHeader.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET; 

        try {
            jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }

        const { newData } = req.body;
        await client.sql`UPDATE portfolio_data SET content = ${JSON.stringify(newData)} WHERE id = 1;`;
        return res.status(200).json({ message: 'Data updated successfully' });

    } else if (req.method === 'GET') {
        const { rows } = await client.sql`SELECT content FROM portfolio_data WHERE id = 1;`;
        
        // --- PENAMBAHAN UNTUK OPTIMASI ---
        // Cache di Vercel Edge selama 10 menit (600 deti
        // Jika cache sudah lewat 10 menit, tetap tampilkan data lama sambil mengambil data baru di latar belakang (stale-while-revalidate).
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
        // --- AKHIR PENAMBAHAN ---

        return res.status(200).json(rows[0]?.content || {});
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    if (client) {
      client.release();
    }
  }
};