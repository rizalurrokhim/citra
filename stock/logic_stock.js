const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// --- PERBAIKAN PATH (Disesuaikan dengan screenshot kamu) ---
// Filenya ada di folder yang sama dengan logic_stock.js
const DATA_PATH = path.join(__dirname, 'data_stock.csv');
const LOG_PATH = path.join(__dirname, 'riwayat_stock.csv');

console.log("🔍 Cek lokasi file CSV:");
console.log("📍 Path Stock:", DATA_PATH);
console.log("❓ File Ada?", fs.existsSync(DATA_PATH) ? "ADA ✅" : "TIDAK ADA ❌");

// --- FUNGSI BACA CSV ---
const readCSV = (filePath) => {
    return new Promise((resolve) => {
        const results = [];
        if (!fs.existsSync(filePath)) return resolve([]);
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const cleanRow = {};
                Object.keys(data).forEach(key => {
                    cleanRow[key.trim()] = data[key] ? data[key].trim() : "";
                });
                results.push(cleanRow);
            })
            .on('end', () => resolve(results))
            .on('error', () => resolve([]));
    });
};

// --- FUNGSI TULIS DATA ---
const writeData = async (data) => {
    const writer = createCsvWriter({
        path: DATA_PATH,
        header: [
            {id: 'No', title: 'No'},
            {id: 'nama', title: 'nama'},
            {id: 'stock', title: 'stock'},
            {id: 'satuan', title: 'satuan'}
        ]
    });
    const formatted = data.map((item, index) => ({
        No: index + 1,
        nama: item.nama,
        stock: item.stock,
        satuan: item.satuan
    }));
    await writer.writeRecords(formatted);
};

// --- FUNGSI TULIS LOG ---
const writeLog = async (logEntry) => {
    const isNew = !fs.existsSync(LOG_PATH);
    const writer = createCsvWriter({
        path: LOG_PATH,
        header: [
            {id: 'tanggal', title: 'tanggal'},
            {id: 'nama', title: 'nama'},
            {id: 'aksi', title: 'aksi'},
            {id: 'jumlah', title: 'jumlah'},
            {id: 'keterangan', title: 'keterangan'}
        ],
        append: !isNew
    });
    await writer.writeRecords([logEntry]);
};

// --- ROUTES ---

router.get('/', async (req, res) => {
    const stock = await readCSV(DATA_PATH);
    const logs = await readCSV(LOG_PATH);
    res.render('stock/halaman_stock', { stock, logs: logs.reverse() });
});

router.post('/add-new', async (req, res) => {
    const { nama, satuan, stock_awal } = req.body;
    let data = await readCSV(DATA_PATH);
    data.push({ nama: nama.trim(), stock: stock_awal || 0, satuan: satuan.trim() });
    await writeData(data);
    await writeLog({
        tanggal: new Date().toLocaleString('id-ID'),
        nama, aksi: 'Baru', jumlah: stock_awal, keterangan: 'Pendaftaran baru'
    });
    res.redirect('/stock');
});

router.post('/update', async (req, res) => {
    const { nama, perubahan, aksi, keterangan } = req.body;
    let data = await readCSV(DATA_PATH);
    let nChange = parseInt(perubahan) || 0;
    data = data.map(item => {
        if (item.nama === nama) {
            let current = parseInt(item.stock) || 0;
            item.stock = (aksi === 'Masuk') ? current + nChange : current - nChange;
        }
        return item;
    });
    await writeData(data);
    await writeLog({
        tanggal: new Date().toLocaleString('id-ID'),
        nama, aksi, jumlah: (aksi === 'Masuk' ? '+' : '-') + nChange, keterangan
    });
    res.redirect('/stock');
});

router.post('/hapus', async (req, res) => {
    const { nama } = req.body;
    let data = await readCSV(DATA_PATH);
    const filteredData = data.filter(item => item.nama !== nama);
    await writeData(filteredData);
    await writeLog({
        tanggal: new Date().toLocaleString('id-ID'),
        nama, aksi: 'Hapus', jumlah: '-', keterangan: 'Barang dihapus'
    });
    res.redirect('/stock');
});

module.exports = router;
