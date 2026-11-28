/** Dimensions for the PNG and RGB VP8 WebP encodings used by reviewed references. */
export function generatedImageDimensions(bytes, format = 'png') {
  if (
    format === 'png' &&
    bytes.length >= 24 &&
    bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
  )
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (
    format === 'webp' &&
    bytes.length >= 30 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.readUInt32LE(4) + 8 === bytes.length &&
    bytes.toString('ascii', 8, 16) === 'WEBPVP8 ' &&
    bytes.subarray(23, 26).toString('hex') === '9d012a'
  )
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  if (
    format === 'webp' &&
    bytes.length >= 25 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.readUInt32LE(4) + 8 === bytes.length &&
    bytes.toString('ascii', 8, 16) === 'WEBPVP8L' &&
    bytes[20] === 0x2f
  ) {
    const bits = bytes.readUInt32LE(21);
    if (bits >>> 29 !== 0) return null;
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  return null;
}
