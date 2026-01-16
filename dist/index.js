import fs from 'fs';
import http from 'http';
import express from 'express';
import { LocalConfig } from './config/LocalConfig.js';
import { TelegramBotCore } from './core/TelegramBotCore.js';
const config = new LocalConfig();
const botCore = new TelegramBotCore(config);
const app = express();
app.use(express.json());
app.post(config.path, botCore.getWebhookCallback());
app.get('/', (_, res) => res.send('OK'));
const SOCKET = `/run/bots/${config.botName}.sock`;
if (fs.existsSync(SOCKET))
    fs.unlinkSync(SOCKET);
http.createServer(app).listen(SOCKET, () => {
    fs.chmodSync(SOCKET, 0o660);
    console.log('>>> BOT STARTED <<<');
    console.log(`✅ ${config.botName} запущен на ${SOCKET}, webhook: ${config.path}`);
});
