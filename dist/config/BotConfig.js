export class BotConfig {
    token;
    path;
    url;
    adminId;
    botName;
    channelLogId;
    workerSocketPath;
    apiRoot;
    constructor(source) {
        this.token = source.token;
        this.path = source.path;
        this.url = source.url;
        this.adminId = source.adminId;
        this.botName = source.botName;
        this.channelLogId = source.channelLogId;
        this.workerSocketPath = source.workerSocketPath;
        this.apiRoot = source.apiRoot;
    }
}
