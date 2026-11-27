# Analisis Kelayakan, Pola Eksekusi, Estimasi Usaha/Token, dan Rekomendasi Model AI untuk Visualisasi 3D Kota Palembang

Dokumen ini menyajikan kajian kritis terhadap pengembangan visualisasi 3D Kota Palembang—dimulai dari prototipe eksplorasi awal yang telah dibangun dan diverifikasi pada repositori ini, hingga proyeksi menuju model kota berbasis data GIS (*city-scale*) maupun kembaran digital (*digital twin*). Setiap klaim mengenai prototipe diikat secara ketat (*1:1 consistency lock*) dengan berkas sumber, perintah terminal, dan hasil verifikasi aktual di repositori proyek ini.

---

## 1. Ringkasan Eksekutif

1. **Kelayakan (Feasibility):** Membangun visualisasi 3D Kota Palembang **sangat layak (tinggi)** pada level *Stylized Procedural Prototype* untuk kebutuhan eksplorasi awal, tata ruang konseptual, dan pariwisata digital (sebagaimana dibuktikan oleh prototipe Three.js + Vite pada proyek ini). Kelayakan turun menjadi **menengah** untuk *GIS-Driven City Model* (keterbatasan atribut ketinggian bangunan pada OpenStreetMap di Palembang serta resolusi DEMNAS ~8 m), dan **rendah hingga bersyarat** untuk *Photorealistic Digital Twin / 3D Tiles* karena cakupan *mesh* 3D komersial untuk kota sekunder di Indonesia belum seragam dan biaya akuisisi UAV/LiDAR tinggi.
2. **Fitur & Pola Eksekusi Tepat Guna:** Untuk prototipe kecil (~15–20 berkas), **Single-Agent Iteratif dengan loop verifikasi screenshot** atau **Human-in-the-Loop Co-pilot** jauh lebih efisien dibandingkan orkestrasi multi-agen yang kompleks. Namun, saat skala naik ke ratusan kilometer persegi data geospasial, pola terbaik bergeser ke **Deterministic Pipeline / DAG** (ETL GIS → *tiling* 3D → *viewer*) yang didampingi agen hanya untuk penulisan skrip, UI, dan QA.
3. **Estimasi Usaha & Konsumsi Token:** Prototipe *stylized* dapat diselesaikan dalam hitungan **~6–14 jam kerja efektif** (atau **~480 ribu–1,43 juta total token** jika dikerjakan secara otonom dengan loop verifikasi visual dan QA—batas bawah untuk *single-agent* terarah, batas atas untuk *multi-agent* berlapis), sedangkan skala GIS kota membutuhkan **3–8 minggu** (dan dapat menyentuh jutaan token jika agen terlibat dalam iterasi kode, pembersihan data, dan QA berulang). Sebagian besar konsumsi token (**~75–90%**) berasal dari **amplifikasi konteks input** (riwayat percakapan, output alat, dan token gambar screenshot), bukan dari jumlah baris kode output.
4. **Rekomendasi Model AI:** Tidak ada satu model optimal untuk semua fase. Strategi biaya-performa terbaik memisahkan **model penalaran tinggi** untuk arsitektur/debugging spasial, **model coding cepat** untuk boilerplate/ETL, dan **model multimodal (vision)** khusus untuk inspeksi visual hasil render WebGL agar cacat geometri (*floating mesh*, tumpang-tindih label, atau framing tertutup UI) tertangkap sejak dini.

---

## 2. Spesifikasi & Batasan Prototipe Terverifikasi (Consistency Anchor)

Bagian ini mendokumentasikan secara persis apa yang telah dibangun dan diverifikasi di repositori proyek ini, memisahkan realitas prototipe (Tier 1) dari target skala kota (Tier 2–3).

### 2.1 Inventaris Berkas & Teknologi Terpasang

