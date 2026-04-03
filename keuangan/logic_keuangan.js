const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const DATA_PATH = path.join(__dirname, 'data_keuangan.csv');

// Fungsi Baca
const readCSV = (filePath) => {
    return new Promise((resolve) => {
        const results = [];
        if (!fs.existsSync(filePath)) return resolve([]);
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    });
};

// Route Utama
router.get('/', async (req, res) => {
    const history = await readCSV(DATA_PATH);
    res.render('keuangan/halaman_keuangan', { history: history.reverse() });
});

// Simpan Pendapatan
router.post('/simpan', async (req, res) => {
    const { pendapatan } = req.body;
    const date = new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });

    const csvWriter = createCsvWriter({
        path: DATA_PATH,
        header: [
            {id: 'Tanggal', title: 'Tanggal'},
            {id: 'Pendapatan', title: 'Pendapatan'}
        ],
        append: fs.existsSync(DATA_PATH)
    });

    await csvWriter.writeRecords([{ Tanggal: date, Pendapatan: pendapatan }]);
    res.redirect('/keuangan');
});

module.exports = router;
