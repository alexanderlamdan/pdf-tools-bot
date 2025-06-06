import express from 'express';
import { config } from './shared/config/config.js';
import { TelegramBot } from './core/TelegramBot.js';

const bot = new TelegramBot();
const app = express();

app.use(express.json()); // вот зачем нужен express — он сам парсит JSON

app.post(config.path, bot.webhookCallback); // '/bot/dailyvital'

app.get('/', (_, res) => res.send('OK')); // простая проверка

app.listen(Number(config.port), () => {
	console.log(`✅ Express сервер слушает порт ${config.port}, путь webhook: ${config.path}`);
});