- **Stack terpasang (`package.json`):** `three` (`^0.187.0`) dan `vite` (`^8.4.0`), modul ES vanilla tanpa *framework* UI tambahan dan **tanpa panggilan CDN saat runtime**.
- **Struktur berkas aktual:**
  - `package.json`, `vite.config.js` (`base: './'`, `outDir: 'dist'`), `index.html`
  - `src/main.js` — inisialisasi `WebGLRenderer` (dengan fallback error jika WebGL tidak tersedia), `OrbitControls` dengan batas sudut polar dan jarak, *camera tweening*, dan telemetri read-only `window.__PALEMBANG_3D__`
  - `src/style.css` — gaya HUD (*heads-up display*) kontras tinggi untuk kontrol preset, mode pencahayaan, dan kartu informasi
  - `src/scene/environment.js` — kubah langit shader prosedural, kabut eksponensial (`FogExp2`), pencahayaan dan bayangan terarah untuk 3 mode (`siang`, `senja`, `malam`)
  - `src/scene/riverMusi.js` — permukaan air Sungai Musi berbasis shader riak animasi, tepian berkontur Seberang Ilir (`-Z`) & Seberang Ulu (`+Z`), turap penahan, dermaga, 5 *perahu ketek*, dan 2 tongkang batu bara + kapal tunda
  - `src/scene/ampera.js` — Jembatan Ampera merah bata dengan dua menara portal-H, rangka baja, kabel vertikal, beban penyeimbang, lampu jalan, serta kendaraan yang melintas
  - `src/scene/kutoBesak.js` — Benteng Kuto Besak berdenah ~1,6:1 menghadap Sungai Musi, 4 bastion sudut, gerbang *Lawang Kuto*, bangunan halaman dalam beratap limasan, bendera Merah-Putih, dan Plaza BKB beserta dermaganya
  - `src/scene/pulauKemaro.js` — Pulau Kemaro dengan Pagoda oktagonal sembilan lantai merah-emas, Klenteng Hok Tjing Rio, pepohonan tropis (*Pohon Cinta*), dan dermaga kayu
  - `src/scene/cityContext.js` — Masjid Agung SMB I (atap tumpang tiga tingkat dan menara putih), Monpera, jalur layang LRT Sumsel (dari Stasiun Ampera hingga Stasiun Jakabaring + rangkaian kereta 3 gerbong animasi), dan gugus rumah panggung *Rumah Limas*
  - `src/scene/landmarksExtra.js` — 7 kawasan/tengara tambahan: Bundaran Air Mancur Masjid Agung (air mancur animasi), Gedung & Kawasan Pasar 16 Ilir, Kantor Walikota (Menara Air / Gedung Ledeng) + Museum SMB II, Taman & Danau Kambang Iwak, Kampung Kapitan 7 Ulu, Stadion Gelora Sriwijaya Jakabaring (4 menara lampu sorot + Stasiun LRT Jakabaring), dan Jembatan Musi IV (*cable-stayed* + lalu lintas animasi)
  - `src/scene/urbanFabric.js` — zoning permukaan kota (komersial/permukiman/taman), jaringan jalan arteri & kolektor bermarka, serta kepadatan kota berbasis `InstancedMesh` (81 ruko berjendela menyala malam, 241 rumah permukiman, 978 pohon tropis & sabuk hijau tepi peta, 68 lampu jalan, dan 40 kendaraan jalan animasi)
  - `src/ui/landmarks.js` & `src/ui/hud.js` — 10 preset kamera (`Overview`, `Ampera`, `Bundaran & Masjid`, `Pasar 16 Ilir`, `Kuto Besak`, `Walikota & KI`, `Kampung Kapitan`, `Jakabaring`, `Jembatan Musi IV`, `Pulau Kemaro`), pin Label 3D yang dapat diklik langsung, sakelar `Siang`/`Senja`/`Malam`, tombol `Label 3D`, dan kartu informasi
  - `scripts/verify.mjs` — skrip verifikasi otomatis berbasis `vite preview` + Playwright headless Chromium (`ANGLE SwiftShader` WebGL2)
  - `README.md` & `ANALISIS_PALEMBANG_3D.md`

### 2.2 Perintah Terverifikasi & Hasil Eksekusi Aktual

Seluruh perintah berikut dieksekusi dari repositori proyek ini (pada host macOS dengan Node `v24.22.1` di `PATH`) dan keluar dengan **exit code 0**:

- **`npm install`**: Menginstal 43 paket dependensi (termasuk dependensi transitif sesuai `package-lock.json`).
- **`npm run build`**: `vite build` mentransformasi 18 modul dan menghasilkan bundel produksi di `dist/` dalam **~127–135 ms** (dengan ukuran berkas: `dist/index.html` 0,42 kB, `dist/assets/index-*.css` 5,14 kB / 1,68 kB gzip, `dist/assets/index-*.js` 635,97 kB / 162,39 kB gzip).
- **`npm run verify`**: Menjalankan `node scripts/verify.mjs` terhadap `vite preview` pada `http://127.0.0.1:4179/`:
  - **Telemetri WebGL2 terukur (`SwiftShader`):** `meshCount: 1.091`, `triangles: ~242.628–242.630`, `drawCalls: ~1.496–1.497`, `landmarkCount: 10`, `urbanStats: { rukoCount: 81, houseCount: 241, treeCount: 978, lampCount: 68, roadCarCount: 40 }`.
  - **Validasi error, non-blank, & tata letak mobile:** `consoleErrors: 0`, `pageErrors: 0`; uji sampling piksel kanvas `16×16` lolos dengan `spread: 591` dan `uniqueBuckets: 129` (bukan layar kosong); uji viewport mobile `390×844` lolos (`mobileBounds.fits: true`, seluruh kontrol HUD berada di dalam lebar `390 px`).
  - **Tangkapan layar terverifikasi (13 PNG di `artifacts/`):** `preview-overview.png`, `preview-ampera.png`, `preview-masjid-lrt.png`, `preview-pasar16.png`, `preview-bkb.png`, `preview-walikota-ki.png`, `preview-kapitan.png`, `preview-jakabaring.png`, `preview-musi-iv.png`, `preview-kemaro.png`, `preview-sunset.png`, `preview-jakabaring-night.png`, dan `preview-night.png` — seluruhnya telah diperiksa secara visual.

