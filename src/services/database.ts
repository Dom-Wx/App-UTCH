import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  cifrarObjetoParaStorage,
  comparacionTiempoConstante,
  derivarHashPassword,
  descifrarObjetoDeStorage,
  generarSalAleatoria,
} from "./seguridad";

export type RolUsuario = "Alumno" | "Docente";

export type AccesoUTCH =
  | "Acceso 1 (Av. Cantera)"
  | "Acceso 2 (TI / Industrial)";

export type CarreraOption = {
  id: string;
  nombre: string;
  edificio: string;
  accesoRecomendado: AccesoUTCH;
  zonaSugerida: string;
};

export const CARRERAS_UTCH: CarreraOption[] = [
  {
    id: "escolares_general",
    nombre: "Trámites / Servicios Escolares (Edificio D)",
    edificio: "Edificio D",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugerida: "ED",
  },
  {
    id: "ti",
    nombre: "Ing. Tecnologías de la Información",
    edificio: "Edificio I",
    accesoRecomendado: "Acceso 2 (TI / Industrial)",
    zonaSugerida: "EI",
  },
  {
    id: "industrial",
    nombre: "Ing. Industrial",
    edificio: "Edificio K",
    accesoRecomendado: "Acceso 2 (TI / Industrial)",
    zonaSugerida: "EI",
  },
  {
    id: "mecatronica",
    nombre: "Ing. Mecatrónica",
    edificio: "Edificio P",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugerida: "EP",
  },
  {
    id: "energias",
    nombre: "Ing. Energías Renovables",
    edificio: "Edificio P",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugerida: "EP",
  },
  {
    id: "mantenimiento",
    nombre: "Ing. Mantenimiento Industrial",
    edificio: "Edificio N",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugerida: "EP",
  },
  {
    id: "negocios",
    nombre: "Lic. Negocios y Mercadotecnia",
    edificio: "Edificio G / D",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugerida: "ED",
  },
  {
    id: "docente_academico",
    nombre: "Docente / Cuerpo Académico UTCH",
    edificio: "Edificios D / E / R",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugerida: "ED",
  },
];

// Objeto público seguro: NO expone password, passwordHash ni salt a la interfaz
export type Usuario = {
  matricula: string;
  nombre: string;
  rol: RolUsuario;
  carreraId: string;
  carreraNombre: string;
  accesoRecomendado: AccesoUTCH;
  placas: string;
  vehiculo: string;
  accesible: boolean;
  codigoQR: string;
  fechaRegistro: string;
};

// Registro interno en bóveda cifrada con hash PBKDF-HMAC-SHA256 y sal única
type UsuarioBoveda = Usuario & {
  passwordHash: string;
  salt: string;
};

export type DatosRegistro = {
  matricula: string;
  nombre: string;
  password: string;
  rol: RolUsuario;
  carreraId: string;
  placas?: string;
  vehiculo?: string;
  accesible?: boolean;
};

const CLAVE_BOVEDA_USUARIOS = "@utch_park_boveda_usuarios_v2";
const CLAVE_USUARIOS_LEGACY = "@utch_park_usuarios_v1";
const CLAVE_BOVEDA_SESION = "@utch_park_boveda_sesion_v2";
const CLAVE_SESION_LEGACY = "@utch_park_sesion_v1";

// Control en memoria contra ataques de fuerza bruta (máximo 5 intentos fallidos)
const intentosFallidosPorCuenta: Record<
  string,
  { conteo: number; bloqueadoHasta: number }
> = {};
const MAX_INTENTOS_LOGIN = 5;
const TIEMPO_BLOQUEO_MS = 60 * 1000; // 60 segundos

function normalizarRol(rol: unknown): RolUsuario {
  if (rol === "Docente" || rol === "Personal") {
    return "Docente";
  }
  return "Alumno";
}

function sanitizarUsuarioPublico(u: UsuarioBoveda): Usuario {
  const { passwordHash: _h, salt: _s, ...publico } = u;
  return publico;
}

async function guardarBovedaInterna(usuarios: UsuarioBoveda[]): Promise<void> {
  const payloadCifrado = cifrarObjetoParaStorage(usuarios);
  await AsyncStorage.setItem(CLAVE_BOVEDA_USUARIOS, payloadCifrado);
  // Elimina cualquier rastro de la versión anterior sin cifrar
  await AsyncStorage.removeItem(CLAVE_USUARIOS_LEGACY);
}

