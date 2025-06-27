// api/data.js

// Impor "alat komunikasi" database
const { db } = require('@vercel/postgres');

// Ini adalah fungsi utama yang akan dijalankan oleh Vercel
module.exports = async (request, response) => {
  let client;
  try {
    // Hubungkan ke database
    client = await db.connect();
  } catch (error) {
    console.error('Database connection error:', error);
    return response.status(500).json({ error: 'Failed to connect to the database.' });
  }

  try {
    if (request.method === 'POST') {
      // --- BLOK INI UNTUK MENYIMPAN DATA DARI HALAMAN ADMIN ---
      const { newData } = request.body;
      if (!newData) {
        return response.status(400).json({ error: 'No data provided.' });
      }

      // Perbarui data di database dengan data baru yang dikirim dari admin.js
      await client.sql`UPDATE portfolio_data SET content = ${JSON.stringify(newData)} WHERE id = 1;`;

      // Kirim respon sukses
      return response.status(200).json({ message: 'Data updated successfully' });

    } else if (request.method === 'GET') {
      // --- BLOK INI UNTUK MENGAMBIL DATA UNTUK DITAMPILKAN ---

      // Ambil data dari database
      const { rows } = await client.sql`SELECT content FROM portfolio_data WHERE id = 1;`;

      // Kirim data tersebut sebagai respon
      return response.status(200).json(rows[0]?.content || {});

    } else {
      // Jika metodenya bukan GET atau POST
      response.setHeader('Allow', ['GET', 'POST']);
      return response.status(405).end(`Method ${request.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    return response.status(500).json({ error: 'An internal server error occurred.' });
  } finally {
    // Selalu lepaskan koneksi setelah selesai
    if (client) {
      client.release();
    }
  }
};