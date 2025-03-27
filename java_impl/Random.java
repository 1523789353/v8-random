package com.nyaa.common.util.random;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.concurrent.ThreadLocalRandom;
import java.util.random.RandomGenerator;

/**
 * V8 引擎随机数生成器实现
 * 使用 long 替代 uint64_t
 * 注意: 非密码安全, 非线程安全, 该类旨在实现 高速+跨平台+可预测性
 *
 * @see <a href="https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/numbers/math-random.cc">math-random.cc</a>
 * @see <a href="https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/base/utils/random-number-generator.h">random-number-generator.h</a>
 * @see <a href="https://chromium.googlesource.com/v8/v8/+/refs/heads/master/src/base/utils/random-number-generator.cc">random-number-generator.cc</a>
 */
// java 17 之前使用 extends java.util.Random
public class Random implements RandomGenerator, java.io.Serializable {
    private static final ByteOrder BYTE_ORDER = ByteOrder.BIG_ENDIAN;
    private long state0;
    private long state1;

    public Random() {
        this.setSeed(getDefaultSeed());
    }

    public Random(long seed) {
        this.setSeed(seed);
    }

    private long getDefaultSeed() {
        long seed = ThreadLocalRandom.current().nextLong();
        if (seed < 0) {
            seed = -seed;
        }
        return seed; // fallback: System.currentTimeMillis() / System.nanoTime()
    }

    /**
     * 设置种子, 使用 MurmurHash3 算法初始化 state0 和 state1
     * * 使用 extends java.util.Random 时, 需要修改方法名字, 否则会传入由 java.util.Random 生成的 seed *
     */
    public void setSeed(long seed) {
        this.state0 = this.murmurHash3(seed);
        this.state1 = this.murmurHash3(~this.state0);
        if (this.state0 == 0L && this.state1 == 0L) {
            throw new IllegalStateException("State cannot be zero.");
        }
    }

    @Override
    public boolean isDeprecated() {
        return false;
    }

    /**
     * MurmurHash3 算法
     */
    private long murmurHash3(long h) {
        h ^= h >>> 33;
        h *= 0xFF51AFD7ED558CCDL;
        h ^= h >>> 33;
        h *= 0xC4CEB9FE1A85EC53L;
        h ^= h >>> 33;
        return h;
    }

    /**
     * 生成下一个state0
     */
    private void xorShift128() {
        long s1 = this.state0;
        long s0 = this.state1;

        this.state0 = s0;
        s1 ^= (s1 << 23);
        s1 ^= s1 >>> 17;
        s1 ^= s0;
        s1 ^= s0 >>> 26;
        this.state1 = s1;
    }

    @Override
    public boolean nextBoolean() {
        return this.nextLong() < 0;
    }

    @Override
    public int nextInt() {
        return (int) this.nextLong();
    }

    @Override
    public int nextInt(int bound) {
        RandomSupport.checkBound(bound);
        if ((bound & (bound - 1)) == 0) {
            int r = (int) (this.nextLong() & Integer.MAX_VALUE);
            return r & (bound - 1);
        }
        final int limit = Integer.MAX_VALUE - (Integer.MAX_VALUE % bound);
        while (true) {
            final long r64 = this.nextLong();
            int r32 = (int) (r64 & Integer.MAX_VALUE);
            if (r32 < limit) {
                return r32 % bound;
            }
            r32 = (int) ((r64 >>> 32) & Integer.MAX_VALUE);
            if (r32 < limit) {
                return r32 % bound;
            }
        }
    }

    @Override
    public int nextInt(int origin, int bound) {
        RandomSupport.checkRange(origin, bound);
        return origin + (int) this.nextLong(origin + bound);
    }

    @Override
    public long nextLong() {
        this.xorShift128();
        return this.murmurHash3(this.state0 ^ this.state1);
    }

    @Override
    public long nextLong(long bound) {
        RandomSupport.checkBound(bound);
        if ((bound & (bound - 1)) == 0) {
            return (this.nextLong() >>> 1) & (bound - 1);
        }
        final long limit = Long.MAX_VALUE - (Long.MAX_VALUE % bound);
        while (true) {
            final long r = (this.nextLong() >>> 1);
            if (r < limit) {
                return r % bound;
            }
        }
    }

    @Override
    public long nextLong(long origin, long bound) {
        RandomSupport.checkRange(origin, bound);
        return origin + Math.floorMod(this.nextLong(), bound - origin);
    }

    @Override
    public float nextFloat() {
        return DataCast.toLimitedFloat(this.nextLong());
    }

    @Override
    public float nextFloat(float bound) {
        RandomSupport.checkBound(bound);
        return (float) (this.nextDouble() * bound);
    }

    @Override
    public float nextFloat(float origin, float bound) {
        RandomSupport.checkRange(origin, bound);
        return (float) (origin + this.nextDouble() * (bound - origin));
    }

    @Override
    public double nextDouble() {
        return DataCast.toLimitedDouble(this.nextLong());
    }

    @Override
    public double nextDouble(double bound) {
        RandomSupport.checkBound(bound);
        return this.nextDouble() * bound;
    }

    @Override
    public double nextDouble(double origin, double bound) {
        RandomSupport.checkRange(origin, bound);
        return origin + (this.nextDouble() * (bound - origin));
    }

    @Override
    public void nextBytes(byte[] bytes) {
        ByteBuffer buffer = ByteBuffer.wrap(bytes).order(Random.BYTE_ORDER);

        int i = 0;
        for (; i < bytes.length / 8; i++) {
            buffer.putLong(i * 8, this.nextLong());
        }
        i *= 8;
        if (i == bytes.length) {
            return;
        }
        long r = this.nextLong();
        for (int j = 7; j >= 0; j--) {
            if (i + j < bytes.length) { // 最后 chunk 不满 8byte 时, 会下标溢出
                buffer.put(i + j, (byte) (r & 0xFF));
            }
            r >>>= 8;
        }
    }

    @Override
    public double nextExponential() {
        // 生成一个均匀分布的随机数 U
        double U = this.nextDouble();
        // 避免 U 为 0，因为 ln(0) 是未定义的
        while (U == 0.0) {
            U = this.nextDouble();
        }
        // 使用逆变换法生成指数分布的随机数
        return -Math.log(1.0 - U);
    }

    @Override
    public double nextGaussian() {
        // Box-Muller 变换需要两个均匀分布的随机数
        double U1 = this.nextDouble();
        double U2 = this.nextDouble();
        // 避免 U1 为 0，因为 ln(0) 是未定义的
        while (U1 == 0.0) {
            U1 = this.nextDouble();
        }
        // 使用 Box-Muller 变换生成标准正态分布的随机数
        return Math.sqrt(-2.0 * Math.log(U1)) * Math.cos(2.0 * Math.PI * U2);
    }

    public UUID nextUUIDv4() {
        byte[] bytes = new byte[16];
        this.nextBytes(bytes);
        return new UUID(bytes);
    }
}
