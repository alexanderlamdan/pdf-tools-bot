import { createServer } from 'http';
import { TelegramBot } from './core/TelegramBot.js';
import { config } from './shared/config/config.js';
const telegramBot = new TelegramBot();
const bot = telegramBot.getBot();
const server = createServer((req, res) => {
    if (req.method === 'POST' && req.url === config.path) {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', async () => {
            try {
                const update = JSON.parse(body);
                await bot.handleUpdate(update);
                res.writeHead(200);
                res.end('OK');
            }
            catch (err) {
                console.error('Ошибка в webhook:', err);
                res.writeHead(500);
                res.end('fail');
            }
        });
    }
    else {
        res.writeHead(404);
        res.end();
    }
});
server.listen(config.port, () => {
    console.log(`✅ Webhook-сервер слушает на порту ${config.port}`);
});
