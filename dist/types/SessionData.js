export function initialSession() {
    return {
        currentAction: 'idle',
        step: 'idle',
        filePaths: [],
        tempParams: {},
        lastRequestTime: 0,
        adminMode: false,
        simulateUser: false
    };
}
