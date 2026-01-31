export function initialSession() {
    return {
        currentAction: 'idle',
        step: 'idle',
        filePaths: [],
        tempParams: {}
    };
}