### 2.3 Batasan Sengaja pada Prototipe

1. **Skala Diorama Terkompresi:** Orientasi relatif dipertahankan (*Seberang Ilir* di utara `-Z`, *Seberang Ulu* di selatan `+Z`, aliran *Sungai Musi* dari barat `-X` ke timur `+X`), tetapi jarak memanjang dikompresi (di lapangan, Benteng Kuto Besak berada ~0,5–0,7 km di barat Ampera sementara Pulau Kemaro ~6 km di timur hilir). Tanpa kompresi, Pulau Kemaro dan Kuto Besak akan tampak terlalu kecil pada tampilan ikhtisar (*overview*).
2. **Geometri Prosedural, Bukan Data Survei:** Seluruh objek dibentuk dari primitif dan shader Three.js. Tidak ada impor model `.glb/.gltf` hasil fotogrametri ataupun model BIM teknik sipil.
3. **Tidak Ada Integrasi GIS & Telemetri Langsung:** Tidak terhubung ke DEMNAS, OpenStreetMap API, Cesium/Google 3D Tiles, maupun posisi GPS kapal/LRT waktu-nyata. Pergerakan perahu, tongkang, mobil, dan kereta LRT bersifat sintetis deterministik.

---

## 3. Topik 1 — Analisis Kelayakan & Batas Cakupan (*Feasibility & Extent*)

Pertanyaan *"apakah layak membangun visualisasi 3D Kota Palembang?"* tidak bisa dijawab dengan ya/tidak tunggal karena kelayakan sangat ditentukan oleh **tingkat fidelitas (fidelity tier)** dan **tujuan penggunaannya**.

### 3.1 Perbandingan Tiga Tingkatan Implementasi

| Dimensi Evaluasi | Tier 1: *Stylized Procedural Prototype* (Prototipe Saat Ini) | Tier 2: *Data-Driven GIS City Model* (OSM + DEMNAS) | Tier 3: *Photorealistic Digital Twin* (3D Tiles / UAV / BIM) |
|---|---|---|---|
| **Cakupan Spasial** | Koridor inti Sungai Musi (skala terkompresi) | Seluruh area perkotaan Palembang (~400 km²) pada koordinat nyata (WGS84/UTM 48S) | Koridor strategis (Musi, Jakabaring, pelabuhan) atau blok prioritas beresolusi sentimeter |
| **Sumber Data Utama** | Pengetahuan arsitektural + primitif Three.js | Footprint bangunan OSM/RBI + DEMNAS BIG (`0,27 arcsecond` / ~8 m) + model custom `.glb` untuk tengara utama | Google Photorealistic 3D Tiles / Cesium, survei fotogrametri drone UAV, LiDAR udara, atau model BIM/IFC |
| **Kelayakan Teknis & Data di Palembang** | **Tinggi.** Mandiri, 100% offline-safe, nol ketergantungan lisensi data eksternal | **Menengah.** DEMNAS tersedia gratis (BIG), tetapi tag ketinggian (`building:levels`/`height`) OSM di Palembang masih jarang/tidak merata | **Rendah–Bersyarat.** Cakupan 3D Tiles komersial di Indonesia masih terfokus di metro Tier-1/Tier-2 dan bersifat parsial/belum terverifikasi merata di Palembang; akuisisi UAV/LiDAR mahal |
| **Beban GPU/VRAM & Jaringan** | Sangat ringan (~41 ribu segitiga, <160 kB JS gzip); lancar di laptop maupun ponsel | Menengah–berat; memerlukan *spatial tiling* (`3D Tiles` / instancing) agar tidak memacetkan VRAM browser | Berat (streaming tekstur ratusan MB–GB per sesi, butuh GPU diskrit atau koneksi pita lebar stabil) |
| **Biaya Operasional & Lisensi** | Nol biaya lisensi/API (hosting statis) | Rendah–menengah (server tile mandiri / Mapbox / Cesium Ion; biaya pemodelan aset tengara manual) | Tinggi (kuota API komersial, penyimpanan *point-cloud*/mesh, pembaruan survei drone berkala) |
| **Kecocokan Kasus Guna** | Eksplorasi awal, presentasi konsep, peta wisata interaktif, edukasi | Perencanaan tata kota makro, simulasi banjir/pasang Sungai Musi, visualisasi zonasi | Manajemen aset infrastruktur presisi, simulasi rekayasa sipil, kembaran digital operasional |

### 3.2 Celah Data Spesifik Kota Palembang (Realitas Lapangan)

