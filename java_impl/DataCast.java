package com.nyaa.common.util.random;

import java.nio.charset.StandardCharsets;

public class DataCast {
    private static final byte[] CHAR_TABLE_LOWER = "0123456789abcdef".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] CHAR_TABLE_UPPER = "0123456789ABCDEF".getBytes(StandardCharsets.US_ASCII);

    public static float toLimitedFloat(long num) {
        int kExponentBits = 0x3F800000;
        int random = (int) (num & 0x7FFFFF) | kExponentBits;
        return Float.intBitsToFloat(random) - 1.0f;
    }

    public static double toLimitedDouble(long num) {
        long kExponentBits = 0x3FF0000000000000L;
        long random = (num & 0xFFFFFFFFFFFFFL) | kExponentBits;
        return Double.longBitsToDouble(random) - 1.0;
    }

    public static String bytesToHexWithSeparator(byte[] bytes, byte[] chars, boolean lowerCase) {
        byte[] charTable = lowerCase ? CHAR_TABLE_LOWER : CHAR_TABLE_UPPER;
        for (int i = 0, j = 0; i < bytes.length && j < chars.length; i++) {
            if (chars[j] != 0) {
                j++;
            }
            if (j >= chars.length)
                break;
            chars[j++] = charTable[(bytes[i] >>> 4) & 0xF];
            if (j >= chars.length)
                break;
            chars[j++] = charTable[bytes[i] & 0xF];
        }
        return new String(chars, StandardCharsets.US_ASCII);
    }

    public static String bytesToHex(byte[] bytes, boolean lowerCase) {
        byte[] charTable = lowerCase ? CHAR_TABLE_LOWER : CHAR_TABLE_UPPER;
        byte[] chars = new byte[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            chars[i * 2] = charTable[(bytes[i] >>> 4) & 0xF];
            chars[i * 2 + 1] = charTable[bytes[i] & 0xF];
        }
        return new String(chars, StandardCharsets.US_ASCII);
    }
}
