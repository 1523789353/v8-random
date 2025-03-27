import { DataCast, int, float, MASK64n, Int32_MAXn } from './data-cast';
import { RandomSupport } from './random-support'
import { UUID } from './uuid';

function floorMod(value: number, modulo: number): number;
function floorMod(value: bigint, modulo: bigint): bigint;
function floorMod(value: number | bigint, modulo: number | bigint): number | bigint {
    if (typeof value === 'number' && typeof modulo === 'number') {
        // 处理 number 类型
        return ((value % modulo) + modulo) % modulo;
    } else if (typeof value === 'bigint' && typeof modulo === 'bigint') {
        // 处理 bigint 类型
        return ((value % modulo) + modulo) % modulo;
    }
    throw new Error('Invalid input types: value and modulo must both be number or both be bigint.');
}

/**
 * V8 引擎随机数生成器实现
 * 使用 BigInt 替代 uint64_t, 并且在会越界时 & mask64
 * @see https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/numbers/math-random.cc
 * @see https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/base/utils/random-number-generator.h
 * @see https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/base/utils/random-number-generator.cc
 */
class Random {
    #state0!: bigint;
    #state1!: bigint;

    constructor(seed: number = this.#getDefaultSeed()) {
        this.#setSeed(seed);
    }

    #getDefaultSeed() {
        if (window.crypto !== undefined && window.crypto.getRandomValues !== undefined) {
            // 使用 window.crypto.getRandomValues() 生成随机种子
            const uint32Array = new Uint8Array(1);
            window.crypto.getRandomValues(uint32Array);
            return uint32Array.at(0)!;
        }
        // 回退策略: 使用浏览器时间戳作为种子
        return Math.floor(Date.now() - performance.now());
    }

    /** 设置种子, 使用 MurmurHash3 算法初始化 state0 和 state1 */
    #setSeed(seed: number) {
        if (!Number.isInteger(seed) || seed < 0) {
            throw new Error('Seed must be a non-negative integer.');
        }

        const initialSeed = BigInt(seed);
        this.#state0 = this.#murmurHash3(initialSeed);
        this.#state1 = this.#murmurHash3(this.#state0 ^ MASK64n);
        if (this.#state0 === 0n && this.#state1 === 0n) {
            throw new Error('State cannot be zero.');
        }
    }

    /** MurmurHash3 算法 */
    #murmurHash3(h: bigint) {
        h ^= h >> 33n;
        h = (h * 0xFF51AFD7ED558CCDn) & MASK64n;
        h ^= h >> 33n;
        h = (h * 0xC4CEB9FE1A85EC53n) & MASK64n;
        h ^= h >> 33n;
        return h;
    }

    /** XorShift128 算法, 生成下一个状态 (64 位整数) */
    #xorShift128() {
        let s1 = this.#state0,
            s0 = this.#state1;

        this.#state0 = s0;
        s1 ^= (s1 << 23n) & MASK64n;
        s1 ^= s1 >> 17n;
        s1 ^= s0;
        s1 ^= s0 >> 26n;
        this.#state1 = s1;
    }


    nextBoolean() {
        return this.nextLong() < 0;
    }

    nextInt(): number;
    nextInt(bound: number): number;
    nextInt(origin: number, bound: number): number;
    nextInt(originOrBound?: number, bound?: number) {
        // 处理无参数的情况
        if (originOrBound === undefined && bound === undefined) {
            return (int)(this.nextULong());
        }
        // 处理一个参数的情况 (bound)
        if (typeof originOrBound === 'number' && bound === undefined) {
            let bound = originOrBound;
            RandomSupport.checkBoundInt(bound);
            if ((bound & (bound - 1)) == 0) {
                const r = (int)(this.nextULong() & Int32_MAXn);
                return r & bound - 1;
            }
            const limit = Int32_MAXn - (Int32_MAXn % BigInt(bound));
            while (true) {
                const r64 = this.nextULong();
                let r32 = (int)(r64 & Int32_MAXn);
                if (r32 < limit) {
                    return r32 % bound;
                }
                r32 = (int)((r64 >> 32n) & Int32_MAXn);
                if (r32 < limit) {
                    return r32 % bound;
                }
            }
        }
        // 处理两个参数的情况 (origin, bound)
        if (typeof originOrBound === 'number' && typeof bound === 'number') {
            let origin = originOrBound;
            RandomSupport.checkRangeInt(origin, bound);
            return origin + (int)(this.nextLong(origin + bound));
        }
        // 参数不合法，抛出错误
        throw new TypeError('Invalid arguments');
    }

    nextULong(): bigint;
    nextULong(bound: bigint | number): bigint;
    nextULong(origin: bigint | number, bound: bigint | number): bigint;
    nextULong(originOrBound?: bigint | number, bound?: bigint | number) {
        // 处理无参数的情况
        if (originOrBound === undefined && bound === undefined) {
            this.#xorShift128();
            return this.#murmurHash3(this.#state0 ^ this.#state1);
        }
        // 处理一个参数的情况 (bound)
        if ((typeof originOrBound === 'bigint' || typeof originOrBound === 'number') && bound === undefined) {
            let bound = typeof originOrBound == 'bigint' ? originOrBound : BigInt(originOrBound);
            RandomSupport.checkBoundLong(bound);

            if ((bound & (bound - 1n)) == 0n) {
                return this.nextULong() & (bound - 1n);
            }
            const limit = MASK64n - (MASK64n % bound);
            while (true) {
                const r = this.nextULong();
                if (r < limit) {
                    return r % bound;
                }
            }
        }
        // 处理两个参数的情况 (origin, bound)
        if ((typeof originOrBound === 'bigint' || typeof originOrBound === 'number') && (typeof bound === 'bigint' || typeof bound === 'number')) {
            let origin = typeof originOrBound == 'bigint' ? originOrBound : BigInt(originOrBound);
            bound = typeof bound == 'bigint' ? bound : BigInt(bound);
            RandomSupport.checkRangeULong(origin, bound);

            return origin + floorMod(this.nextULong(), bound - origin);
        }
        // 参数不合法，抛出错误
        throw new TypeError('Invalid arguments');
    }

    nextLong(): bigint;
    nextLong(bound: bigint | number): bigint;
    nextLong(origin: bigint | number, bound: bigint | number): bigint;
    nextLong(originOrBound?: bigint | number, bound?: bigint | number) {
        // 处理无参数的情况
        if (originOrBound === undefined && bound === undefined) {
            this.#xorShift128();
            return BigInt.asIntN(64, this.#murmurHash3(this.#state0 ^ this.#state1));
        }
        // 处理一个参数的情况 (bound)
        if ((typeof originOrBound === 'bigint' || typeof originOrBound === 'number') && bound === undefined) {
            let bound = typeof originOrBound == 'bigint' ? originOrBound : BigInt(originOrBound);
            RandomSupport.checkBoundLong(bound);

            return this.nextULong(bound); // 反正都是正数
        }
        // 处理两个参数的情况 (origin, bound)
        if ((typeof originOrBound === 'bigint' || typeof originOrBound === 'number') && (typeof bound === 'bigint' || typeof bound === 'number')) {
            let origin = typeof originOrBound == 'bigint' ? originOrBound : BigInt(originOrBound);
            bound = typeof bound == 'bigint' ? bound : BigInt(bound);
            RandomSupport.checkRangeLong(origin, bound);

            const r = this.nextULong(BigInt.asIntN(64, origin), BigInt.asIntN(64, bound));
            return BigInt.asIntN(64, r);
        }
        // 参数不合法，抛出错误
        throw new TypeError('Invalid arguments');
    }

    nextFloat(): number;
    nextFloat(bound: number): number;
    nextFloat(origin: number, bound: number): number;
    nextFloat(originOrBound?: number, bound?: number) {
        // 处理无参数的情况
        if (originOrBound === undefined && bound === undefined) {
            return DataCast.toLimitedFloat(this.nextLong())
        }
        // 处理一个参数的情况 (bound)
        if (typeof originOrBound === 'number' && bound === undefined) {
            let bound = originOrBound;
            RandomSupport.checkBoundFloat(bound);
            return (float)(this.nextDouble() * bound);
        }
        // 处理两个参数的情况 (origin, bound)
        if (typeof originOrBound === 'number' && typeof bound === 'number') {
            let origin = originOrBound;
            RandomSupport.checkRangeFloat(origin, bound);
            this.#xorShift128();
            return (float)(origin + this.nextDouble() * (bound - origin));
        }
        // 参数不合法，抛出错误
        throw new TypeError('Invalid arguments');
    }

    /** 生成一个 [0, 1) 之间的随机双精度浮点数 */
    nextDouble(): number;
    nextDouble(bound: number): number;
    nextDouble(origin: number, bound: number): number;
    nextDouble(originOrBound?: number, bound?: number) {
        // 处理无参数的情况
        if (originOrBound === undefined && bound === undefined) {
            return DataCast.toLimitedDouble(this.nextLong());
        }
        // 处理一个参数的情况 (bound)
        if (typeof originOrBound === 'number' && bound === undefined) {
            let bound = originOrBound;
            RandomSupport.checkBoundDouble(bound);

            return this.nextDouble() * bound;
        }
        // 处理两个参数的情况 (origin, bound)
        if (typeof originOrBound === 'number' && typeof bound === 'number') {
            let origin = originOrBound;
            RandomSupport.checkRangeDouble(origin, bound);

            return origin + (this.nextDouble() * (bound - origin));
        }
        // 参数不合法，抛出错误
        throw new TypeError('Invalid arguments');
    }

    nextBytes(bytes: ArrayBuffer | ArrayBufferView) {
        const view = new DataView(bytes instanceof ArrayBuffer ? bytes : bytes.buffer, 0, bytes.byteLength);

        let i = 0;
        for (; i < (int)(bytes.byteLength / 8); i++) {
            view.setBigUint64(i * 8, this.nextULong());
        }
        i *= 8;
        if (i == bytes.byteLength) {
            return;
        }
        let r = this.nextULong();
        for (let j = 7; j >= 0; j--) {
            if (i + j < bytes.byteLength) { // 最后 chunk 不满 8byte 时, 会下标溢出
                view.setUint8(i + j, Number(r & 0xFFn));
            }
            r >>= 8n;
        }
    }

    nextExponential() {
        // 生成一个均匀分布的随机数 U
        let U = this.nextDouble();
        // 避免 U 为 0，因为 ln(0) 是未定义的
        while (U == 0.0) {
            U = this.nextDouble();
        }
        // 使用逆变换法生成指数分布的随机数
        return -Math.log(1.0 - U);
    }

    nextGaussian() {
        // Box-Muller 变换需要两个均匀分布的随机数
        let U1 = this.nextDouble();
        let U2 = this.nextDouble();
        // 避免 U1 为 0，因为 ln(0) 是未定义的
        while (U1 == 0.0) {
            U1 = this.nextDouble();
        }
        // 使用 Box-Muller 变换生成标准正态分布的随机数
        return Math.sqrt(-2.0 * Math.log(U1)) * Math.cos(2.0 * Math.PI * U2);
    }

    /** 生成随机 UUIDv4, 自定义实现与 V8 引擎无关 */
    nextUUIDv4() {
        const bytes = new Uint8Array(16);
        this.nextBytes(bytes);
        return new UUID(bytes);
    }
}

export { Random };
