// File: server.js

// 1. Impor paket yang dibutuhkan
const express = require('express');
const mongoose = require('mongoose');

// 2. Inisialisasi Aplikasi Express
const app = express();
const PORT = 3000; // Server akan berjalan di port 3000

// GANTI DENGAN CONNECTION STRING ANDA DARI MONGODB ATLAS
const MONGO_URI = 'mongodb+srv://frendyadew:dimajar2@frendyadew.1fhbhng.mongodb.net/?retryWrites=true&w=majority&appName=frendyadew';

// 3. Middleware
// Ini memungkinkan server untuk menerima dan mem-parsing body request dalam format JSON
app.use(express.json({ limit: '10mb' })); // Tambahkan limit untuk data GeoJSON yang besar
// Ini akan melayani semua file statis (HTML, CSS, JS frontend) dari folder root proyek
app.use(express.static('.'));

// 4. Koneksi ke Database MongoDB Atlas
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Berhasil terhubung ke MongoDB Atlas!'))
  .catch(err => console.error('❌ Gagal terhubung ke MongoDB:', err));

// 5. Membuat Skema dan Model Data
// Skema ini mendefinisikan struktur data GeoJSON yang akan disimpan di database.
const featureSchema = new mongoose.Schema({
  type: { type: String, required: true },
  properties: { type: Object, default: {} },
  geometry: {
    type: { type: String, required: true },
    coordinates: { type: mongoose.Schema.Types.Mixed, required: true }
  }
}, { strict: false }); // `strict: false` mengizinkan properti lain yang tidak didefinisikan

const Feature = mongoose.model('Feature', featureSchema);

// 6. Membuat Rute API (API Endpoints)

/**
 * @route   GET /api/get-features
 * @desc    Mengambil semua fitur yang tersimpan dari database
 */
app.get('/api/get-features', async (req, res) => {
  try {
    const features = await Feature.find({});
    // Mengembalikan data dalam format GeoJSON FeatureCollection
    res.json({
      type: "FeatureCollection",
      features: features
    });
  } catch (error) {
    console.error("Error mengambil data:", error);
    res.status(500).send({ message: 'Gagal mengambil data dari database' });
  }
});

/**
 * @route   POST /api/save-features
 * @desc    Menyimpan sekumpulan fitur (menghapus semua yang lama terlebih dahulu)
 */
app.post('/api/save-features', async (req, res) => {
  const featureCollection = req.body;

  if (!featureCollection || !featureCollection.features) {
    return res.status(400).send({ message: 'Format data tidak valid.' });
  }

  try {
    // Strategi: Hapus semua fitur lama untuk sinkronisasi total
    await Feature.deleteMany({});
    console.log('Fitur lama berhasil dihapus.');

    // Simpan semua fitur baru yang dikirim dari frontend
    if (featureCollection.features.length > 0) {
      await Feature.insertMany(featureCollection.features);
      console.log(`${featureCollection.features.length} fitur baru berhasil disimpan.`);
    }

    res.status(200).send({ message: 'Fitur berhasil disinkronkan!' });
  } catch (error) {
    console.error("Error menyimpan data:", error);
    res.status(500).send({ message: 'Gagal menyimpan data ke database' });
  }
});


// 7. Menjalankan Server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log('Buka http://localhost:3000/map.html di browser Anda.');
});