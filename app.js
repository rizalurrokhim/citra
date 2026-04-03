const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

// --- 1. SETTING SESSION (SISTEM LOGIN) ---
app.use(session({
    secret: 'kca-papua-2026', // Kunci enkripsi session
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // Login aktif selama 1 jam
}));

// --- 2. MIDDLEWARE DASAR ---
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

// --- 3. SETTING VIEW ENGINE ---
app.set('view engine', 'ejs');
app.set('views', __dirname);

// --- 4. LOGIKA SATPAM (AUTH CHECK) ---
// Fungsi ini menjaga agar halaman tidak bisa dibuka tanpa login
const periksaLogin = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next(); // Lanjut ke halaman jika sudah login
    } else {
        res.redirect('/login'); // Tendang ke login jika belum
    }
};

// --- 5. RUTE LOGIN & LOGOUT ---
app.get('/login', (req, res) => {
    res.render('halaman_login', { pesan: '' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // SILAKAN GANTI USERNAME & PASSWORD DI SINI
    if (username === 'rizal' && password === 'awikwok') {
        req.session.isLoggedIn = true;
        res.redirect('/');
    } else {
        // Balikkan ke login dengan pesan error
        res.render('halaman_login', { pesan: 'Kamu Siapa?' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- 6. PENDAFTARAN ROUTER (SEMUA DILINDUNGI LOGIN) ---
const hargaRouter = require('./harga/logic_harga');
const stockRouter = require('./stock/logic_stock');
const keuanganRouter = require('./keuangan/logic_keuangan');

// Pasang periksaLogin di setiap rute agar aman
app.use('/harga', periksaLogin, hargaRouter);
app.use('/stock', periksaLogin, stockRouter);
app.use('/keuangan', periksaLogin, keuanganRouter);

// Akses file statis (gambar/css)
app.use(express.static(path.join(__dirname)));

// --- 7. HALAMAN UTAMA (DILINDUNGI LOGIN) ---
app.get('/', periksaLogin, (req, res) => {
    res.render('halaman_awal');
});

// --- 8. RUN SERVER ---
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`   KCA CENTRAL SYSTEM - PROTECTED        `);
    console.log(`   Port: ${PORT} | Mode: Termux Android  `);
    console.log(`   Status: Login System Active ✅        `);
    console.log(`=========================================`);
});
