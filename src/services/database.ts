import AsyncStorage from "@react-native-async-storage/async-storage";

export type RolUsuario = "Estudiante" | "Personal";

export type AccesoUTCH =
  | "Acceso 1 (Av. Cantera)"
  | "Acceso 2 (TI / Industrial)";

export type CarreraOption = {
  id: string;
  nombre: string;
  edificio: string;
  accesoRecomendado: AccesoUTCH;
  zonaSugeridaEstudiante: string;
};

export const CARRERAS_UTCH: CarreraOption[] = [
  {
    id: "mecatronica",
    nombre: "Ing. Mecatrónica",
    edificio: "Edificio P",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugeridaEstudiante: "Estudiantes Norte",
  },
  {
    id: "energias",
    nombre: "Ing. Energías Renovables",
    edificio: "Edificio P",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugeridaEstudiante: "Estudiantes Norte",
  },
  {
    id: "mantenimiento",
    nombre: "Ing. Mantenimiento Industrial",
    edificio: "Edificio N",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugeridaEstudiante: "Estudiantes Norte",
  },
  {
    id: "negocios",
    nombre: "Lic. Negocios y Mercadotecnia",
    edificio: "Edificio G",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugeridaEstudiante: "Estudiantes Centro",
  },
  {
    id: "ti",
    nombre: "Ing. Tecnologías de la Información",
    edificio: "Edificio I",
    accesoRecomendado: "Acceso 2 (TI / Industrial)",
    zonaSugeridaEstudiante: "Estudiantes Sur",
  },
  {
    id: "industrial",
    nombre: "Ing. Industrial",
    edificio: "Edificio K",
    accesoRecomendado: "Acceso 2 (TI / Industrial)",
    zonaSugeridaEstudiante: "Estudiantes Sur",
  },
  {
    id: "rectoria_admin",
    nombre: "Docente / Administrativo",
    edificio: "Edificios E / R",
    accesoRecomendado: "Acceso 1 (Av. Cantera)",
    zonaSugeridaEstudiante: "Personal L",
  },
];

export type Usuario = {
  matricula: string;
  nombre: string;
  password: string;
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

export type DatosRegistro = {
  matricula: string;
  nombre: string;
  password: string;
  rol: RolUsuario;
  carreraId: string;
  placas: string;
  vehiculo: string;
  accesible: boolean;
};

const CLAVE_USUARIOS = "@utch_park_usuarios_v1";
const CLAVE_SESION = "@utch_park_sesion_v1";

export async function obtenerUsuarios(): Promise<Usuario[]> {
  const raw = await AsyncStorage.getItem(CLAVE_USUARIOS);
  if (!raw) return [];

  const parsed: unknown = JSON.parse(raw);
  if (
    !Array.isArray(parsed) ||
    parsed.some(
      (usuario) =>
        !usuario ||
        typeof usuario !== "object" ||
        typeof usuario.matricula !== "string" ||
        typeof usuario.password !== "string"
    )
  ) {
    throw new Error("Los datos de las cuentas guardadas no son válidos.");
  }

  return parsed;
}

export async function buscarUsuarioPorMatricula(
  matricula: string
): Promise<Usuario | null> {
  const usuarios = await obtenerUsuarios();
  const limpia = matricula.trim().toUpperCase();
  return usuarios.find((u) => u.matricula === limpia) ?? null;
}

export async function registrarUsuario(
  datos: DatosRegistro
): Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }> {
  const matriculaLimpia = datos.matricula.trim().toUpperCase();
  const nombreLimpio = datos.nombre.trim();
  const placasLimpias = datos.placas.trim().toUpperCase();

  if (matriculaLimpia.length < 4) {
    return {
      ok: false,
      error: "Ingresa una matrícula o número de empleado válido (mínimo 4 caracteres).",
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
  if (placasLimpias.length < 4) {
    return { ok: false, error: "Ingresa las placas de tu vehículo." };
  }

  const usuarios = await obtenerUsuarios();
  if (usuarios.some((u) => u.matricula === matriculaLimpia)) {
    return {
      ok: false,
      error: `La matrícula ${matriculaLimpia} ya está registrada. Inicia sesión.`,
    };
  }

  const carreraInfo =
    CARRERAS_UTCH.find((c) => c.id === datos.carreraId) ?? CARRERAS_UTCH[0];

  const nuevoUsuario: Usuario = {
    matricula: matriculaLimpia,
    nombre: nombreLimpio,
    password: datos.password,
    rol: datos.rol,
    carreraId: carreraInfo.id,
    carreraNombre: carreraInfo.nombre,
    accesoRecomendado: carreraInfo.accesoRecomendado,
    placas: placasLimpias,
    vehiculo: datos.vehiculo.trim() || "Vehículo registrado",
    accesible: datos.accesible,
    codigoQR: `UTCH-${matriculaLimpia}-${placasLimpias}`,
    fechaRegistro: new Date().toISOString(),
  };

  const actualizados = [...usuarios, nuevoUsuario];
  await AsyncStorage.setItem(CLAVE_USUARIOS, JSON.stringify(actualizados));
  await guardarSesionActiva(nuevoUsuario.matricula);

  return { ok: true, usuario: nuevoUsuario };
}

export async function autenticarUsuario(
  matricula: string,
  password: string
): Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }> {
  const limpia = matricula.trim().toUpperCase();
  if (!limpia || !password) {
    return { ok: false, error: "Ingresa tu matrícula y contraseña." };
  }

  const usuario = await buscarUsuarioPorMatricula(limpia);
  if (!usuario) {
    return {
      ok: false,
      error: "No encontramos una cuenta con esa matrícula. Regístrate primero.",
    };
  }

  if (usuario.password !== password) {
    return { ok: false, error: "Contraseña incorrecta." };
  }

  await guardarSesionActiva(usuario.matricula);
  return { ok: true, usuario };
}

export async function guardarSesionActiva(
  matricula: string | null
): Promise<void> {
  if (matricula === null) {
    await AsyncStorage.removeItem(CLAVE_SESION);
  } else {
    await AsyncStorage.setItem(CLAVE_SESION, matricula);
  }
}

export async function obtenerSesionActiva(): Promise<Usuario | null> {
  const matricula = await AsyncStorage.getItem(CLAVE_SESION);
  if (!matricula) return null;
  return await buscarUsuarioPorMatricula(matricula);
}