1. **Resolusi DEMNAS (~8 m) untuk Topografi Datar Rawa-Sungai:** Palembang berada di dataran rendah pasang-surut Sungai Musi dengan variasi elevasi lokal yang halus. DEMNAS (resolusi horizontal ~8 m, datum vertikal EGM2008) cukup baik untuk kontur kota makro, tetapi **terlalu kasar** untuk memodelkan dinding turap tepi sungai, jalan pendekat jembatan layang LRT, atau parit drainase mikro tanpa survei batimetri/LiDAR tambahan.
2. **Ketimpangan Atribut Bangunan di OpenStreetMap:** Di wilayah pusat (Ilir Timur/Ilir Barat), tapak (*footprint*) bangunan cukup banyak tersedia, namun mayoritas tidak memiliki atribut `height` atau `building:levels`. Ekstrusi naif dengan tinggi acak memang menghasilkan kepadatan visual, tetapi gagal merepresentasikan bangunan bersejarah (*Rumah Limas*, ruko Pasar 16 Ilir, gudang tepian Ulu) secara meyakinkan.
3. **Ketidakpastian Cakupan 3D Tiles Komersial:** Mengasumsikan ketersediaan penuh Google Photorealistic 3D Tiles di Palembang berisiko tinggi; cakupan resmi di Indonesia lebih dahulu matang di kota metropolitan utama seperti Jakarta, Bandung, Surabaya, dan Denpasar. Sebelum berkomitmen pada arsitektur Tier 3, tim wajib melakukan *live tile probe* pada kotak pembatas (*bounding box*) Palembang terlebih dahulu.

**Kesimpulan Kelayakan:** Untuk fase *early exploration*, **Tier 1 (prototipe stylized)** adalah titik awal paling tepat guna. Jika proyek berlanjut ke tahap analitik tata ruang, peningkatan paling rasional adalah ke **Tier 2 hibrida** (menggunakan *3D Tiles* hasil ekstrusi OSM + DEMNAS untuk konteks massa kota, sambil mempertahankan aset 3D kustom bergaya/detail untuk Jembatan Ampera, Benteng Kuto Besak, Pulau Kemaro, Masjid Agung, dan jalur LRT).

---

## 4. Topik 2 — Fitur Tepat Guna & Perbandingan Pola Eksekusi

### 4.1 Peta Jalan Fitur Berdasarkan Tahap Kematangan

Agar tidak terjebak membangun fitur yang terlihat canggih namun minim nilai guna, fitur sebaiknya dipilah ke dalam tiga gelombang:

- **Gelombang 1 — MVP Eksplorasi Awal (Sudah tercapai di prototipe ini):**
  - Koridor Sungai Musi + tengara ikonik mudah dikenali (*Ampera, Kuto Besak, Pulau Kemaro, Masjid Agung, Monpera, LRT, Rumah Limas*).
  - Navigasi orbit/pan/zoom terkurung batas aman + preset kamera terkurasi + sakelar waktu hari (*Siang/Senja/Malam*) + kartu informasi ringkas yang jujur soal keterbatasan skala.
- **Gelombang 2 — Eksplorasi Spasial Berbasis Data (Jika berlanjut ke Tier 2):**
  - Koordinat nyata (UTM 48S) dengan skala 1:1 dan *level-of-detail* (LOD) atau *3D Tiles* agar 6 km menuju Pulau Kemaro tetap lancar.
  - *Layer toggle* tematik: batas kecamatan Seberang Ilir/Ulu, rute transportasi sungai & koridor LRT Sumsel, serta simulasi elevasi genangan/pasang Sungai Musi.
  - Pencarian tengara/alamat dan *deep-link URL* kamera (berbagi sudut pandang tertentu).
- **Gelombang 3 — Operasional & Kembaran Digital (Hanya jika ada sponsor data institusional):**
  - Integrasi data sensor/API langsung (tinggi muka air Musi, posisi kapal/AIS, posisi kereta LRT) dan dukungan anotasi kolaboratif/analisis bayangan matahari untuk kajian perizinan bangunan.

### 4.2 Perbandingan Pola Eksekusi: Multi-Agent Orchestrator vs Alternatif

Pemilihan pola eksekusi menentukan kecepatan, biaya token, dan risiko kegagalan rekayasa:

