package com.nyaa.common.util.random;

public class RandomSupport {
    public static final String BAD_SIZE = "size must be non-negative";
    public static final String BAD_DISTANCE = "jump distance must be finite, positive, and an exact integer";
    public static final String BAD_BOUND = "bound must be positive";
    public static final String BAD_FLOATING_BOUND = "bound must be finite and positive";
    public static final String BAD_RANGE = "bound must be greater than origin";

    public static void checkStreamSize(long streamSize) {
        if (streamSize < 0L) {
            throw new IllegalArgumentException(BAD_SIZE);
        }
    }

    public static void checkBound(float bound) {
        if (!(0.0f < bound && bound < Float.POSITIVE_INFINITY)) {
            throw new IllegalArgumentException(BAD_FLOATING_BOUND);
        }
    }

    public static void checkBound(double bound) {
        if (!(0.0 < bound && bound < Double.POSITIVE_INFINITY)) {
            throw new IllegalArgumentException(BAD_FLOATING_BOUND);
        }
    }

    public static void checkBound(int bound) {
        if (bound <= 0) {
            throw new IllegalArgumentException(BAD_BOUND);
        }
    }

    public static void checkBound(long bound) {
        if (bound <= 0) {
            throw new IllegalArgumentException(BAD_BOUND);
        }
    }

    public static void checkRange(float origin, float bound) {
        if (!(Float.NEGATIVE_INFINITY < origin && origin < bound &&
                bound < Float.POSITIVE_INFINITY)) {
            throw new IllegalArgumentException(BAD_RANGE);
        }
    }

    public static void checkRange(double origin, double bound) {
        if (!(Double.NEGATIVE_INFINITY < origin && origin < bound &&
                bound < Double.POSITIVE_INFINITY)) {
            throw new IllegalArgumentException(BAD_RANGE);
        }
    }

    public static void checkRange(int origin, int bound) {
        if (origin >= bound) {
            throw new IllegalArgumentException(BAD_RANGE);
        }
    }

    public static void checkRange(long origin, long bound) {
        if (origin >= bound) {
            throw new IllegalArgumentException(BAD_RANGE);
        }
    }
}
