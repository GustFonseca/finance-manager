import { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'util';

export function installTextCodec() {
  Object.assign(globalThis, { TextDecoder: NodeTextDecoder, TextEncoder: NodeTextEncoder });
}

export function bufferOf(text: string, encoding: BufferEncoding = 'utf8'): ArrayBuffer {
  const bytes = Buffer.from(text, encoding);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
