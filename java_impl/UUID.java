package com.nyaa.common.util.random;

import lombok.extern.slf4j.Slf4j;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * able 1 defines the 4-bit version found in Bits 48 through 51 within a given UUID.
 *
 * @see <a href="https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-01.html#name-versions">version and variant</a>
 * @see <a href="https://www.rfc-editor.org/rfc/rfc4122#section-4.1.1">...</a>
 */
public class UUID {
    private static final ByteOrder BYTE_ORDER = ByteOrder.BIG_ENDIAN;
    private static final long UUID_EPOCH = 12219292800000L;
    private static final Random random = new Random();
    private final byte[] bytes;

    public UUID() {
        this.bytes = new byte[16];
        new Random().nextBytes(this.bytes);

        setVersion(bytes, 4);
        setRFC4122Variant(bytes);
    }

    public UUID(byte[] bytes) {
        if (bytes.length != 16) {
            throw new IllegalArgumentException("UUID must be 16 bytes long");
        }
        this.bytes = bytes;
    }

    public static UUID createV1() {
        byte[] bytes = new byte[16];

        long timestamp = System.currentTimeMillis() + UUID_EPOCH;
        int clockSeq = random.nextInt(0, 1 << 14);
        byte[] node = Hardware.getMostMac();
        assert node != null;

        ByteBuffer buffer = ByteBuffer.wrap(bytes).order(UUID.BYTE_ORDER);

        // 时间戳 (60-bit)
        buffer.putLong(0, timestamp);
        // 时钟序列 (14-bit)
        buffer.putShort(8, (short) clockSeq);
        // 节点 (MAC地址) (48-bit)
        System.arraycopy(node, 0, bytes, 10, 6);

        setVersion(bytes, 1);
        setRFC4122Variant(bytes);

        return new UUID(bytes);
    }

    public static UUID createV2(byte type) {
        // 设置版本2，类似版本1，但在node部分使用POSIX UID/GID字段
        UUID uuid = createV1();
        uuid.bytes[9] = type;

        setVersion(uuid.bytes, 2);
        // setRFC4122Variant(uuid.bytes);
        return uuid;
    }

    public static UUID createV3(String namespace, String name) throws NoSuchAlgorithmException {
        byte[] bytes = new byte[16];

        MessageDigest md5 = MessageDigest.getInstance("MD5");
        md5.update(namespace.getBytes());
        md5.update(name.getBytes());
        System.arraycopy(md5.digest(), 0, bytes, 0, 16);

        setVersion(bytes, 3);
        setRFC4122Variant(bytes);

        return new UUID(bytes);
    }

    public static UUID createV4() {
        return createV4(random.nextLong());
    }

    public static UUID createV4(long seed) {
        byte[] bytes = new byte[16];
        new Random(seed).nextBytes(bytes);

        setVersion(bytes, 4);
        setRFC4122Variant(bytes);

        return new UUID(bytes);
    }

    public static UUID createV5(String namespace, String name) throws NoSuchAlgorithmException {
        byte[] bytes = new byte[16];

        MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
        sha1.update(namespace.getBytes());
        sha1.update(name.getBytes());

        System.arraycopy(sha1.digest(), 0, bytes, 0, 16);

        setVersion(bytes, 5);
        setRFC4122Variant(bytes);

        return new UUID(bytes);
    }

    public static UUID createV6() {
        byte[] bytes = new byte[16];

        // 重新排序时间戳并设置UUID版本6
        long timestamp = System.currentTimeMillis() + UUID_EPOCH;
        int timeLow = (int) timestamp;
        long timeMid = (timestamp >>> 32) & 0xFFFFL;
        long timeHigh = (timestamp >>> 48) & 0x0FFFL;
        int clockSeq = random.nextInt(0, 1 << 14);
        byte[] node = Hardware.getMostMac();
        assert node != null;

        ByteBuffer buffer = ByteBuffer.wrap(bytes).order(UUID.BYTE_ORDER);
        buffer.putInt(0, timeLow);
        buffer.putShort(4, (short) timeMid);
        buffer.putShort(6, (short) timeHigh);
        buffer.putShort(8, (short) clockSeq);
        System.arraycopy(node, 0, bytes, 10, 6);

        setVersion(bytes, 6);
        setRFC4122Variant(bytes);

        return new UUID(bytes);
    }

