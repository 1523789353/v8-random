// === data-cast ===
declare const MASK8 = 255;
declare const MASK16 = 65535;
declare const MASK32 = 4294967295;
declare const MASK32n = 4294967295n;
declare const MASK64n = 18446744073709551615n;
declare const Int32_BIAS = 2147483648;
declare const Int32_MAX = 2147483647;
declare const Int32_MAXn = 2147483647n;
declare const Int32_BIASn = 2147483648n;
declare const Int64_MAXn = 9223372036854775807n;
declare const Int64_BIASn = 9223372036854775808n;
/**
 * 将 64/32 位整数转换为 JavaScript 中的浮点数
 *
 * double：符号1bit + 指数11bit + 小数52bit
 * float： 符号1bit + 指数8bit  + 小数23bit
 *
 * 注意: 不符合 IEEE 754 标准的 64bit 会在运算中有异常的行为
 * 异常示例: DataCast.bitCastDouble(0b01010011011010011111001000111111, 0b00001001001111010100001000000101)
 */
declare class DataCast {
    static readonly CHAR_TABLE_LOWER: number[];
    static readonly CHAR_TABLE_UPPER: number[];
    static readonly DEVICE_BYTE_ORDER: boolean;
    static deviceIsLittleEndian(): boolean;
    /** 将 64bit 转换为单精度浮点数, 范围 [0.0, 1.0) */
    static toLimitedFloat(bits: bigint): number;
    /** 将 64bit 转换为双精度浮点数, 范围 [0.0, 1.0) */
    static toLimitedDouble(bits: bigint): number;
    static strHash(str: string): bigint;
    static bytesToHexWithSeparator(bytes: ArrayBuffer | ArrayBufferView, chars: ArrayBuffer | ArrayBufferView, lowerCase?: boolean): string;
    static bytesToHex(bytes: ArrayBuffer | ArrayBufferView, lowerCase?: boolean): string;
}
declare class Integer {
    static readonly MIN_VALUE = -2147483648;
    static readonly MAX_VALUE = 2147483647;
    static readonly MIN_VALUE_BIG = -2147483648n;
    static readonly MAX_VALUE_BIG = 2147483647n;
    /** 模拟 Java 转换时精度丢失 */
    static cast(value: any): number;
}
declare class Float {
    static readonly MIN_VALUE: number;
    static readonly MAX_VALUE: number;
    /** 模拟 Java 转换时精度丢失 */
    static cast(value: any): number;
    static nextDown(f: number): number;
    static floatToRawIntBits(value: number): number;
    static intBitsToFloat(value: number | bigint): number;
}
declare class Double {
    static readonly MIN_VALUE: number;
    static readonly MAX_VALUE: number;
    static nextDown(d: number): number;
    static doubleToRawLongBits(value: number): bigint;
    static longBitsToDouble(value: number | bigint): number;
}
declare const int: typeof Integer.cast;
declare const float: typeof Float.cast;

// === random-support ===
declare class RandomSupport {
    static readonly BAD_SIZE = "size must be non-negative";
    static readonly BAD_DISTANCE = "jump distance must be finite, positive, and an exact integer";
    static readonly BAD_BOUND = "bound must be positive";
    static readonly BAD_FLOATING_BOUND = "bound must be finite and positive";
    static readonly BAD_RANGE = "bound must be greater than origin";
    static checkStreamSize(streamSize: bigint): void;
    static checkBoundFloat(bound: number): void;
    static checkBoundDouble(bound: number): void;
    static checkBoundInt(bound: number): void;
    static checkBoundLong(bound: bigint): void;
    static checkBoundULong(bound: bigint): void;
    static checkRangeFloat(origin: number, bound: number): void;
    static checkRangeDouble(origin: number, bound: number): void;
    static checkRangeInt(origin: number, bound: number): void;
    static checkRangeLong(origin: bigint, bound: bigint): void;
    static checkRangeULong(origin: bigint, bound: bigint): void;
}

