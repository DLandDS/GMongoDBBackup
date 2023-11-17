export default async function createPromise<T>(){
    let resolveFunction: (value: T) => void;
    let rejectFunction: (reason: any) => void;
    return new Promise<{
        promise: Promise<T>,
        resolve: (value: T) => void,
        reject: (reason: any) => void
    }>((resolve, reject) => {
        const promise = new Promise<T>(function (_resolve, _reject) {
            resolveFunction = _resolve;
            rejectFunction = _reject;
            setTimeout(() => {
                resolve({
                    promise,
                    resolve: resolveFunction,
                    reject: rejectFunction
                } as const);
            });
        });
    });
}