import { DataCast } from './data-cast'

type ByteSetter = (bytes: Uint8Array) => void;

class UUID {
    readonly #bytes: Uint8Array;
    versionSetter: ByteSetter = UUID.V4Setter;
    variantSetter: ByteSetter = UUID.RFC4122VariantSetter;

    constructor(bytes: ArrayBuffer | ArrayBufferView) {
        if (bytes.byteLength != 16) {
            throw new TypeError("UUID must be 16 bytes long");
        }

        this.#bytes = new Uint8Array(bytes instanceof ArrayBuffer ? bytes : bytes.buffer);
    }

    static V4Setter(bytes: Uint8Array) {
        bytes[6] = ((bytes[6] & 0x0F) | 0x40);
    }

    // RFC 4122变种号设置
    static RFC4122VariantSetter(bytes: Uint8Array) {
        bytes[8] = ((bytes[8] & 0x3F) | 0x80);
    }

    // Microsoft变种号设置
    static MicrosoftVariantSetter(bytes: Uint8Array) {
        bytes[8] = ((bytes[8] & 0x1F) | 0xC0);
    }

    toString() {
        const chars = new Uint8Array(36); // UUID 字符串长度为 36

        // 添加 UUID 分隔符
        const splash = '-'.charCodeAt(0);
        chars[8] = splash;
        chars[13] = splash;
        chars[18] = splash;
        chars[23] = splash;

        // 将字节数组转换为字符串
        return DataCast.bytesToHexWithSeparator(this.#bytes, chars, false);
    }
}

export { UUID };