// === uuid ===
type ByteSetter = (bytes: Uint8Array) => void;
declare class UUID {
    #private;
    versionSetter: ByteSetter;
    variantSetter: ByteSetter;
    constructor(bytes: ArrayBuffer | ArrayBufferView);
    static V4Setter(bytes: Uint8Array): void;
    static RFC4122VariantSetter(bytes: Uint8Array): void;
    static MicrosoftVariantSetter(bytes: Uint8Array): void;
    toString(): string;
}

// === random ===
/**
 * V8 引擎随机数生成器实现
 * 使用 BigInt 替代 uint64_t, 并且在会越界时 & mask64
 * @see https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/numbers/math-random.cc
 * @see https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/base/utils/random-number-generator.h
 * @see https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/base/utils/random-number-generator.cc
 */
declare class Random {
    #private;
    constructor(seed?: number);
    nextBoolean(): boolean;
    nextInt(): number;
    nextInt(bound: number): number;
    nextInt(origin: number, bound: number): number;
    nextULong(): bigint;
    nextULong(bound: bigint | number): bigint;
    nextULong(origin: bigint | number, bound: bigint | number): bigint;
    nextLong(): bigint;
    nextLong(bound: bigint | number): bigint;
    nextLong(origin: bigint | number, bound: bigint | number): bigint;
    nextFloat(): number;
    nextFloat(bound: number): number;
    nextFloat(origin: number, bound: number): number;
    /** 生成一个 [0, 1) 之间的随机双精度浮点数 */
    nextDouble(): number;
    nextDouble(bound: number): number;
    nextDouble(origin: number, bound: number): number;
    nextBytes(bytes: ArrayBuffer | ArrayBufferView): void;
    nextExponential(): number;
    nextGaussian(): number;
    /** 生成随机 UUIDv4, 自定义实现与 V8 引擎无关 */
    nextUUIDv4(): UUID;
}

// === test ===

// === data-cast ===
declare const MASK8 = 255;
declare const MASK16 = 65535;
declare const MASK32 = 4294967295;
declare const MASK32n = 4294967295n;
declare const MASK64n = 18446744073709551615n;
declare const Int32_BIAS = 2147483648;
declare const Int32_MAX = 2147483647;
declare const Int32_MAXn = 2147483647n;
declare const Int32_BIASn = 2147483648n;
declare const Int64_MAXn = 9223372036854775807n;
declare const Int64_BIASn = 9223372036854775808n;
/**
 * 将 64/32 位整数转换为 JavaScript 中的浮点数
 *
 * double：符号1bit + 指数11bit + 小数52bit
 * float： 符号1bit + 指数8bit  + 小数23bit
 *
 * 注意: 不符合 IEEE 754 标准的 64bit 会在运算中有异常的行为
 * 异常示例: DataCast.bitCastDouble(0b01010011011010011111001000111111, 0b00001001001111010100001000000101)
 */
