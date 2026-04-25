export class TelegramBotCoreController {
    botCore;
    constructor(botCore) {
        this.botCore = botCore;
    }
    ;
    getWebhookCallback() {
        return this.botCore.getWebhookCallback();
    }
    startPolling() {
        this.botCore.startPolling();
    }
}
