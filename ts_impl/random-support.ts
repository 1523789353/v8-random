import { Int64_MAXn } from './data-cast'

class RandomSupport {
    static readonly BAD_SIZE = "size must be non-negative";
    static readonly BAD_DISTANCE = "jump distance must be finite, positive, and an exact integer";
    static readonly BAD_BOUND = "bound must be positive";
    static readonly BAD_FLOATING_BOUND = "bound must be finite and positive";
    static readonly BAD_RANGE = "bound must be greater than origin";

    public static checkStreamSize(streamSize: bigint) {
        if (streamSize < 0n) {
            throw new TypeError(RandomSupport.BAD_SIZE);
        }
    }

    public static checkBoundFloat(bound: number) {
        if (!(0.0 < bound && bound < Number.POSITIVE_INFINITY)) {
            throw new TypeError(RandomSupport.BAD_FLOATING_BOUND);
        }
    }

    public static checkBoundDouble(bound: number) {
        if (!(0.0 < bound && bound < Number.POSITIVE_INFINITY)) {
            throw new TypeError(RandomSupport.BAD_FLOATING_BOUND);
        }
    }

    public static checkBoundInt(bound: number) {
        if (bound <= 0) {
            throw new TypeError(RandomSupport.BAD_BOUND);
        }
    }

    public static checkBoundLong(bound: bigint) {
        if (bound <= 0) {
            throw new TypeError(RandomSupport.BAD_BOUND);
        }
    }

    public static checkBoundULong(bound: bigint) {
        if (bound <= 0 || bound > Int64_MAXn) {
            throw new TypeError(RandomSupport.BAD_BOUND);
        }
    }

    public static checkRangeFloat(origin: number, bound: number) {
        if (!(Number.NEGATIVE_INFINITY < origin && origin < bound &&
            bound < Number.POSITIVE_INFINITY)) {
            throw new TypeError(RandomSupport.BAD_RANGE);
        }
    }

    public static checkRangeDouble(origin: number, bound: number) {
        if (!(Number.NEGATIVE_INFINITY < origin && origin < bound &&
            bound < Number.POSITIVE_INFINITY)) {
            throw new TypeError(RandomSupport.BAD_RANGE);
        }
    }

    public static checkRangeInt(origin: number, bound: number) {
        if (origin >= bound) {
            throw new TypeError(RandomSupport.BAD_RANGE);
        }
    }

    public static checkRangeLong(origin: bigint, bound: bigint) {
        if (origin >= bound) {
            throw new TypeError(RandomSupport.BAD_RANGE);
        }
    }

    public static checkRangeULong(origin: bigint, bound: bigint) {
        if (origin < 0 || origin >= bound) {
            throw new TypeError(RandomSupport.BAD_RANGE);
        }
    }
}

export { RandomSupport };
