const MASK8 = 0xFF;
const MASK16 = 0xFFFF;
const MASK32 = 0xFFFFFFFF;
const MASK32n = 0xFFFFFFFFn;
const MASK64n = 0xFFFFFFFFFFFFFFFFn;
const Int32_BIAS = 0x80000000;
const Int32_MAX = 0x7FFFFFFF;
const Int32_MAXn = 0x7FFFFFFFn;
const Int32_BIASn = 0x80000000n;
const Int64_MAXn = 0x7FFFFFFFFFFFFFFFn;
const Int64_BIASn = 0x8000000000000000n;

/**
 * 将 64/32 位整数转换为 JavaScript 中的浮点数
 *
 * double：符号1bit + 指数11bit + 小数52bit
 * float： 符号1bit + 指数8bit  + 小数23bit
 *
 * 注意: 不符合 IEEE 754 标准的 64bit 会在运算中有异常的行为
 * 异常示例: DataCast.bitCastDouble(0b01010011011010011111001000111111, 0b00001001001111010100001000000101)
 */
class DataCast {
    static readonly CHAR_TABLE_LOWER = Array.from("0123456789abcdef").map(c => c.charCodeAt(0));
    static readonly CHAR_TABLE_UPPER = Array.from("0123456789ABCDEF").map(c => c.charCodeAt(0));

    static readonly DEVICE_BYTE_ORDER = DataCast.deviceIsLittleEndian();
    static deviceIsLittleEndian() {
        const i16 = new Uint16Array(1);
        i16[0] = 0xABCD; // 写入一个 16 位整数
        return new Uint8Array(i16.buffer)[0] === 0xCD; // 如果第一个字节是低位字节，则是小端序
    }


    /** 将 64bit 转换为单精度浮点数, 范围 [0.0, 1.0) */
    static toLimitedFloat(bits: bigint) {
        // Exponent部分, IEEE 754 标准中的双精度浮点数
        const kExponentBits = 0x3F800000n;
        const random = (bits & 0x7FFFFFn) | kExponentBits;
        return Float.intBitsToFloat(random) - 1;
    }
    /** 将 64bit 转换为双精度浮点数, 范围 [0.0, 1.0) */
    static toLimitedDouble(bits: bigint) {
        // Exponent部分, IEEE 754 标准中的双精度浮点数
        const kExponentBits = 0x3FF0000000000000n;
        const random = (bits & 0xFFFFFFFFFFFFFn) | kExponentBits;
        return Double.longBitsToDouble(random) - 1;
    }


    static strHash(str: string) {
        let hash = 0n;
        for (const c of str) {
            hash = hash * 31n + BigInt(c.charCodeAt(0));
            hash &= MASK64n;
        }
        return hash;
    }

    static bytesToHexWithSeparator(bytes: ArrayBuffer | ArrayBufferView, chars: ArrayBuffer | ArrayBufferView, lowerCase: boolean = false) {
        const charTable = lowerCase ? DataCast.CHAR_TABLE_LOWER : DataCast.CHAR_TABLE_UPPER;
        const bytesView = new DataView(bytes instanceof ArrayBuffer ? bytes : bytes.buffer, 0, bytes.byteLength);
        const charsView = new DataView(chars instanceof ArrayBuffer ? chars : chars.buffer, 0, chars.byteLength);
        for (let i = 0, j = 0; i < bytesView.byteLength && j < charsView.byteLength; i++) {
            if (charsView.getUint8(j) != 0) {
                j++;
            }
            if (j >= charsView.byteLength)
                break;
            charsView.setUint8(j++, charTable[bytesView.getUint8(i) >>> 4]);
            if (j >= charsView.byteLength)
                break;
            charsView.setUint8(j++, charTable[bytesView.getUint8(i) & 0xF]);
        }
        return String.fromCharCode(...new Uint8Array(charsView.buffer, 0, charsView.byteLength));
    }

