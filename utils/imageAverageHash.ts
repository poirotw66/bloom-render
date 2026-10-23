/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * 8×8 average hash helpers for viral thumbnail uniqueness tests.
 * Uses `sharp` (transitive via @huggingface/transformers).
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

type SharpInstance = {
  resize: (
    w: number,
    h: number,
    opts?: { fit?: string },
  ) => {
    greyscale: () => {
      raw: () => {
        toBuffer: (opts?: {
          resolveWithObject?: boolean;
        }) => Promise<{ data: Buffer; info: { width: number; height: number } }>;
      };
    };
  };
};

type SharpFn = (input: string) => SharpInstance;

function loadSharp(): SharpFn {
  return require('sharp') as SharpFn;
}

/** 64-bit average hash of an on-disk image (8×8 grayscale). */
export async function averageHashFromFile(filePath: string, size = 8): Promise<bigint> {
  const sharp = loadSharp();
  const { data } = await sharp(filePath)
    .resize(size, size, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return averageHashFromGray(data, size);
}

export function averageHashFromGray(pixels: Uint8Array | Buffer | number[], size = 8): bigint {
  const expected = size * size;
  if (pixels.length < expected) {
    throw new Error(`expected ${expected} gray pixels, got ${pixels.length}`);
  }
  let sum = 0;
  for (let i = 0; i < expected; i++) sum += pixels[i]!;
  const avg = sum / expected;
  let bits = 0n;
  for (let i = 0; i < expected; i++) {
    if ((pixels[i] ?? 0) >= avg) bits |= 1n << BigInt(i);
  }
  return bits;
}

/** Hamming distance between two average hashes. */
export function hammingDistance(a: bigint, b: bigint): number {
  let x = a ^ b;
  let count = 0;
  while (x > 0n) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}