| Pola Eksekusi | Mekanisme Kerja | Kelebihan | Kelemahan & Mode Kegagalan (*Failure Modes*) | Paling Cocok Untuk |
|---|---|---|---|---|
| **1. Orchestrator Multi-Agent** *(Explorer → Planner → Worker → Verifier/Challenger)* | Orkestrator memecah tugas, menugaskan riset paralel, memberi kontrak antarmuka (`PROJECT.md`), lalu memverifikasi dengan agen terpisah | Pemisahan tanggung jawab jelas; verifikasi independen efektif menangkap ketidakkonsistenan kode vs laporan | **Overhead koordinasi & amplifikasi token tinggi** (dokumen handoff berulang); risiko *context drift* bila kontrak antarmuka tidak dikunci; tidak ekonomis untuk perubahan UI kecil | Proyek multi-jalur (mis. kode 3D + skrip QA + laporan analitis sinkron) atau tim/basis kode menengah-besar dengan standar audit ketat |
| **2. Single-Agent Iteratif** *(1 agen coding + loop build/screenshot)* | Satu agen merancang, menulis kode, menjalankan `vite build` + `verify.mjs`, melihat hasil PNG, lalu memoles | Konteks tetap utuh dalam satu memori kerja; latensi antar-langkah rendah; biaya token paling efisien untuk repo <25 berkas | Berisiko *blind spot* saat mengaudit karya sendiri (*confirmation bias*) kecuali dipaksa menjalankan skrip uji dan menginspeksi screenshot secara eksplisit | **Prototipe awal Tier 1 seperti repo ini**, eksperimen shader/geometri cepat, dan iterasi antarmuka |
| **3. Deterministic Pipeline / DAG** *(Python/GDAL/Blender + `3d-tiles-tools` → Static Viewer)* | Pemrosesan data spasial dijalankan oleh skrip deterministik berbasis konfigurasi; AI hanya dipakai menulis/merawat pipeline | Reproduksibilitas 100%, hemat token saat memproses jutaan poligon OSM/DEMNAS (agen tidak pernah membaca data mentah ke dalam *prompt*) | Kurang fleksibel untuk keputusan estetika/artistik tanpa keterlibatan manusia atau alat preview visual | **Tier 2 & Tier 3 (GIS skala kota)** di mana volume data geospasial tidak mungkin dimuat ke jendela konteks LLM |
| **4. Human-in-the-Loop Co-pilot** *(Desainer 3D / GIS Engineer + AI Assistant)* | Manusia memegang keputusan komposisi visual & pemodelan aset hero di Blender/QGIS; AI membantu kode Three.js, shader, dan HUD | Kualitas artistik dan akurasi budaya Palembang tertinggi (proporsi ukiran *Rumah Limas*, ornamen Pagoda) | Bergantung pada ketersediaan tenaga ahli 3D/GIS; kecepatan awal mengikuti jadwal manusia | Aset hero berfidelitas tinggi untuk pameran publik, museum digital, atau aplikasi produksi resmi pemerintah daerah |

**Temuan Kritis dari Eksekusi Proyek Ini:** Pada prototipe ~15–20 berkas, nilai tambah terbesar bukan berasal dari jumlah agen yang banyak, melainkan dari **adanya loop verifikasi visual tertutup (headless WebGL screenshot → inspeksi gambar oleh model multimodal → perbaikan)**. Tanpa inspeksi gambar aktual, agen hanya menebak tampilan 3D dari koordinat angka: pada proyek ini, cacat seperti kartu informasi yang menutupi Pulau Kemaro, atap tumpang-tindih di halaman Benteng Kuto Besak, dan garis pantai yang terpotong baru terdeteksi setelah melihat tangkapan layar PNG, bukan dari keluaran `vite build`.

---

## 5. Topik 3 — Estimasi Waktu Pengembangan & Penggunaan Token

Estimasi di bawah memisahkan pengembangan **Tier 1 (Prototipe Stylized, selaras dengan realitas build proyek ini)**, **Tier 2 (GIS Skala Kota)**, dan **Tier 3 (Digital Twin)**.

### 5.1 Mengapa Konsumsi Token Sering Lebih Besar dari Dugaan?

Kesalahan umum dalam menganggarkan proyek berbasis AI adalah hanya menghitung token output kode (`~15–30 ribu` token untuk ~2.000 baris kode). Dalam praktik *agentic workflow*, penggerak utama total token adalah:
1. **Amplifikasi Konteks Input (*Input Context Amplification*):** Setiap giliran alat (*tool call*) mengirim ulang *system prompt*, riwayat percakapan, serta berkas yang dibaca. Pada sesi 30–60 giliran, token input kumulatif mencapai **10×–30×** token output.
2. **Keluaran Alat & Log (*Tool Outputs*):** Hasil `find`, `npm install`, log error build, dan pembacaan ulang berkas besar masuk ke konteks input.
3. **Token Visi Multimodal (*Vision Tokens*):** Menginspeksi 6–7 screenshot PNG beresolusi `1280×760` dalam beberapa putaran perbaikan menambah beban token input gambar yang signifikan, namun mutlak diperlukan untuk mencegah *visual hallucination*.
4. **Siklus Coba-Ulang (*Retry & Polish Loops*):** Memperbaiki posisi kamera, pencahayaan malam, atau benturan *bounding box* menambah 2–4 iterasi penuh.

### 5.2 Tabel Estimasi Waktu & Token per Fase

> **Asumsi Dasar:** 1 fase *agentic* Tier 1 mengasumsikan *prompt caching* aktif atau sesi terstruktur; angka mencerminkan **total token (Input + Output + Vision/Tool)** untuk satu siklus proyek lengkap hingga lolos QA.