async function leerBovedaInterna(): Promise<UsuarioBoveda[]> {
  const rawBoveda = await AsyncStorage.getItem(CLAVE_BOVEDA_USUARIOS);

  if (rawBoveda) {
    const descifrado = descifrarObjetoDeStorage<unknown>(rawBoveda);
    if (!Array.isArray(descifrado)) {
      throw new Error("La bóveda de cuentas tiene un formato inválido.");
    }
    return descifrado as UsuarioBoveda[];
  }

  // Migración automática y segura si existían cuentas de la versión anterior
  const rawLegacy = await AsyncStorage.getItem(CLAVE_USUARIOS_LEGACY);
  if (!rawLegacy) return [];

  const parsedLegacy = descifrarObjetoDeStorage<unknown>(rawLegacy);
  if (!Array.isArray(parsedLegacy)) return [];

  const migrados: UsuarioBoveda[] = [];
  for (const item of parsedLegacy) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const matricula =
      typeof obj.matricula === "string"
        ? obj.matricula.trim().toUpperCase()
        : "";
    if (!matricula) continue;

    let salt = typeof obj.salt === "string" ? obj.salt : "";
    let passwordHash =
      typeof obj.passwordHash === "string" ? obj.passwordHash : "";

    if (!passwordHash && typeof obj.password === "string") {
      salt = generarSalAleatoria(16);
      passwordHash = derivarHashPassword(obj.password, salt, matricula);
    }

    if (!passwordHash || !salt) continue;

    migrados.push({
      matricula,
      nombre: typeof obj.nombre === "string" ? obj.nombre : "Usuario UTCH",
      rol: normalizarRol(obj.rol),
      carreraId:
        typeof obj.carreraId === "string"
          ? obj.carreraId
          : "escolares_general",
      carreraNombre:
        typeof obj.carreraNombre === "string"
          ? obj.carreraNombre
          : "Comunidad UTCH",
      accesoRecomendado:
        obj.accesoRecomendado === "Acceso 2 (TI / Industrial)"
          ? "Acceso 2 (TI / Industrial)"
          : "Acceso 1 (Av. Cantera)",
      placas: typeof obj.placas === "string" ? obj.placas : "SIN-PLACAS",
      vehiculo:
        typeof obj.vehiculo === "string"
          ? obj.vehiculo
          : "Vehículo particular",
      accesible: Boolean(obj.accesible),
      codigoQR:
        typeof obj.codigoQR === "string" ? obj.codigoQR : `UTCH-${matricula}`,
      fechaRegistro:
        typeof obj.fechaRegistro === "string"
          ? obj.fechaRegistro
          : new Date().toISOString(),
      passwordHash,
      salt,
    });
  }

  await guardarBovedaInterna(migrados);
  return migrados;
}

export async function buscarUsuarioPorMatricula(
  matricula: string
): Promise<Usuario | null> {
  const boveda = await leerBovedaInterna();
  const limpia = matricula.trim().toUpperCase();
  const encontrado = boveda.find((u) => u.matricula === limpia);
  return encontrado ? sanitizarUsuarioPublico(encontrado) : null;
}

export async function registrarUsuario(
  datos: DatosRegistro
): Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }> {
  const matriculaLimpia = datos.matricula.trim().toUpperCase();
  const nombreLimpio = datos.nombre.trim();
  const placasLimpias =
    (datos.placas ?? "").trim().toUpperCase() || "SIN-PLACAS";

  if (matriculaLimpia.length < 3) {
    return {
      ok: false,
      error:
        "Ingresa una matrícula de alumno o clave de docente válida (mínimo 3 caracteres).",
    };
  }
  if (nombreLimpio.length < 3) {
    return { ok: false, error: "Ingresa tu nombre completo." };
  }
  if (datos.password.length < 4) {
    return {
      ok: false,
      error: "La contraseña debe tener al menos 4 caracteres.",
    };
  }

  const boveda = await leerBovedaInterna();
  if (boveda.some((u) => u.matricula === matriculaLimpia)) {
    return {
      ok: false,
      error: `La cuenta ${matriculaLimpia} ya está registrada. Inicia sesión.`,
    };
  }

  const carreraInfo =
    CARRERAS_UTCH.find((c) => c.id === datos.carreraId) ?? CARRERAS_UTCH[0];

  // Generación de sal criptográfica única y hash irreversible de 500 rondas
  const salt = generarSalAleatoria(16);
  const passwordHash = derivarHashPassword(
    datos.password,
    salt,
    matriculaLimpia
  );

  const nuevoEnBoveda: UsuarioBoveda = {
    matricula: matriculaLimpia,
    nombre: nombreLimpio,
    passwordHash,
    salt,
    rol: normalizarRol(datos.rol),
    carreraId: carreraInfo.id,
    carreraNombre: carreraInfo.nombre,
    accesoRecomendado: carreraInfo.accesoRecomendado,
    placas: placasLimpias,
    vehiculo: (datos.vehiculo ?? "").trim() || "Vehículo particular",
    accesible: Boolean(datos.accesible),
    codigoQR: `UTCH-${matriculaLimpia}`,
    fechaRegistro: new Date().toISOString(),
  };

  const actualizados = [...boveda, nuevoEnBoveda];
  await guardarBovedaInterna(actualizados);
  await guardarSesionActiva(nuevoEnBoveda.matricula);

  return { ok: true, usuario: sanitizarUsuarioPublico(nuevoEnBoveda) };
}

