const express = require('express');
const router = express.Router(); 
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// --- KONFIGURASI PATH ---
// Mencari file di dalam folder 'harga'
const DB_PATH = path.join(__dirname, 'data_harga.csv'); 
const BACKUP_DIR = path.join(__dirname, 'backup');

// Helper untuk membuat CSV Writer (supaya tidak nulis ulang terus)
const getCsvWriter = (append = false) => {
    return createCsvWriter({
        path: DB_PATH,
        header: [
            {id: 'No', title: 'No'},
            {id: 'nama', title: 'nama'},
            {id: 'harga', title: 'harga'},
            {id: 'exp', title: 'exp'},
        ],
        append: append
    });
};

// Fungsi ambil data dari CSV
const getData = () => {
    return new Promise((resolve) => {
        const results = [];
        if (!fs.existsSync(DB_PATH)) return resolve([]);
        
        fs.createReadStream(DB_PATH)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                // Sortir berdasarkan nama (A-Z)
                const sorted = results.sort((a, b) => 
                    (a.nama || "").toLowerCase().localeCompare((b.nama || "").toLowerCase())
                );
                resolve(sorted);
            });
    });
};

// --- ROUTES ---

// 1. Halaman Utama (Akses: localhost:5000/harga)
router.get('/', async (req, res) => {
    const items = await getData();
    // Render file: harga/halaman_harga.ejs
    res.render('harga/halaman_harga', { items: items });
});

// 2. Tambah Harga
router.post('/add', async (req, res) => {
    const { nama, harga, exp } = req.body;
    const items = await getData();
    
    const newRecord = {
        No: items.length + 1,
        nama: nama,
        harga: harga,
        exp: exp || '-'
    };

    const csvWriter = getCsvWriter(true); // mode append (tambah di bawah)
    await csvWriter.writeRecords([newRecord]);
    
    res.redirect('/harga'); 
});

// 3. Edit Harga
router.post('/edit', async (req, res) => {
    const { nama_lama, nama, harga, exp } = req.body;
    let items = await getData();

    items = items.map(item => {
        if (item.nama === nama_lama) {
            return { No: item.No, nama: nama, harga: harga, exp: exp };
        }
        return item;
    });

    const csvWriter = getCsvWriter(); // mode overwrite (tulis ulang file)
    await csvWriter.writeRecords(items);
    
    res.redirect('/harga');
});

// 4. Hapus Harga
router.get('/delete/:nama', async (req, res) => {
    const namaTarget = req.params.nama;
    let items = await getData();
    const filteredItems = items.filter(item => item.nama !== namaTarget);

    const csvWriter = getCsvWriter(); 
    await csvWriter.writeRecords(filteredItems);
    
    res.redirect('/harga');
});

// 5. Backup Data
router.post('/backup', (req, res) => {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const dest = path.join(BACKUP_DIR, `data_harga_${ts}.csv`);
    
    try {
        fs.copyFileSync(DB_PATH, dest);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
