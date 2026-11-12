import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import {
  calcularZona,
  estadoInicialZona,
  EstadoZonaGuardado,
  Zona,
  zonasIniciales,
} from "../data/estacionamientos";
import {
  cifrarObjetoParaStorage,
  descifrarObjetoDeStorage,
  hashAnonimoMatricula,
} from "../services/seguridad";

export type VehiculoEstacionado = {
  tokenAnonimo: string;
  zonaId: string;
  zonaNombre: string;
  fraseReporte: string;
  horaIngreso: string;
};

export type ReporteMalEstacionado = {
  id: string;
  zonaId: string;
  zonaNombre: string;
  motivo: string;
  fotoUri: string;
  rolReportante: string;
  hora: string;
};

export type AlertaSaturacion = {
  zonaId: string;
  zonaNombre: string;
  personasEnElLugar: number;
  capacidadRealDetectada: number | null;
  nivel: "concurrido" | "lleno";
  mensaje: string;
  detalleReporte?: string;
  alternativa?: string;
};

export type DatosUsuarioReporte = {
  matricula: string;
  nombre: string;
  rol: string;
};

type ResultadoAccion =
  | {
      ok: true;
      zonaId: string;
      zonaNombre: string;
      mensaje: string;
    }
  | { ok: false; error: string };

type EstacionamientoContextType = {
  zonas: Zona[];
  alertasSaturacion: AlertaSaturacion[];
  vehiculosEstacionados: Record<string, VehiculoEstacionado>;
  reportesMalEstacionado: ReporteMalEstacionado[];
  cargando: boolean;
  errorCarga: string | null;
  obtenerCajonDeUsuario: (
    matricula: string | null
  ) => VehiculoEstacionado | null;
  reportarLlegadaEnZona: (
    zonaId: string,
    usuario: DatosUsuarioReporte
  ) => Promise<ResultadoAccion>;
  reportarCupoLleno: (
    zonaId: string,
    usuario: DatosUsuarioReporte
  ) => Promise<ResultadoAccion>;
  reportarEspacioDisponible: (
    zonaId: string,
    usuario: DatosUsuarioReporte
  ) => Promise<ResultadoAccion>;
  registrarSalidaVehiculo: (matricula: string) => Promise<ResultadoAccion>;
  publicarReporteMalEstacionado: (datos: {
    zonaId: string;
    motivo: string;
    fotoUri: string;
    rolReportante: string;
  }) => Promise<ResultadoAccion>;
  sumarAutoComunidad: (zonaId: string) => Promise<ResultadoAccion>;
  reiniciarEstacionamientos: () => Promise<void>;
};

const CLAVE_ESTADOS_ZONA = "@utch_park_estados_colaborativos_v2";
const CLAVE_ACTIVOS = "@utch_park_activos_colaborativos_v2";
const CLAVE_REPORTES_FOTOS = "@utch_park_reportes_mal_estacionado_v1";

function crearEstadosIniciales(): Record<string, EstadoZonaGuardado> {
  const mapa: Record<string, EstadoZonaGuardado> = {};
  for (const zona of zonasIniciales) {
    mapa[zona.id] = estadoInicialZona();
  }
  return mapa;
}

