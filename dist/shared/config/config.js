import "dotenv/config";
if (!process.env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not find in the .env file');
}
export const config = {
    token: process.env.BOT_TOKEN,
    apiRoot: "http://localhost:8081",
    mode: process.env.MODE || "webhook",
    port: Number(process.env.PORT || 3003),
    path: process.env.WEBHOOK_PATH || '/',
    adminId: Number(process.env.ADMIN_ID || 0)
};