declare class DataCast {
    static readonly CHAR_TABLE_LOWER: number[];
    static readonly CHAR_TABLE_UPPER: number[];
    static readonly DEVICE_BYTE_ORDER: boolean;
    static deviceIsLittleEndian(): boolean;
    /** 将 64bit 转换为单精度浮点数, 范围 [0.0, 1.0) */
    static toLimitedFloat(bits: bigint): number;
    /** 将 64bit 转换为双精度浮点数, 范围 [0.0, 1.0) */
    static toLimitedDouble(bits: bigint): number;
    static strHash(str: string): bigint;
    static bytesToHexWithSeparator(bytes: ArrayBuffer | ArrayBufferView, chars: ArrayBuffer | ArrayBufferView, lowerCase?: boolean): string;
    static bytesToHex(bytes: ArrayBuffer | ArrayBufferView, lowerCase?: boolean): string;
}
declare class Integer {
    static readonly MIN_VALUE = -2147483648;
    static readonly MAX_VALUE = 2147483647;
    static readonly MIN_VALUE_BIG = -2147483648n;
    static readonly MAX_VALUE_BIG = 2147483647n;
    /** 模拟 Java 转换时精度丢失 */
    static cast(value: any): number;
}
declare class Float {
    static readonly MIN_VALUE: number;
    static readonly MAX_VALUE: number;
    /** 模拟 Java 转换时精度丢失 */
    static cast(value: any): number;
    static nextDown(f: number): number;
    static floatToRawIntBits(value: number): number;
    static intBitsToFloat(value: number | bigint): number;
}
declare class Double {
    static readonly MIN_VALUE: number;
    static readonly MAX_VALUE: number;
    static nextDown(d: number): number;
    static doubleToRawLongBits(value: number): bigint;
    static longBitsToDouble(value: number | bigint): number;
}
declare const int: typeof Integer.cast;
declare const float: typeof Float.cast;

// === random-support ===
declare class RandomSupport {
    static readonly BAD_SIZE = "size must be non-negative";
    static readonly BAD_DISTANCE = "jump distance must be finite, positive, and an exact integer";
    static readonly BAD_BOUND = "bound must be positive";
    static readonly BAD_FLOATING_BOUND = "bound must be finite and positive";
    static readonly BAD_RANGE = "bound must be greater than origin";
    static checkStreamSize(streamSize: bigint): void;
    static checkBoundFloat(bound: number): void;
    static checkBoundDouble(bound: number): void;
    static checkBoundInt(bound: number): void;
    static checkBoundLong(bound: bigint): void;
    static checkBoundULong(bound: bigint): void;
    static checkRangeFloat(origin: number, bound: number): void;
    static checkRangeDouble(origin: number, bound: number): void;
    static checkRangeInt(origin: number, bound: number): void;
    static checkRangeLong(origin: bigint, bound: bigint): void;
    static checkRangeULong(origin: bigint, bound: bigint): void;
}

// === uuid ===
type ByteSetter = (bytes: Uint8Array) => void;
declare class UUID {
    #private;
    versionSetter: ByteSetter;
    variantSetter: ByteSetter;
    constructor(bytes: ArrayBuffer | ArrayBufferView);
    static V4Setter(bytes: Uint8Array): void;
    static RFC4122VariantSetter(bytes: Uint8Array): void;
    static MicrosoftVariantSetter(bytes: Uint8Array): void;
    toString(): string;
}

// === random ===
/**
 * V8 引擎随机数生成器实现
 * 使用 BigInt 替代 uint64_t, 并且在会越界时 & mask64
 * @see https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/numbers/math-random.cc
 * @see https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/base/utils/random-number-generator.h
 * @see https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/base/utils/random-number-generator.cc
 */
declare class Random {
    #private;
    constructor(seed?: number);
    nextBoolean(): boolean;
    nextInt(): number;
    nextInt(bound: number): number;
    nextInt(origin: number, bound: number): number;
    nextULong(): bigint;
    nextULong(bound: bigint | number): bigint;
    nextULong(origin: bigint | number, bound: bigint | number): bigint;
    nextLong(): bigint;
    nextLong(bound: bigint | number): bigint;
    nextLong(origin: bigint | number, bound: bigint | number): bigint;
    nextFloat(): number;
    nextFloat(bound: number): number;
    nextFloat(origin: number, bound: number): number;
    /** 生成一个 [0, 1) 之间的随机双精度浮点数 */
    nextDouble(): number;
    nextDouble(bound: number): number;
    nextDouble(origin: number, bound: number): number;
    nextBytes(bytes: ArrayBuffer | ArrayBufferView): void;
    nextExponential(): number;
    nextGaussian(): number;
    /** 生成随机 UUIDv4, 自定义实现与 V8 引擎无关 */
    nextUUIDv4(): UUID;
}

// === test ===