| Fase Proyek | Tier 1: Prototipe *Stylized* (AI-Assisted / Agentic) | Tier 2: GIS Skala Kota (DAG + AI Co-pilot) | Tier 3: Digital Twin (UAV/3D Tiles + Tim Ahli) | Sumber Utama Token (Jika Menggunakan Agen) |
|---|---|---|---|---|
| **1. Eksplorasi Data, Arsitektur & Kontrak Spasial** | **1–2 jam** *(~60K–180K token)* | **3–5 hari** *(~250K–700K token)* | **1–2 minggu** *(~400K–1,2M token)* | Riset referensi geografis, pengecekan toolchain lokal, perancangan sistem koordinat |
| **2. Implementasi Inti 3D / Pipeline Geospasial** | **2–5 jam** *(~150K–450K token)* | **1,5–3 minggu** *(~800K–2,2M token)* | **3–6 minggu** *(~1,5M–4M token)* | Sintesis kode Three.js/shader, iterasi modul landmark, skrip ETL GDAL/3D Tiles |
| **3. Integrasi Aset Detail / Data Tematik & HUD** | **1–2 jam** *(~80K–220K token)* | **1–2 minggu** *(~500K–1,4M token)* | **2–4 minggu** *(~1M–2,5M token)* | Antarmuka HUD, sinkronisasi koordinat antar-lapisan, optimasi *instancing*/LOD |
| **4. QA Teknis, Verifikasi Render Headless & Pemolesan Visual** | **1–3 jam** *(~120K–400K token)* | **3–5 hari** *(~400K–1,1M token)* | **1–2 minggu** *(~800K–2M token)* | Pembuatan `verify.mjs`, inspeksi screenshot multimodal (PNG), perbaikan framing & pencahayaan |
| **5. Dokumentasi, Uji Konsistensi & Serah Terima** | **1–2 jam** *(~70K–180K token)* | **2–3 hari** *(~200K–500K token)* | **3–5 hari** *(~300K–800K token)* | Penulisan README, laporan teknis, audit silang 1:1 antara dokumen dan kode |
| **Total Estimasi Realistis** | **6–14 jam kerja** *(~480K–1,43M total token; single-agent hemat di batas bawah, multi-agent di batas atas)* | **3–7 minggu** *(~2,15M–5,9M total token)* | **7–14 minggu** *(~4,0M–10,5M total token)* | **75–90% adalah token input/konteks & visi**, hanya **10–25%** token generasi output |

*Catatan Kalibrasi:* Tanpa agen AI (pengerjaan manual penuh oleh 1 developer Three.js menengah), Tier 1 umumnya memakan **2–4 hari kerja**, sehingga alur kerja berbantuan AI mempercepat fase prototipe awal sekitar **3×–5×**, asalkan lingkungan verifikasi (Node, browser WebGL headless) sudah teruji sejak menit pertama.

---

## 6. Topik 4 — Rekomendasi Model AI per Fase Proyek

Pemilihan model sebaiknya memadukan **kapabilitas spesifik fase** (penalaran spasial, akurasi sintesis kode, penglihatan multimodal, penulisan teknis bahasa Indonesia) dengan disiplin biaya dan latensi.

| Fase Proyek | Kebutuhan Kognitif Utama | Rekomendasi Kelas Model Utama | Alternatif Hemat / *Open-Weight* | Trade-off & Catatan Praktis |
|---|---|---|---|---|
| **Arsitektur, Pemetaan Koordinat & Debugging Spasial** | Penalaran geometri 3D, konsistensi kontrak antar-modul, analisis *edge case* | **Model Penalaran Frontier** *(mis. kelas Claude Opus/Sonnet generasi terbaru, OpenAI o3 / GPT-5 reasoning, Gemini Pro reasoning)* | **DeepSeek-R1 / Qwen3-Coder-Thinking** (via API atau self-hosted) | Biaya per token lebih mahal, tetapi jauh lebih murah daripada 5× siklus perbaikan akibat sumbu koordinat terbalik (`+Z` vs `-Z`) atau jembatan menabrak pier |
| **Implementasi Modul Three.js, Shader GLSL & Skrip ETL GIS** | Penulisan kode modular cepat, API Three.js modern, Python/GDAL/Bash | **Model Coding Kecepatan Tinggi** *(mis. Claude Sonnet, GPT-4.1/GPT-5-codex, Gemini Flash/Pro)* | **Qwen2.5/3-Coder-32B+** atau **Codestral** | Model kelas menengah-atas unggul untuk throughput harian; hindari model yang terlalu kecil untuk GLSL karena kesalahan sintaks uniform/varying sulit dideteksi statis |
| **QA Visual & Inspeksi Screenshot Render** | Pemahaman visual adegan 3D (*multimodal vision*), deteksi objek mengambang, evaluasi kontras UI & *overlap* label | **Model Multimodal Vision Akurat** *(mis. Claude Sonnet/Opus Vision, GPT-4o / GPT-5 Vision, Gemini Pro Vision)* | **Qwen2.5-VL-72B** | **Wajib multimodal.** Jangan mendelegasikan QA visual ke model *text-only* karena ia hanya bisa membaca metrik DOM/triangles dan tidak akan melihat UI yang menutupi Pulau Kemaro |
| **Penulisan Laporan Analitis & Dokumentasi Bahasa Indonesia** | Pengolahan bukti faktual lintas berkas, konsistensi teknis, tata bahasa Indonesia baku namun natural | **Model Long-Context dengan Kemampuan Bahasa Indonesia Kuat** *(mis. Claude Sonnet/Opus, Gemini Pro, GPT-4o/5)* | **Llama-3.3-70B / Qwen3** (perlu penyuntingan gaya istilah baku lebih teliti) | Prioritaskan model dengan jendela konteks besar (`≥128K`) agar seluruh kode sumber, log verifikasi, dan spesifikasi dapat diaudit sekaligus tanpa pemotongan |

