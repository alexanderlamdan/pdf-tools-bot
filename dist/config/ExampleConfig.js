export class ExampleConfig {
    token = "1234567890:aaaabbbcccc";
    url = "https://your-domain.com";
    adminId = 1234567890;
    botName = 'bot-name';
    channelLogId = -1001234567890;
    workerSocketPath = '/run/bots/worker-bot.sock';
    apiRoot = 'http://localhost:8081';
    get slug() {
        return this.botName.replace(/-bot$/, '');
    }
    get path() {
        return `/bot/${this.slug}`;
    }
}
