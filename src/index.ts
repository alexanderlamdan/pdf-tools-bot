import fs      from 'fs';
import http    from 'http';
import express from 'express';
import { config }   from './shared/config/config.js';
import { TelegramBot } from './core/TelegramBot.js';

const bot = new TelegramBot();
const app = express();

app.use(express.json());
app.post(config.path, bot.webhookCallback);
app.get('/', (_, res) => res.send('OK'));

/* ───── единственный режим ──── */
const SOCKET = `/run/bots/${config.botName}.sock`;

if (fs.existsSync(SOCKET)) fs.unlinkSync(SOCKET);

http.createServer(app).listen(SOCKET, () => {
	fs.chmodSync(SOCKET, 0o660);           // rw-rw-––
	console.log(`✅ Daily-Vital запущен на ${SOCKET}, webhook: ${config.path}`);
});
