package com.nyaa.common.util.random;

import java.net.NetworkInterface;
import java.nio.ByteBuffer;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

public class Hardware {
    public static Map<NetworkInterface, byte[]> getAllNicMac() {
        Map<NetworkInterface, byte[]> nic2mac = new HashMap<>();
        try {
            Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
            for (NetworkInterface ni : Collections.list(networkInterfaces)) {
                byte[] mac = null;
                try {
                    mac = ni.getHardwareAddress();
                } catch (Exception ignored) {
                }
                nic2mac.put(ni, mac);
            }
        } catch (Exception ignored) {
        }
        return nic2mac;
    }

    public static byte[] getFirstMac() {
        try {
            Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
            for (NetworkInterface ni : Collections.list(networkInterfaces)) {
                try {
                    return ni.getHardwareAddress();
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    public static byte[] getMostMac() {
        ByteBuffer theMost = null;
        Map<ByteBuffer, Integer> analysis = new HashMap<>();

        try {
            Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
            for (NetworkInterface ni : Collections.list(networkInterfaces)) {
                try {
                    byte[] mac = ni.getHardwareAddress();
                    if (mac == null)
                        continue;
                    ByteBuffer buffer = ByteBuffer.wrap(mac);
                    int count = analysis.getOrDefault(buffer, 0) + 1;
                    if (theMost == null || count > analysis.getOrDefault(buffer, 0)) {
                        theMost = buffer;
                    }
                    analysis.put(buffer, count);
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
        }

        return theMost == null ? null : theMost.array();
    }

    public static String getMacText(byte[] mac) {
        if (mac == null) {
            return "null";
        }

        byte[] chars = new byte[17];

        chars[2] = '-';
        chars[5] = '-';
        chars[8] = '-';
        chars[11] = '-';
        chars[14] = '-';

        return DataCast.bytesToHexWithSeparator(mac, chars, false);
    }
}