function horaActual(): string {
  return new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatearFraseLlegada(nombreZona: string): string {
  if (nombreZona.toLowerCase().startsWith("edificio ")) {
    return `Me estacioné en el edificio ${nombreZona.slice("Edificio ".length)}`;
  }
  return `Me estacioné en ${nombreZona}`;
}

const EstacionamientoContext = createContext<EstacionamientoContextType | null>(
  null
);

export function EstacionamientoProvider({ children }: { children: ReactNode }) {
  const [estadosPorZona, setEstadosPorZona] = useState<
    Record<string, EstadoZonaGuardado>
  >(crearEstadosIniciales);
  const [vehiculosEstacionados, setVehiculosEstacionados] = useState<
    Record<string, VehiculoEstacionado>
  >({});
  const [reportesMalEstacionado, setReportesMalEstacionado] = useState<
    ReporteMalEstacionado[]
  >([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  async function cargarDesdeStorage() {
    try {
      const [rawEstados, rawActivos, rawReportes] = await Promise.all([
        AsyncStorage.getItem(CLAVE_ESTADOS_ZONA),
        AsyncStorage.getItem(CLAVE_ACTIVOS),
        AsyncStorage.getItem(CLAVE_REPORTES_FOTOS),
      ]);

      if (rawEstados) {
        const parsed: unknown = descifrarObjetoDeStorage(rawEstados);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const restaurados = crearEstadosIniciales();
          for (const base of zonasIniciales) {
            const guardado = (parsed as Record<string, unknown>)[base.id];
            if (guardado && typeof guardado === "object") {
              const g = guardado as Partial<EstadoZonaGuardado>;
              restaurados[base.id] = {
                personasEnElLugar:
                  typeof g.personasEnElLugar === "number"
                    ? Math.max(0, g.personasEnElLugar)
                    : 0,
                estaLleno: Boolean(g.estaLleno),
                capacidadRealDetectada:
                  typeof g.capacidadRealDetectada === "number" &&
                  g.capacidadRealDetectada > 0
                    ? g.capacidadRealDetectada
                    : null,
                maximoRegistrado:
                  typeof g.maximoRegistrado === "number"
                    ? Math.max(0, g.maximoRegistrado)
                    : 0,
                ultimoReporteLleno: g.ultimoReporteLleno ?? null,
              };
            }
          }
          setEstadosPorZona(restaurados);
        }
      }

      if (rawActivos) {
        const parsed: unknown = descifrarObjetoDeStorage(rawActivos);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setVehiculosEstacionados(
            parsed as Record<string, VehiculoEstacionado>
          );
        }
      }

      if (rawReportes) {
        const parsed: unknown = descifrarObjetoDeStorage(rawReportes);
        if (Array.isArray(parsed)) {
          setReportesMalEstacionado(parsed);
        }
      }
      setErrorCarga(null);
    } catch {
      setErrorCarga("No se pudieron cargar los reportes previos.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDesdeStorage();

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const alCambiarStorage = (e: StorageEvent) => {
        if (
          e.key === CLAVE_ESTADOS_ZONA ||
          e.key === CLAVE_ACTIVOS ||
          e.key === CLAVE_REPORTES_FOTOS
        ) {
          cargarDesdeStorage();
        }
      };
      window.addEventListener("storage", alCambiarStorage);
      return () => window.removeEventListener("storage", alCambiarStorage);
    }
  }, []);

  async function persistir(
    nuevosEstados: Record<string, EstadoZonaGuardado>,
    nuevosActivos: Record<string, VehiculoEstacionado>,
    nuevosReportes: ReporteMalEstacionado[]
  ) {
    await Promise.all([
      AsyncStorage.setItem(
        CLAVE_ESTADOS_ZONA,
        cifrarObjetoParaStorage(nuevosEstados)
      ),
      AsyncStorage.setItem(
        CLAVE_ACTIVOS,
        cifrarObjetoParaStorage(nuevosActivos)
      ),
      AsyncStorage.setItem(
        CLAVE_REPORTES_FOTOS,
        cifrarObjetoParaStorage(nuevosReportes)
      ),
    ]);
    setEstadosPorZona(nuevosEstados);
    setVehiculosEstacionados(nuevosActivos);
    setReportesMalEstacionado(nuevosReportes);
  }

  const zonas = useMemo<Zona[]>(() => {
    return zonasIniciales.map((base) => {
      const estado = estadosPorZona[base.id] ?? estadoInicialZona();
      return calcularZona(base, estado);
    });
  }, [estadosPorZona]);

  const alertasSaturacion = useMemo<AlertaSaturacion[]>(() => {
    const alertas: AlertaSaturacion[] = [];

    for (const zona of zonas) {
      if (zona.nivelAlerta === "disponible") continue;

      const alternativa = zonas.find((z) => z.id !== zona.id && !z.estaLleno);

      alertas.push({
        zonaId: zona.id,
        zonaNombre: zona.nombre,
        personasEnElLugar: zona.personasEnElLugar,
        capacidadRealDetectada: zona.capacidadRealDetectada,
        nivel: zona.nivelAlerta,
        mensaje:
          zona.nivelAlerta === "lleno"
            ? `Estacionamiento del ${zona.nombre} marcado como "LLENO" · Personas en el lugar: ${zona.personasEnElLugar}`
            : `Alta afluencia en ${zona.nombre} · Personas en el lugar: ${zona.personasEnElLugar}`,
        detalleReporte: zona.ultimoReporteLleno
          ? `Aviso enviado por un ${zona.ultimoReporteLleno.rol.toLowerCase()} a las ${zona.ultimoReporteLleno.hora}. Capacidad real registrada: ${zona.capacidadRealDetectada ?? zona.personasEnElLugar} vehículo(s).`
          : undefined,
        alternativa: alternativa
          ? `Alternativa disponible: Estacionamiento del ${alternativa.nombre} (Personas en el lugar: ${alternativa.personasEnElLugar}).`
          : undefined,
      });
    }

    return alertas;
  }, [zonas]);

  function obtenerCajonDeUsuario(
    matricula: string | null
  ): VehiculoEstacionado | null {
    if (!matricula) return null;
    const token = hashAnonimoMatricula(matricula);
    return vehiculosEstacionados[token] ?? null;
  }

  function clonarEstados(
    origen: Record<string, EstadoZonaGuardado>
  ): Record<string, EstadoZonaGuardado> {
    const copia: Record<string, EstadoZonaGuardado> = {};
    for (const base of zonasIniciales) {
      const actual = origen[base.id] ?? estadoInicialZona();
      copia[base.id] = {
        ...actual,
        ultimoReporteLleno: actual.ultimoReporteLleno
          ? { ...actual.ultimoReporteLleno }
          : null,
      };
    }
    return copia;
  }

  // Registro de llegada anónimo: solo suma al conteo de la zona sin exponer qué carro ni quién se estacionó ahí
  async function reportarLlegadaEnZona(
    zonaId: string,
    usuario: DatosUsuarioReporte
  ): Promise<ResultadoAccion> {
    if (cargando) {
      return {
        ok: false,
        error: "La plataforma todavía está cargando los datos.",
      };
    }

    const mat = usuario.matricula.trim().toUpperCase();
    if (!mat) {
      return { ok: false, error: "Inicia sesión para reportar tu llegada." };
    }
    const token = hashAnonimoMatricula(mat);

    const zona = zonas.find((z) => z.id === zonaId);
    if (!zona) {
      return { ok: false, error: "Área de estacionamiento no encontrada." };
    }

    if (zona.estaLleno) {
      return {
        ok: false,
        error: `El estacionamiento del ${zona.nombre} fue reportado como "LLENO" por la comunidad. Si encontraste un lugar libre, primero presiona "Ya hay espacio disponible" o elige otra zona.`,
      };
    }

    const estadosCopia = clonarEstados(estadosPorZona);
    const activosCopia = { ...vehiculosEstacionados };
    const previo = activosCopia[token];

    if (previo && previo.zonaId === zonaId) {
      return {
        ok: false,
        error: `Ya registraste tu llegada en el ${zona.nombre}.`,
      };
    }

    if (previo && estadosCopia[previo.zonaId]) {
      const estPrevio = estadosCopia[previo.zonaId];
      estPrevio.personasEnElLugar = Math.max(
        0,
        estPrevio.personasEnElLugar - 1
      );
      estPrevio.estaLleno = false;
    }

    const estadoDestino = estadosCopia[zonaId];
    const nuevoConteo = estadoDestino.personasEnElLugar + 1;
    estadoDestino.personasEnElLugar = nuevoConteo;
    estadoDestino.maximoRegistrado = Math.max(
      estadoDestino.maximoRegistrado,
      nuevoConteo
    );

    const hora = horaActual();
    const frase = formatearFraseLlegada(zona.nombre);

    activosCopia[token] = {
      tokenAnonimo: token,
      zonaId,
      zonaNombre: zona.nombre,
      fraseReporte: frase,
      horaIngreso: hora,
    };

    await persistir(estadosCopia, activosCopia, reportesMalEstacionado);

    return {
      ok: true,
      zonaId,
      zonaNombre: zona.nombre,
      mensaje: `Llegada registrada: "${frase}" · Personas en el lugar: ${nuevoConteo} (Tu vehículo no se muestra públicamente por seguridad).`,
    };
  }

  async function reportarCupoLleno(
    zonaId: string,
    usuario: DatosUsuarioReporte
  ): Promise<ResultadoAccion> {
    if (cargando) {
      return {
        ok: false,
        error: "La plataforma todavía está cargando los datos.",
      };
    }

    const zona = zonas.find((z) => z.id === zonaId);
    if (!zona) {
      return { ok: false, error: "Área de estacionamiento no encontrada." };
    }

    const estadosCopia = clonarEstados(estadosPorZona);
    const estadoZona = estadosCopia[zonaId];
    const hora = horaActual();

    estadoZona.estaLleno = true;

    const capacidadObservada = Math.max(
      estadoZona.personasEnElLugar,
      estadoZona.capacidadRealDetectada ?? 0,
      1
    );
    estadoZona.capacidadRealDetectada =
      estadoZona.personasEnElLugar > 0
        ? estadoZona.personasEnElLugar
        : capacidadObservada;
    estadoZona.maximoRegistrado = Math.max(
      estadoZona.maximoRegistrado,
      estadoZona.personasEnElLugar
    );
    estadoZona.ultimoReporteLleno = {
      reportadoPor: "Comunidad UTCH",
      rol: usuario.rol,
      hora,
      autosAlMomento: estadoZona.personasEnElLugar,
    };

    await persistir(
      estadosCopia,
      vehiculosEstacionados,
      reportesMalEstacionado
    );

    return {
      ok: true,
      zonaId,
      zonaNombre: zona.nombre,
      mensaje: `Aviso enviado: El estacionamiento del ${zona.nombre.toLowerCase()} ha sido marcado como "LLENO" (Capacidad real registrada: ${estadoZona.capacidadRealDetectada} vehículo(s)).`,
    };
  }

  async function reportarEspacioDisponible(
    zonaId: string,
    _usuario: DatosUsuarioReporte
  ): Promise<ResultadoAccion> {
    const zona = zonas.find((z) => z.id === zonaId);
    if (!zona) {
      return { ok: false, error: "Área de estacionamiento no encontrada." };
    }

    const estadosCopia = clonarEstados(estadosPorZona);
    const estadoZona = estadosCopia[zonaId];
    estadoZona.estaLleno = false;

    await persistir(
      estadosCopia,
      vehiculosEstacionados,
      reportesMalEstacionado
    );

    return {
      ok: true,
      zonaId,
      zonaNombre: zona.nombre,
      mensaje: `El estacionamiento del ${zona.nombre.toLowerCase()} volvió a marcarse con espacios disponibles.`,
    };
  }

  async function registrarSalidaVehiculo(
    matricula: string
  ): Promise<ResultadoAccion> {
    if (cargando) {
      return {
        ok: false,
        error: "La plataforma todavía está cargando los datos.",
      };
    }

    const token = hashAnonimoMatricula(matricula);
    const registro = vehiculosEstacionados[token];
    if (!registro) {
      return {
        ok: false,
        error: "No tienes una llegada activa registrada en este momento.",
      };
    }

    const estadosCopia = clonarEstados(estadosPorZona);
    const estadoZona = estadosCopia[registro.zonaId];
    if (estadoZona) {
      estadoZona.personasEnElLugar = Math.max(
        0,
        estadoZona.personasEnElLugar - 1
      );
      estadoZona.estaLleno = false;
    }

    const nuevosActivos = { ...vehiculosEstacionados };
    delete nuevosActivos[token];

    const nuevoConteo = estadoZona ? estadoZona.personasEnElLugar : 0;

    await persistir(estadosCopia, nuevosActivos, reportesMalEstacionado);

    return {
      ok: true,
      zonaId: registro.zonaId,
      zonaNombre: registro.zonaNombre,
      mensaje: `Salida registrada del ${registro.zonaNombre}. Personas en el lugar: ${nuevoConteo}.`,
    };
  }

  // Reporte público con foto cuando alguien se estacionó mal
  async function publicarReporteMalEstacionado(datos: {
    zonaId: string;
    motivo: string;
    fotoUri: string;
    rolReportante: string;
  }): Promise<ResultadoAccion> {
    const zona = zonas.find((z) => z.id === datos.zonaId);
    if (!zona) {
      return { ok: false, error: "Selecciona el estacionamiento o edificio." };
    }

    const motivoLimpio = datos.motivo.trim();
    if (motivoLimpio.length < 4) {
      return {
        ok: false,
        error:
          "Describe brevemente cómo se estacionó mal (ej. Ocupando dos cajones o bloqueando el paso).",
      };
    }

    if (!datos.fotoUri) {
      return {
        ok: false,
        error:
          "Debes tomar o adjuntar una foto del vehículo mal estacionado para publicar el reporte.",
      };
    }

    const nuevoReporte: ReporteMalEstacionado = {
      id: `${Date.now()}-${datos.zonaId}`,
      zonaId: zona.id,
      zonaNombre: zona.nombre,
      motivo: motivoLimpio,
      fotoUri: datos.fotoUri,
      rolReportante: datos.rolReportante,
      hora: horaActual(),
    };

    const actualizados = [nuevoReporte, ...reportesMalEstacionado].slice(0, 25);
    await persistir(estadosPorZona, vehiculosEstacionados, actualizados);

    return {
      ok: true,
      zonaId: zona.id,
      zonaNombre: zona.nombre,
      mensaje: `Reporte con foto publicado en ${zona.nombre} para toda la comunidad.`,
    };
  }

  async function sumarAutoComunidad(zonaId: string): Promise<ResultadoAccion> {
    const zona = zonas.find((z) => z.id === zonaId);
    if (!zona) {
      return { ok: false, error: "Área de estacionamiento no encontrada." };
    }

    if (zona.estaLleno) {
      return {
        ok: false,
        error: `El estacionamiento del ${zona.nombre.toLowerCase()} ya está marcado como "LLENO".`,
      };
    }

    const estadosCopia = clonarEstados(estadosPorZona);
    const estadoZona = estadosCopia[zonaId];
    const nuevoConteo = estadoZona.personasEnElLugar + 1;
    estadoZona.personasEnElLugar = nuevoConteo;
    estadoZona.maximoRegistrado = Math.max(
      estadoZona.maximoRegistrado,
      nuevoConteo
    );

    await persistir(
      estadosCopia,
      vehiculosEstacionados,
      reportesMalEstacionado
    );

    return {
      ok: true,
      zonaId,
      zonaNombre: zona.nombre,
      mensaje: `Llegada anónima sumada en ${zona.nombre} · Personas en el lugar: ${nuevoConteo}`,
    };
  }

  async function reiniciarEstacionamientos() {
    const iniciales = crearEstadosIniciales();
    await persistir(iniciales, {}, []);
  }

  return (
    <EstacionamientoContext.Provider
      value={{
        zonas,
        alertasSaturacion,
        vehiculosEstacionados,
        reportesMalEstacionado,
        cargando,
        errorCarga,
        obtenerCajonDeUsuario,
        reportarLlegadaEnZona,
        reportarCupoLleno,
        reportarEspacioDisponible,
        registrarSalidaVehiculo,
        publicarReporteMalEstacionado,
        sumarAutoComunidad,
        reiniciarEstacionamientos,
      }}
    >
      {children}
    </EstacionamientoContext.Provider>
  );
}

export function useEstacionamiento() {
  const ctx = useContext(EstacionamientoContext);
  if (!ctx) {
    throw new Error(
      "useEstacionamiento debe usarse dentro de EstacionamientoProvider"
    );
  }
  return ctx;
}