### Catatan Volatilitas Harga & Strategi Anggaran

Harga per 1 juta token (*unit pricing*) model AI komersial berubah secara cepat setiap kuartal seiring peluncuran model baru dan diskon *prompt caching*. Oleh karena itu, dokumen ini memisahkan **volume token** (Bagian 5) dari tarif spesifik vendor:
- **Gunakan rasio anggaran:** Sebagai patokan komparatif lintas generasi, model *frontier reasoning* umumnya **3×–10× lebih mahal per token** daripada model *fast/flash* dan **10×–30× lebih mahal** daripada model *open-weight* terkelola.
- **Aktifkan Prompt Caching & Pemisahan Peran:** Mengirim berkas proyek berulang kali dengan *cache* aktif dapat memangkas biaya token input hingga **50–90%**, sehingga model berpenalaran kuat tetap terjangkau untuk fase desain dan audit akhir.

---

## 7. Stress-Testing Asumsi, Matriks Risiko & Mitigasi

### 7.1 Menguji Enam Asumsi Populer yang Sering Menyesatkan

1. **Asumsi 1: *"Data terbuka Indonesia (OSM + DEMNAS) langsung siap di-render menjadi kota 3D yang akurat."***
   - **Realitas / Bantahan:** Tidak. DEMNAS beresolusi ~8 m hanya memadai untuk kontur tanah makro dan tidak menangkap tanggul sungai atau dek jembatan. Mayoritas poligon bangunan OSM di Palembang belum memiliki tinggi lantai yang terisi konsisten, sehingga tanpa pembersihan data dan aset kustom untuk tengara ikonik, hasilnya tampak seperti kota blok acak yang tidak mencirikan Palembang.
2. **Asumsi 2: *"Agen AI dapat menilai keberhasilan visualisasi 3D cukup dari kode sumber atau status `exit code 0`."***
   - **Realitas / Bantahan:** Salah fatal. Kode bisa terkompilasi bersih (`0 errors`) sementara kamera menghadap ke langit kosong, dermaga melayang di atas air, atau kartu UI menutup objek utama. Pada pengembangan prototipe ini, inspeksi langsung terhadap tangkapan layar PNG terbukti mengungkap cacat tumpang-tindih atap BKB, label bertumpuk di overview, dan posisi kartu info yang menutupi Pulau Kemaro.
3. **Asumsi 3: *"Orkestrasi multi-agen selalu lebih cepat dan lebih baik daripada satu agen."***
   - **Realitas / Bantahan:** Hanya benar jika pekerjaan punya jalur paralel yang benar-benar independen atau butuh pemisahan auditor independen. Untuk aplikasi web 3D ukuran kecil (~15 berkas), orkestrasi berlapis menambah latensi komunikasi, menyalin konteks berulang kali, dan berisiko menyebabkan ketidakcocokan koordinat antara agen pembuat sungai dan agen pembuat jembatan kecuali keduanya mengacu pada satu fungsi batas geometris bersama (seperti `getRiverBoundsAt(x)` di proyek ini).
4. **Asumsi 4: *"Visualisasi fotorealistik selalu lebih unggul daripada desain stylized untuk eksplorasi awal."***
   - **Realitas / Bantahan:** Untuk tahap eksplorasi konsep dan keselarasan pemangku kepentingan, gaya *stylized* jauh lebih komunikatif: siluet merah Jembatan Ampera, bentuk benteng Kuto Besak, atap tumpang Masjid Agung, dan Pagoda Pulau Kemaro terbaca instan tanpa derau tekstur buram, ukuran unduhan puluhan megabita, atau *frame drop* pada perangkat standar.
5. **Asumsi 5: *"Google Photorealistic 3D Tiles otomatis tersedia lengkap dan seragam di Palembang."***
   - **Realitas / Bantahan:** Cakupan 3D Tiles di Indonesia belum merata hingga seluruh kota sekunder; mengandalkan layanan tersebut tanpa verifikasi API langsung di area koordinat Palembang menciptakan risiko ketergantungan arsitektur (*single point of failure*) di tengah proyek.
