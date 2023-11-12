export default class FixedLengthArray<T> extends Array<T> {
    private maxLength: number;

    constructor(maxLength: number, ...items: T[]) {
        super(...items);
        this.maxLength = maxLength;
    }

    push(...items: T[]): number {
        const newLength = super.push(...items);
        if (newLength > this.maxLength) {
            this.splice(0, newLength - this.maxLength);
        }
        return newLength;
    }

    unshift(...items: T[]): number {
        const newLength = super.unshift(...items);
        if (newLength > this.maxLength) {
            this.splice(this.maxLength, newLength - this.maxLength);
        }
        return newLength;
    }
}