export async function autenticarUsuario(
  matricula: string,
  password: string
): Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }> {
  const limpia = matricula.trim().toUpperCase();
  if (!limpia || !password) {
    return { ok: false, error: "Ingresa tu matrícula/clave y contraseña." };
  }

  // Verificar si la cuenta está temporalmente bloqueada por intentos fallidos
  const estadoIntentos = intentosFallidosPorCuenta[limpia];
  if (estadoIntentos && estadoIntentos.bloqueadoHasta > Date.now()) {
    const segundosRestantes = Math.ceil(
      (estadoIntentos.bloqueadoHasta - Date.now()) / 1000
    );
    return {
      ok: false,
      error: `Cuenta protegida por demasiados intentos fallidos. Espera ${segundosRestantes} segundos para volver a intentar.`,
    };
  }

  const boveda = await leerBovedaInterna();
  const usuarioInterno = boveda.find((u) => u.matricula === limpia);

  // Mensaje genérico seguro y verificación en tiempo constante
  if (!usuarioInterno) {
    return {
      ok: false,
      error:
        "Credenciales inválidas o cuenta no encontrada. Verifica tu matrícula y contraseña.",
    };
  }

  const hashCalculado = derivarHashPassword(
    password,
    usuarioInterno.salt,
    limpia
  );
  const coincide = comparacionTiempoConstante(
    hashCalculado,
    usuarioInterno.passwordHash
  );

  if (!coincide) {
    const previo = intentosFallidosPorCuenta[limpia]?.conteo ?? 0;
    const nuevoConteo = previo + 1;
    if (nuevoConteo >= MAX_INTENTOS_LOGIN) {
      intentosFallidosPorCuenta[limpia] = {
        conteo: 0,
        bloqueadoHasta: Date.now() + TIEMPO_BLOQUEO_MS,
      };
      return {
        ok: false,
        error:
          "Se superó el límite de 5 intentos fallidos. Por seguridad, la cuenta se bloqueó temporalmente por 60 segundos.",
      };
    }

    intentosFallidosPorCuenta[limpia] = {
      conteo: nuevoConteo,
      bloqueadoHasta: 0,
    };
    const restantes = MAX_INTENTOS_LOGIN - nuevoConteo;
    return {
      ok: false,
      error: `Contraseña incorrecta (${restantes} intento(s) restante(s) antes del bloqueo temporal).`,
    };
  }

  delete intentosFallidosPorCuenta[limpia];
  await guardarSesionActiva(usuarioInterno.matricula);
  return { ok: true, usuario: sanitizarUsuarioPublico(usuarioInterno) };
}

export async function guardarSesionActiva(
  matricula: string | null
): Promise<void> {
  await AsyncStorage.removeItem(CLAVE_SESION_LEGACY);
  if (matricula === null) {
    await AsyncStorage.removeItem(CLAVE_BOVEDA_SESION);
  } else {
    const tokenSesionCifrado = cifrarObjetoParaStorage({
      matricula: matricula.trim().toUpperCase(),
      emitidoEn: Date.now(),
    });
    await AsyncStorage.setItem(CLAVE_BOVEDA_SESION, tokenSesionCifrado);
  }
}

export async function obtenerSesionActiva(): Promise<Usuario | null> {
  const rawToken = await AsyncStorage.getItem(CLAVE_BOVEDA_SESION);
  if (rawToken) {
    try {
      const sesion = descifrarObjetoDeStorage<{
        matricula?: string;
        emitidoEn?: number;
      }>(rawToken);
      if (sesion && typeof sesion.matricula === "string") {
        return await buscarUsuarioPorMatricula(sesion.matricula);
      }
    } catch {
      await AsyncStorage.removeItem(CLAVE_BOVEDA_SESION);
      return null;
    }
  }

  // Migración de sesión previa si existía
  const legacyMatricula = await AsyncStorage.getItem(CLAVE_SESION_LEGACY);
  if (!legacyMatricula) return null;
  await guardarSesionActiva(legacyMatricula);
  return await buscarUsuarioPorMatricula(legacyMatricula);
}

export async function actualizarVehiculoUsuario(
  matricula: string,
  datos: { vehiculo: string; placas: string }
): Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }> {
  const limpia = matricula.trim().toUpperCase();
  const vehiculoLimpio = datos.vehiculo.trim();
  const placasLimpias = datos.placas.trim().toUpperCase();

  if (vehiculoLimpio.length < 2) {
    return {
      ok: false,
      error: "Ingresa el modelo y color de tu carro (ej. Nissan Versa Blanco).",
    };
  }

  const boveda = await leerBovedaInterna();
  const indice = boveda.findIndex((u) => u.matricula === limpia);
  if (indice === -1) {
    return { ok: false, error: "No se encontró tu cuenta activa." };
  }

  const actualizado: UsuarioBoveda = {
    ...boveda[indice],
    vehiculo: vehiculoLimpio,
    placas: placasLimpias || "SIN-PLACAS",
  };

  boveda[indice] = actualizado;
  await guardarBovedaInterna(boveda);

  return { ok: true, usuario: sanitizarUsuarioPublico(actualizado) };
}