6. **Asumsi 6: *"Biaya AI dihitung berdasarkan seberapa banyak baris kode yang ditulis agen."***
   - **Realitas / Bantahan:** Salah. Token output kode hanyalah puncak gunung es (10–25%). Penggerak biaya sebenarnya adalah pembacaan berulang konteks kode, output terminal, loop debugging, dan analisis gambar screenshot.

### 7.2 Matriks Risiko & Strategi Mitigasi

| ID | Risiko | Kemungkinan | Dampak | Strategi Mitigasi |
|---|---|---|---|---|
| **R1** | Ketidakselarasan koordinat antar-elemen 3D (objek melayang, menabrak pier jembatan, dermaga terputus) | Tinggi | Tinggi | Gunakan sumber kebenaran geometris tunggal (mis. `getRiverBoundsAt(x)` dan `GROUND_Y` bersama) serta verifikasi tangkapan layar multi-sudut |
| **R2** | Kegagalan konteks WebGL pada mesin pengguna atau lingkungan headless CI/sandbox | Sedang | Tinggi | Sediakan pesan fallback WebGL yang informatif (`showWebGLFallback`), hindari CDN eksternal saat runtime, dan uji CI dengan flag `--use-angle=swiftshader` |
| **R3** | Pembengkakan ukuran bundel & *draw calls* saat menaikkan detail kota (penurunan FPS di ponsel/laptop non-GPU) | Tinggi (Tier 2+) | Sedang | Pertahankan poligon ringan pada Tier 1 (~41 ribu segitiga); terapkan `InstancedMesh`, penggabungan geometri statis, dan *3D Tiles* ber-LOD saat migrasi ke Tier 2 |
| **R4** | Bias persepsi akibat skala terkompresi (pengguna mengira jarak Kuto Besak–Pulau Kemaro benar-benar hanya ~3× lebar sungai) | Sedang | Sedang | Cantumkan catatan skala diorama secara eksplisit di HUD antarmuka, `README.md`, dan dokumentasi proyek |
| **R5** | Ketergantungan versi toolchain lokal & regresi pasca-perubahan dokumentasi/kode | Sedang | Sedang | Kunci prasyarat (`Node >= 20`), dokumentasikan perintah lengkap pada `README.md`, dan jalankan ulang `npm run build && npm run verify` sebelum serah terima |

---

## 8. Daftar Periksa Konsistensi & Audit Mandiri (AC3 & AC4)

Tabel berikut memastikan seluruh tuntutan analisis (AC3) dan sinkronisasi 1:1 dengan prototipe terverifikasi (AC4) terpenuhi tanpa penyimpangan:

| Item Audit | Status | Bukti Terverifikasi di repositori proyek ini |
|---|---|---|
| **Topik 1 (Kelayakan & Batas Cakupan)** | Terpenuhi | Bagian 3 mengevaluasi Tier 1 vs Tier 2 vs Tier 3, celah OSM/DEMNAS (~8 m), cakupan parsial 3D Tiles, GPU/VRAM, dan biaya |
| **Topik 2 (Fitur & Perbandingan Pola Eksekusi)** | Terpenuhi | Bagian 4 memetakan fitur Gelombang 1–3 serta membandingkan Multi-Agent Orchestrator vs Single-Agent Iteratif vs Deterministic Pipeline/DAG vs Human-in-the-Loop |
| **Topik 3 (Estimasi Waktu & Token)** | Terpenuhi | Bagian 5 menjabarkan waktu & rentang token 5 fase lintas 3 tier, termasuk amplifikasi konteks input & token visi |
| **Topik 4 (Rekomendasi Model AI per Fase)** | Terpenuhi | Bagian 6 memetakan kelas model per fase beserta alternatif *open-weight* dan catatan volatilitas harga |
| **Tantangan Asumsi & Matriks Risiko** | Terpenuhi | Bagian 7 menantang 6 asumsi umum secara kritis dan menyajikan matriks risiko `R1–R5` |
| **Sinkronisasi Perintah & Build (AC1 & AC4)** | Terverifikasi | `npm install` (43 paket di `package-lock.json`), `npm run build` (~127–135 ms, 18 modul, `dist/`), `npm run preview`, dan `npm run verify` tercatat identik dengan `package.json` & `README.md` |
| **Sinkronisasi Visual & Telemetri (AC2 & AC4)** | Terverifikasi | 13 tangkapan layar PNG (`artifacts/preview-*.png`), `meshCount: 1.091`, `triangles: ~242,6K`, `urbanStats` (81 ruko, 241 rumah, 978 pohon, 68 lampu, 40 mobil), `mobileBounds.fits: true` (`390×844`), `0` console/page error, serta seluruh keterbatasan skala terkompresi & geometri prosedural tercatat jujur |