    public static UUID createV7() {
        byte[] bytes = new byte[16];

        long timestamp = System.currentTimeMillis();

        ByteBuffer buffer = ByteBuffer.wrap(bytes).order(UUID.BYTE_ORDER);
        buffer.putLong(0, (timestamp << 16) | random.nextInt(1 << 16));
        buffer.putLong(8, random.nextLong());

        setVersion(bytes, 7);
        setRFC4122Variant(bytes);

        return new UUID(bytes);
    }

    private static void setVersion(byte[] bytes, int version) {
        bytes[6] = (byte) ((bytes[6] & 0x0F) | ((version & 0x0F) << 4));
    }

    // RFC 4122 变种号设置
    private static void setRFC4122Variant(byte[] bytes) {
        bytes[8] = (byte) ((bytes[8] & 0x3F) | 0x80); // 设为0b10xxxxxx
    }

    // Microsoft 变种号设置
    private static void setMicrosoftVariant(byte[] bytes) {
        bytes[8] = (byte) ((bytes[8] & 0x1F) | 0xC0); // 设为0b110xxxxx
    }

    @Override
    public String toString() {
        byte[] chars = new byte[36]; // UUID 字符串长度为 36

        // 添加 UUID 分隔符
        chars[8] = '-';
        chars[13] = '-';
        chars[18] = '-';
        chars[23] = '-';

        return DataCast.bytesToHexWithSeparator(this.bytes, chars, false);
    }

    public String getMetadata() {
        return Parser.parseUUID(this.bytes);
    }

    @Slf4j
    public static class Parser {
        private static final String UNKNOWN_VERSION = "* Unknown Version *";
        private static final String UNKNOWN_VARIANT = "* Unknown Variant *";

        public static String parseUUID(UUID uuid) {
            return parseUUID(uuid.bytes);
        }

        public static String parseUUID(byte[] bytes) {
            Variant variant = Variant.getVariant(bytes);

            String sb = "{ Version: " +
                    Version.getVersion(bytes) +
                    ", Variant: (" +
                    variant.value +
                    ") " +
                    variant +
                    ", Metadata: { " +
                    Version.getMetadata(bytes) +
                    " }}";

            return sb;
        }

        private static String parseV1Metadata(byte[] bytes) {
            long timestamp = getTimestamp(bytes);
            short clockSeq = getClockSeq(bytes);
            String mac = Hardware.getMacText(bytes);

            String sb = "Timestamp: " +
                    timestamp +
                    '(' +
                    getTimestampText(timestamp) +
                    "), Clock Sequence: " +
                    clockSeq +
                    ", Node (MAC Address): " +
                    mac;
            return sb;
        }

        private static String parseV2Metadata(byte[] bytes) {
            // DCE Security UUIDv2: Metadata here.
            return "* User Define *";
        }

        private static String parseHashBasedMetadata(byte[] bytes, String algorithm) {
            String sb = "Hash Algorithm: " +
                    algorithm +
                    ", Hash Value: " +
                    DataCast.bytesToHex(bytes, false);
            return sb;
        }

        private static String parseRandomMetadata(byte[] bytes) {
            return "Random Bytes: " + DataCast.bytesToHex(bytes, false);
        }

        private static String parseV6Metadata(byte[] bytes) {
            long timestamp = getTimestampV6(bytes);
            short clockSeq = getClockSeq(bytes);
            String mac = Hardware.getMacText(bytes);

            String sb = "Timestamp: " +
                    timestamp +
                    '(' +
                    getTimestampText(timestamp) +
                    "), Clock Sequence: " +
                    clockSeq +
                    ", Node (MAC Address): " +
                    mac;
            return sb;
        }

        private static String printV7Metadata(byte[] bytes) {
            long timestamp = getTimestampV7(bytes);
            String randomValue = getRandomValueV7(bytes);

            String sb = "Timestamp: " +
                    timestamp +
                    '(' +
                    getTimestampText(timestamp) +
                    "), Random Value: " +
                    randomValue;
            return sb;
        }

        private static long getTimestamp(byte[] bytes) {
            ByteBuffer buffer = ByteBuffer.wrap(bytes, 0, 8).order(UUID.BYTE_ORDER);
            return buffer.getLong() - UUID.UUID_EPOCH;
        }

