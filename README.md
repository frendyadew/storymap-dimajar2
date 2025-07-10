# Peta Desa Dimanjar 2, Sumberarum

WebGIS interaktif untuk visualisasi spasial Desa Dimanjar 2, Sumberarum. Peta ini menampilkan berbagai informasi spasial seperti sebaran bangunan, jaringan jalan lokal, penggunaan lahan, serta fasilitas pendidikan, perdagangan & jasa, dan tempat peribadatan.

---

## 🌍 Fitur Utama

- **Multiple Basemap**: Pilihan OpenStreetMap, Esri World Imagery, Google Satellite, dan OpenTopoMap.
- **Layer Interaktif**: 
  - **Sarana dan Prasarana**: Pendidikan, Perdagangan & Jasa, Peribadatan.
  - **Jaringan Jalan Infrastruktur**: Jalan Lokal.
  - **Penggunaan Lahan**: Bangunan (solid), Lahan (warna sesuai keterangan, solid).
  - **Area Kajian**: Batas Administrasi Dimanjar 2.
- **Simbologi Dinamis**: Warna lahan otomatis berdasarkan atribut `KETERANGAN`.
- **Pop-up Informasi**: Klik fitur untuk melihat detail atribut.
- **Pengukuran**: Tool pengukuran jarak dan luas.
- **Responsive Design**: Nyaman diakses di desktop maupun mobile.
- **GitHub Pages Ready**: Bisa diakses publik tanpa server khusus.

---

## 🚀 Cara Menjalankan

1. **Clone atau Download Repo**
   ```sh
   git clone https://github.com/USERNAME/storymap-dimajar2.git
   ```
   atau download ZIP lalu extract.

2. **Buka `index.html` di browser**  
   Tidak perlu server lokal, cukup double-click file.

3. **Akses Online (GitHub Pages)**
   - GitHub Pages:  
     `https://frendyadew.github.io/storymap-dimajar2/`

---

## 📂 Struktur Layer

- **Sarana dan Prasarana**
  - Pendidikan (`pendidikan.geojson`)
  - Perdagangan & Jasa (`perdaganganjasa.geojson`)
  - Peribadatan (`peribadatan.geojson`)
- **Jaringan Jalan Infrastruktur**
  - Jalan Lokal (`jalan_lokal.geojson`)
- **Penggunaan Lahan**
  - Bangunan (`bangunan.geojson`)
  - Lahan (`lahan.geojson`) — warna otomatis sesuai `KETERANGAN`
- **Area Kajian**
  - Batas Administrasi Dimanjar 2 (`dimajar2_batas.geojson`)

---

## 🗂️ Struktur Folder

```
/
├── data/
│   ├── bangunan.geojson
│   ├── lahan.geojson
│   ├── jalan_lokal.geojson
│   ├── pendidikan.geojson
│   ├── perdaganganjasa.geojson
│   ├── peribadatan.geojson
│   └── dimajar2_batas.geojson
├── js/
│   ├── map-config.js
│   ├── layer-manager.js
│   ├── popup-handler.js
│   ├── measure-tool.js
│   └── main.js
├── index.html
└── README.md
```

---

## 📝 Sumber Data

- Data spasial hasil digitasi dan survey lapangan di Desa Dimanjar 2, Sumberarum.

---

## 👨‍💻 Kontribusi

Silakan fork, pull request, atau laporkan issue jika ada saran atau perbaikan!

---

## 📢 Lisensi

Proyek ini bersifat open source untuk keperluan edukasi dan pengembangan WebGIS desa.

---

**Dibuat dengan ❤️ oleh [Nama Anda/Tim]**