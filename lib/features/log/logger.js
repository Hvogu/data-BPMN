let logInstance = null;

export function setLogger(instance) {
    logInstance = instance;
}

export function getLogger() {
    return logInstance;
}