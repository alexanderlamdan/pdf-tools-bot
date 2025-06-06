import "dotenv/config";

if(!process.env.BOT_TOKEN){

	throw new Error('BOT_TOKEN is not find in the .env file');

}

export const config = {

	token: process.env.BOT_TOKEN,
	path: process.env.WEBHOOK_PATH || "/bot/pdf-tools",
	mode: process.env.MODE || "webhook",
	adminId:Number(process.env.ADMIN_ID || 0),
	port: Number(process.env.PORT) || 3003

};
