import fs      from 'fs';
import http    from 'http';
import express from 'express';
import { LocalConfig }           from './config/LocalConfig.js';
import { Postgresql }            from '../shared/src/database/Postgresql.js';
import { TelegramBotCore }       from '../shared/src/core/TelegramBotCore.js';
import { registerLocale }        from '../shared/src/services/LocalizationService.js';
import { locales }               from './locales/index.js';
import { sendCrashAlert }        from '../shared/src/utils/CrashAlert.js';
import { startTrafficResetCron } from '../shared/src/utils/TrafficResetCron.js';

const config = new LocalConfig();
await config.validate();
Postgresql.init(config.db);

registerLocale('en', locales.en);

const botCore = new TelegramBotCore(config);
const app     = express();

app.use(express.json());
app.post(config.path, botCore.getWebhookCallback());
app.get('/', (_, res) => res.send('OK'));

const SOCKET = `/run/bots/${config.botName}.sock`;
if (fs.existsSync(SOCKET)) fs.unlinkSync(SOCKET);

http.createServer(app).listen(SOCKET, async () => {

	fs.chmodSync(SOCKET, 0o660);
	await botCore.init();

	console.log('>>> BOT STARTED <<<');
	console.log(`✅ ${config.botName} running on ${SOCKET}, webhook: ${config.path}`);

	startTrafficResetCron(config, locales);

});

process.on('uncaughtException', async (err) => {
	console.error('[FATAL] uncaughtException:', err);
	await sendCrashAlert(config, 'uncaughtException', err);
	process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
	console.error('[FATAL] unhandledRejection:', reason);
	await sendCrashAlert(config, 'unhandledRejection', reason);
	process.exit(1);
});
