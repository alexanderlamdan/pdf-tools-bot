import {localConfig} from './index.js';
export const config = {

	token: localConfig.bot_token,
	path: localConfig.url_path || "/bot/pdf-tools",
	mode: localConfig.mode || "webhook",
	adminId:Number(localConfig.admin_chat_id || 0),
	port: Number(localConfig.port) || 3002

};