        private static long getTimestampV6(byte[] bytes) {
            ByteBuffer buffer = ByteBuffer.wrap(bytes, 0, 8).order(UUID.BYTE_ORDER);
            long timeLow = buffer.getInt() & 0xFFFFFFFFL; // 读取前 4 字节
            long timeMid = Short.toUnsignedLong(buffer.getShort()); // 读取接下来的 2 字节
            long timeHigh = Short.toUnsignedLong(buffer.getShort()) & 0x0FFFL; // 读取接下来的 2 字节
            return ((timeHigh << 48) | (timeMid << 32) | timeLow) - UUID.UUID_EPOCH;
        }

        private static long getTimestampV7(byte[] bytes) {
            ByteBuffer buffer = ByteBuffer.wrap(bytes, 0, 6).order(UUID.BYTE_ORDER);
            return ((buffer.getInt() & 0xFFFFFFFFL) << 16) | (buffer.getShort() & 0xFFFFL);
        }

        private static String getRandomValueV7(byte[] bytes) {
            return DataCast.bytesToHex(Arrays.copyOfRange(bytes, 6, 16), false);
        }

        private static short getClockSeq(byte[] bytes) {
            ByteBuffer buffer = ByteBuffer.wrap(bytes, 8, 2).order(UUID.BYTE_ORDER);
            return buffer.getShort();
        }

        private static String getTimestampText(long timestamp) {
            // 将时间戳转换为 Instant
            Instant instant = Instant.ofEpochMilli(timestamp);

            // 将 Instant 转换为 ZonedDateTime（UTC时区）
            ZonedDateTime zonedDateTime = instant.atZone(ZoneId.of("UTC"));

            // 定义日期时间格式
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

            return zonedDateTime.format(formatter);
        }

        class Version {
            public static final Map<Integer, String> VERSION_MAP;

            static {
                Map<Integer, String> _VERSION_MAP = new HashMap<>();
                _VERSION_MAP.put(1, "Timestamp based");
                _VERSION_MAP.put(2, "DCE Security");
                _VERSION_MAP.put(3, "MD5 based");
                _VERSION_MAP.put(4, "Random");
                _VERSION_MAP.put(5, "SHA-1 based");
                _VERSION_MAP.put(6, "Ordered");
                _VERSION_MAP.put(7, "Unix Timestamp based");
                VERSION_MAP = Collections.unmodifiableMap(_VERSION_MAP);

            }

            static String getVersion(byte[] bytes) {
                int version = (bytes[6] >>> 4) & 0xF;
                return "(v" +
                        version +
                        ") " +
                        VERSION_MAP.getOrDefault(version, UNKNOWN_VERSION);
            }

            static String getMetadata(byte[] bytes) {
                int version = (bytes[6] >>> 4) & 0xF;
                Variant variant = Variant.getVariant(bytes);
                return switch (version) {
                    case 1 -> variant == Variant.RFC4122 ? parseV1Metadata(bytes) : UNKNOWN_VARIANT;
                    case 2 -> variant == Variant.RFC4122 ? parseV2Metadata(bytes) : UNKNOWN_VARIANT;
                    case 3 -> parseHashBasedMetadata(bytes, "MD5");
                    case 4 -> parseRandomMetadata(bytes);
                    case 5 -> parseHashBasedMetadata(bytes, "SHA-1");
                    case 6 -> parseV6Metadata(bytes);
                    case 7 -> printV7Metadata(bytes);
                    default -> UNKNOWN_VERSION;
                };
            }
        }

        enum Variant {
            RESERVED_NCS_BACKWARD_COMPATIBILITY(4, "Reserved, NCS backward compatibility"),
            RFC4122(2, "RFC 4122, variant defined"),
            RESERVED_FOR_FUTURE_USE(1, "Microsoft variant"),
            MICROSOFT(0, "Reserved for future use");

            public final int value;
            public final String description;

            Variant(int value, String description) {
                this.value = value;
                this.description = description;
            }

            static Variant getVariant(byte[] bytes) {
                int variant = (bytes[8] >>> 5) & 0b111;
                if ((variant & 0b100) == 0)
                    return Variant.RESERVED_NCS_BACKWARD_COMPATIBILITY;
                if ((variant & 0b010) == 0)
                    return Variant.RFC4122;
                if ((variant & 0b001) == 0)
                    return Variant.MICROSOFT;
                // if ((variant & 0b000) == 0) // 恒为 true
                return Variant.RESERVED_FOR_FUTURE_USE;
            }

            @Override
            public String toString() {
                return this.description;
            }
        }
    }
}