    static bytesToHex(bytes: ArrayBuffer | ArrayBufferView, lowerCase: boolean = false) {
        const charTable = lowerCase ? DataCast.CHAR_TABLE_LOWER : DataCast.CHAR_TABLE_UPPER;
        const bytesView = new DataView(bytes instanceof ArrayBuffer ? bytes : bytes.buffer, 0, bytes.byteLength);
        const chars = new Uint8Array(bytes.byteLength);
        for (let i = 0; i < bytes.byteLength; i++) {
            chars[i * 2] = charTable[bytesView.getUint8(i) >>> 4];
            chars[i * 2 + 1] = charTable[bytesView.getUint8(i) & 0xF];
        }
        return String.fromCharCode(...chars);
    }
}


class Integer {
    static readonly MIN_VALUE = -0x80000000;
    static readonly MAX_VALUE = 0x7FFFFFFF;
    static readonly MIN_VALUE_BIG = -0x80000000n;
    static readonly MAX_VALUE_BIG = 0x7FFFFFFFn;

    /** 模拟 Java 转换时精度丢失 */
    static cast(value: any) {
        if (typeof value == 'number') {
            value = BigInt(Math.floor(value));
        }
        if (typeof value != 'bigint') {
            return Number.NaN;
        }
        return Number(BigInt.asIntN(32, value));
    }
    static {
        Object.freeze(Integer);
        Object.freeze(Integer.prototype);
    }
}

class Float {
    static readonly MIN_VALUE = Float.intBitsToFloat(1);
    static readonly MAX_VALUE = Float.intBitsToFloat(0x7F7FFFFF);

    /** 模拟 Java 转换时精度丢失 */
    static cast(value: any) {
        if (typeof value == 'bigint') {
            return Number(value);
        }
        if (typeof value != 'number') {
            return Number.NaN;
        }

        const f32 = new Float32Array(1);
        f32[0] = value;

        // 读取 float 值
        return f32[0];
    }
    static nextDown(f: number) {
        if (Number.isNaN(f) || !Number.isFinite(f)) {
            return f;
        }
        if (f == 0)
            return -Float.MIN_VALUE;
        else
            return Float.intBitsToFloat(Float.floatToRawIntBits(f) + ((f > 0) ? -1 : 1));
    }
    static floatToRawIntBits(value: number) {
        const f32 = new Float32Array(1);
        f32[0] = value;
        return new Int32Array(f32.buffer)[0];
    }
    static intBitsToFloat(value: number | bigint) {
        const i32 = new Int32Array(1);
        i32[0] = typeof value == 'number' ? Math.floor(value) : Integer.cast(value);
        return new Float32Array(i32.buffer)[0];
    }
    static {
        Object.freeze(Float);
        Object.freeze(Float.prototype);
    }
}

class Double {
    static readonly MIN_VALUE = Double.longBitsToDouble(1n);
    static readonly MAX_VALUE = Double.longBitsToDouble(0x7FEFFFFFFFFFFFFFn);

    static nextDown(d: number) {
        if (Number.isNaN(d) || !Number.isFinite(d))
            return d;
        else {
            if (d == 0.0)
                return -Double.MIN_VALUE;
            else
                return Double.longBitsToDouble(Double.doubleToRawLongBits(d) + ((d > 0) ? -1n: 1n));
        }
    }
    static doubleToRawLongBits(value: number) {
        const f64 = new Float64Array(1);
        f64[0] = value;
        return new BigInt64Array(f64.buffer)[0];
    }
    static longBitsToDouble(value: number | bigint) {
        const i64 = new BigInt64Array(1);
        i64[0] = typeof value == 'number' ? BigInt(Math.floor(value)) : BigInt.asIntN(64, value);
        return new Float64Array(i64.buffer)[0];
    }
    static {
        Object.freeze(Double);
        Object.freeze(Double.prototype);
    }
}

const int = Integer.cast;
const float = Float.cast;

export { DataCast, int, Integer, float, Float, Double, MASK8, MASK16, MASK32, MASK32n, MASK64n, Int32_BIAS, Int32_MAX, Int32_BIASn, Int32_MAXn, Int64_BIASn, Int64_MAXn };
