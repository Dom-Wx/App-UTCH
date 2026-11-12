// Módulo de seguridad criptográfica para UTCH ParkMate
// Implementa SHA-256, HMAC-SHA256, derivación con sal (PBKDF-SHA256),
// cifrado autenticado (CTR-HMAC-SHA256) y anonimización de matrículas.

const K_SHA256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

function utf8ABytes(texto: string): number[] {
  const encoded = encodeURIComponent(texto);
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    if (encoded[i] === "%") {
      bytes.push(parseInt(encoded.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(encoded.charCodeAt(i));
    }
  }
  return bytes;
}

function bytesAUtf8(bytes: number[]): string {
  let hexEscaped = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] & 0xff;
    hexEscaped += "%" + b.toString(16).padStart(2, "0");
  }
  return decodeURIComponent(hexEscaped);
}

function bytesAHex(bytes: number[]): string {
  return bytes.map((b) => (b & 0xff).toString(16).padStart(2, "0")).join("");
}

function hexABytes(hex: string): number[] {
  if (hex.length % 2 !== 0) return [];
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

export function sha256Bytes(mensajeBytes: number[]): number[] {
  const bytes = [...mensajeBytes];
  const bitLen = bytes.length * 8;

  bytes.push(0x80);
  while ((bytes.length * 8) % 512 !== 448) {
    bytes.push(0);
  }

  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  for (let i = 3; i >= 0; i--) bytes.push((highBits >>> (i * 8)) & 0xff);
  for (let i = 3; i >= 0; i--) bytes.push((lowBits >>> (i * 8)) & 0xff);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Array<number>(64);

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      const idx = offset + i * 4;
      w[i] =
        ((bytes[idx] << 24) |
          (bytes[idx + 1] << 16) |
          (bytes[idx + 2] << 8) |
          bytes[idx + 3]) >>>
        0;
    }

    for (let i = 16; i < 64; i++) {
      const s0 =
        (rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3)) >>> 0;
      const s1 =
        (rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = (rotr(6, e) ^ rotr(11, e) ^ rotr(25, e)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + K_SHA256[i] + w[i]) >>> 0;
      const S0 = (rotr(2, a) ^ rotr(13, a) ^ rotr(22, a)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const resultado: number[] = [];
  for (const palabra of [h0, h1, h2, h3, h4, h5, h6, h7]) {
    resultado.push((palabra >>> 24) & 0xff);
    resultado.push((palabra >>> 16) & 0xff);
    resultado.push((palabra >>> 8) & 0xff);
    resultado.push(palabra & 0xff);
  }
  return resultado;
}

export function sha256Hex(texto: string): string {
  return bytesAHex(sha256Bytes(utf8ABytes(texto)));
}

export function hmacSha256Bytes(
  llaveBytes: number[],
  mensajeBytes: number[]
): number[] {
  const tamBloque = 64;
  let llave = [...llaveBytes];
  if (llave.length > tamBloque) {
    llave = sha256Bytes(llave);
  }
  while (llave.length < tamBloque) {
    llave.push(0);
  }

  const oKeyPad = llave.map((b) => b ^ 0x5c);
  const iKeyPad = llave.map((b) => b ^ 0x36);

  const interno = sha256Bytes([...iKeyPad, ...mensajeBytes]);
  return sha256Bytes([...oKeyPad, ...interno]);
}

// Comparación en tiempo constante para evitar ataques de timing
export function comparacionTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function generarSalAleatoria(longitudBytes = 16): string {
  const bytes: number[] = [];
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    const arr = new Uint8Array(longitudBytes);
    globalThis.crypto.getRandomValues(arr);
    for (let i = 0; i < arr.length; i++) bytes.push(arr[i]);
  } else {
    for (let i = 0; i < longitudBytes; i++) {
      bytes.push(
        Math.floor(Math.random() * 256) ^ ((Date.now() >>> (i % 8)) & 0xff)
      );
    }
  }
  return bytesAHex(bytes);
}

// Derivación multicapa con sal única y contexto de matrícula (500 rondas HMAC-SHA256)
export function derivarHashPassword(
  password: string,
  salHex: string,
  matricula: string
): string {
  const llave = utf8ABytes(`UTCH_PARKMATE_PEPPER_V2:${password}`);
  let bloque = utf8ABytes(`${salHex}:${matricula.trim().toUpperCase()}`);

  for (let i = 0; i < 500; i++) {
    bloque = hmacSha256Bytes(llave, [...bloque, i & 0xff]);
  }
  return bytesAHex(bloque);
}

// Llave maestra derivada para cifrado autenticado en almacenamiento local
const LLAVE_CIFRADO_STORAGE = sha256Bytes(
  utf8ABytes("UTCH_PARKMATE_VAULT_KEY_2026_CHIHUAHUA_SEGURIDAD_BETA")
);
const LLAVE_MAC_STORAGE = sha256Bytes(
  utf8ABytes("UTCH_PARKMATE_VAULT_HMAC_INTEGRITY_2026_UTCH")
);

const PREFIJO_CIFRADO = "UTCH_ENC_V2:";

// Cifra cualquier objeto JSON con flujo CTR-HMAC-SHA256 + etiqueta de integridad HMAC
export function cifrarObjetoParaStorage(datos: unknown): string {
  const json = JSON.stringify(datos);
  const textoBytes = utf8ABytes(json);
  const ivHex = generarSalAleatoria(16);
  const ivBytes = hexABytes(ivHex);

  const cifradoBytes: number[] = [];
  let contador = 0;

  for (let offset = 0; offset < textoBytes.length; offset += 32) {
    const bloqueContador = [
      ...ivBytes,
      (contador >>> 24) & 0xff,
      (contador >>> 16) & 0xff,
      (contador >>> 8) & 0xff,
      contador & 0xff,
    ];
    const keystream = hmacSha256Bytes(LLAVE_CIFRADO_STORAGE, bloqueContador);
    contador++;

    for (let j = 0; j < 32 && offset + j < textoBytes.length; j++) {
      cifradoBytes.push(textoBytes[offset + j] ^ keystream[j]);
    }
  }

  const cifradoHex = bytesAHex(cifradoBytes);
  const macBytes = hmacSha256Bytes(LLAVE_MAC_STORAGE, [
    ...ivBytes,
    ...cifradoBytes,
  ]);
  const macHex = bytesAHex(macBytes);

  return `${PREFIJO_CIFRADO}${ivHex}:${cifradoHex}:${macHex}`;
}

// Verifica la firma HMAC-SHA256 y descifra el contenido; lanza error si fue alterado
export function descifrarObjetoDeStorage<T>(contenido: string): T {
  // Compatibilidad con datos previos sin cifrar para migrarlos automáticamente
  if (!contenido.startsWith(PREFIJO_CIFRADO)) {
    return JSON.parse(contenido) as T;
  }

  const sinPrefijo = contenido.slice(PREFIJO_CIFRADO.length);
  const partes = sinPrefijo.split(":");
  if (partes.length !== 3) {
    throw new Error("Formato de bóveda cifrada inválido.");
  }

  const [ivHex, cifradoHex, macRecibidoHex] = partes;
  const ivBytes = hexABytes(ivHex);
  const cifradoBytes = hexABytes(cifradoHex);

  const macEsperadoHex = bytesAHex(
    hmacSha256Bytes(LLAVE_MAC_STORAGE, [...ivBytes, ...cifradoBytes])
  );

  if (!comparacionTiempoConstante(macRecibidoHex, macEsperadoHex)) {
    throw new Error(
      "Alerta de seguridad: Los datos almacenados fueron alterados externamente."
    );
  }

  const textoBytes: number[] = [];
  let contador = 0;

  for (let offset = 0; offset < cifradoBytes.length; offset += 32) {
    const bloqueContador = [
      ...ivBytes,
      (contador >>> 24) & 0xff,
      (contador >>> 16) & 0xff,
      (contador >>> 8) & 0xff,
      contador & 0xff,
    ];
    const keystream = hmacSha256Bytes(LLAVE_CIFRADO_STORAGE, bloqueContador);
    contador++;

    for (let j = 0; j < 32 && offset + j < cifradoBytes.length; j++) {
      textoBytes.push(cifradoBytes[offset + j] ^ keystream[j]);
    }
  }

  const json = bytesAUtf8(textoBytes);
  return JSON.parse(json) as T;
}

// Genera un identificador anónimo irreversible para una matrícula
export function hashAnonimoMatricula(matricula: string): string {
  const limpia = matricula.trim().toUpperCase();
  return sha256Hex(`UTCH_ANON_PARK_ID_V2:${limpia}`).slice(0, 24);
}

