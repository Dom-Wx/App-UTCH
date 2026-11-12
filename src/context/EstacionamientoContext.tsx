import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  calcularZona,
  Fila,
  Zona,
  zonasIniciales,
} from "../data/estacionamientos";

export type VehiculoEstacionado = {
  matricula: string;
  zonaId: string;
  zonaNombre: string;
  cajonNombre: string;
  eraAccesible: boolean;
  horaIngreso: string;
};

export type MovimientoEstacionamiento = {
  id: string;
  tipo: "ENTRADA" | "SALIDA";
  matricula: string;
  zonaId: string;
  zonaNombre: string;
  cajonNombre: string;
  hora: string;
};

export type AlertaSaturacion = {
  zonaId: string;
  zonaNombre: string;
  porcentaje: number;
  libres: number;
  nivel: "casi_lleno" | "lleno";
  mensaje: string;
  alternativa?: string;
};

type ResultadoAccion =
  | {
      ok: true;
      zonaId: string;
      zonaNombre: string;
      cajonNombre: string;
      mensaje: string;
    }
  | { ok: false; error: string };

type EstacionamientoContextType = {
  zonas: Zona[];
  alertasSaturacion: AlertaSaturacion[];
  vehiculosEstacionados: Record<string, VehiculoEstacionado>;
  historial: MovimientoEstacionamiento[];
  cargando: boolean;
  errorCarga: string | null;
  obtenerCajonDeUsuario: (matricula: string | null) => VehiculoEstacionado | null;
  registrarIngresoEnZona: (
    zonaId: string,
    matricula: string,
    accesible: boolean
  ) => Promise<ResultadoAccion>;
  ocuparCajonEspecifico: (
    zonaId: string,
    cajonNombre: string,
    matricula: string
  ) => Promise<ResultadoAccion>;
  registrarSalidaVehiculo: (matricula: string) => Promise<ResultadoAccion>;
  reiniciarEstacionamientos: () => Promise<void>;
};

const CLAVE_FILAS = "@utch_park_filas_v1";
const CLAVE_ACTIVOS = "@utch_park_activos_v1";
const CLAVE_HISTORIAL = "@utch_park_historial_v1";

function crearFilasIniciales(): Record<string, Fila[]> {
  const mapa: Record<string, Fila[]> = {};
  for (const zona of zonasIniciales) {
    mapa[zona.id] = zona.filasIniciales.map((f) => ({
      letra: f.letra,
      cajones: [...f.cajones],
    }));
  }
  return mapa;
}

function horaActual(): string {
  return new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EstacionamientoContext = createContext<EstacionamientoContextType | null>(
  null
);

export function EstacionamientoProvider({ children }: { children: ReactNode }) {
  const [filasPorZona, setFilasPorZona] = useState<Record<string, Fila[]>>(
    crearFilasIniciales
  );
  const [vehiculosEstacionados, setVehiculosEstacionados] = useState<
    Record<string, VehiculoEstacionado>
  >({});
  const [historial, setHistorial] = useState<MovimientoEstacionamiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        const [rawFilas, rawActivos, rawHistorial] = await Promise.all([
          AsyncStorage.getItem(CLAVE_FILAS),
          AsyncStorage.getItem(CLAVE_ACTIVOS),
          AsyncStorage.getItem(CLAVE_HISTORIAL),
        ]);

        if (!activo) return;
        if (rawFilas) {
          const parsed: unknown = JSON.parse(rawFilas);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("El mapa guardado no es válido.");
          }
          const filasRestauradas = crearFilasIniciales();
          for (const base of zonasIniciales) {
            const filas = (parsed as Record<string, unknown>)[base.id];
            if (filas === undefined) continue;
            if (
              !Array.isArray(filas) ||
              filas.some(
                (fila) =>
                  !fila ||
                  typeof fila !== "object" ||
                  typeof fila.letra !== "string" ||
                  !Array.isArray(fila.cajones) ||
                  fila.cajones.some(
                    (estado: unknown) =>
                      estado !== 0 && estado !== 1 && estado !== 2
                  )
              )
            ) {
              throw new Error("El mapa guardado tiene cajones inválidos.");
            }
            filasRestauradas[base.id] = filas;
          }
          setFilasPorZona(filasRestauradas);
        }
        if (rawActivos) {
          const parsed: unknown = JSON.parse(rawActivos);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Los vehículos estacionados no son válidos.");
          }
          setVehiculosEstacionados(
            parsed as Record<string, VehiculoEstacionado>
          );
        }
        if (rawHistorial) {
          const parsed: unknown = JSON.parse(rawHistorial);
          if (!Array.isArray(parsed)) {
            throw new Error("El historial de movimientos no es válido.");
          }
          setHistorial(parsed);
        }
      } catch {
        if (activo) {
          setErrorCarga(
            "No se pudo restaurar la disponibilidad guardada. No se modificarán los cajones."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargar();
    return () => {
      activo = false;
    };
  }, []);

  async function persistir(
    nuevasFilas: Record<string, Fila[]>,
    nuevosActivos: Record<string, VehiculoEstacionado>,
    nuevoHistorial: MovimientoEstacionamiento[]
  ) {
    await Promise.all([
      AsyncStorage.setItem(CLAVE_FILAS, JSON.stringify(nuevasFilas)),
      AsyncStorage.setItem(CLAVE_ACTIVOS, JSON.stringify(nuevosActivos)),
      AsyncStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(nuevoHistorial)),
    ]);
    setFilasPorZona(nuevasFilas);
    setVehiculosEstacionados(nuevosActivos);
    setHistorial(nuevoHistorial);
  }

  const zonas = useMemo<Zona[]>(() => {
    return zonasIniciales.map((base) => {
      const filas = filasPorZona[base.id] ?? base.filasIniciales;
      return calcularZona(base, filas);
    });
  }, [filasPorZona]);

  const alertasSaturacion = useMemo<AlertaSaturacion[]>(() => {
    const alertas: AlertaSaturacion[] = [];

    for (const zona of zonas) {
      if (zona.nivelAlerta === "disponible") continue;

      const alternativa = zonas.find(
        (z) =>
          z.id !== zona.id &&
          z.tipo === zona.tipo &&
          z.nivelAlerta === "disponible" &&
          z.libres > 0
      );

      alertas.push({
        zonaId: zona.id,
        zonaNombre: zona.nombre,
        porcentaje: zona.porcentajeOcupacion,
        libres: zona.libres,
        nivel: zona.nivelAlerta,
        mensaje:
          zona.nivelAlerta === "lleno"
            ? `${zona.nombre} está LLENO (100% ocupado).`
            : `${zona.nombre} al ${zona.porcentajeOcupacion}% (${zona.libres} lugares libres).`,
        alternativa: alternativa
          ? `Sugerencia: Usa ${alternativa.nombre} (${alternativa.libres} libres por ${alternativa.accesoCercano}).`
          : undefined,
      });
    }

    return alertas;
  }, [zonas]);

  function obtenerCajonDeUsuario(
    matricula: string | null
  ): VehiculoEstacionado | null {
    if (!matricula) return null;
    return vehiculosEstacionados[matricula.trim().toUpperCase()] ?? null;
  }

  function clonarFilas(origen: Record<string, Fila[]>) {
    const copia: Record<string, Fila[]> = {};
    for (const id of Object.keys(origen)) {
      copia[id] = origen[id].map((f) => ({
        letra: f.letra,
        cajones: [...f.cajones],
      }));
    }
    return copia;
  }

  function liberarEnMapa(
    filasCopia: Record<string, Fila[]>,
    registro: VehiculoEstacionado
  ) {
    const filasZona = filasCopia[registro.zonaId];
    if (!filasZona) return;
    const letra = registro.cajonNombre.charAt(0);
    const numero = parseInt(registro.cajonNombre.slice(1), 10) - 1;
    const fila = filasZona.find((f) => f.letra === letra);
    if (fila && numero >= 0 && numero < fila.cajones.length) {
      fila.cajones[numero] = registro.eraAccesible ? 2 : 0;
    }
  }

  async function registrarIngresoEnZona(
    zonaId: string,
    matricula: string,
    accesible: boolean
  ): Promise<ResultadoAccion> {
    if (cargando || errorCarga) {
      return {
        ok: false,
        error: errorCarga ?? "La disponibilidad todavía se está cargando.",
      };
    }

    const mat = matricula.trim().toUpperCase();
    if (!mat) {
      return { ok: false, error: "Matrícula inválida." };
    }

    const previo = vehiculosEstacionados[mat];
    if (previo) {
      return {
        ok: false,
        error: `El vehículo ${mat} ya está estacionado en ${previo.zonaNombre} (cajón ${previo.cajonNombre}). Registra primero su salida.`,
      };
    }

    const zona = zonas.find((z) => z.id === zonaId);
    if (!zona) {
      return { ok: false, error: "Zona no encontrada." };
    }

    const filasCopia = clonarFilas(filasPorZona);
    const filasZona = filasCopia[zonaId];

    // Busca primero cajón accesible si se solicitó, sino cajón normal (0)
    let filaIdx = -1;
    let colIdx = -1;
    let eraAccesible = false;

    const buscarValor = (valorBuscado: number) => {
      for (let r = 0; r < filasZona.length; r++) {
        for (let c = 0; c < filasZona[r].cajones.length; c++) {
          if (filasZona[r].cajones[c] === valorBuscado) {
            filaIdx = r;
            colIdx = c;
            return true;
          }
        }
      }
      return false;
    };

    if (accesible) {
      if (buscarValor(2)) {
        eraAccesible = true;
      } else {
        buscarValor(0);
      }
    } else {
      buscarValor(0);
    }

    if (filaIdx === -1) {
      return {
        ok: false,
        error: `${zona.nombre} no tiene cajones disponibles en este momento.`,
      };
    }

    const cajonNombre = `${filasZona[filaIdx].letra}${colIdx + 1}`;
    filasZona[filaIdx].cajones[colIdx] = 1;

    const hora = horaActual();
    const nuevoRegistro: VehiculoEstacionado = {
      matricula: mat,
      zonaId,
      zonaNombre: zona.nombre,
      cajonNombre,
      eraAccesible,
      horaIngreso: hora,
    };

    const nuevosActivos = {
      ...vehiculosEstacionados,
      [mat]: nuevoRegistro,
    };

    const nuevoMov: MovimientoEstacionamiento = {
      id: `${Date.now()}-${mat}`,
      tipo: "ENTRADA",
      matricula: mat,
      zonaId,
      zonaNombre: zona.nombre,
      cajonNombre,
      hora,
    };

    await persistir(
      filasCopia,
      nuevosActivos,
      [nuevoMov, ...historial].slice(0, 30)
    );

    return {
      ok: true,
      zonaId,
      zonaNombre: zona.nombre,
      cajonNombre,
      mensaje: `Entrada registrada en ${zona.nombre}, cajón ${cajonNombre}.`,
    };
  }

  async function ocuparCajonEspecifico(
    zonaId: string,
    cajonNombre: string,
    matricula: string
  ): Promise<ResultadoAccion> {
    if (cargando || errorCarga) {
      return {
        ok: false,
        error: errorCarga ?? "La disponibilidad todavía se está cargando.",
      };
    }

    const mat = matricula.trim().toUpperCase();
    const zona = zonas.find((z) => z.id === zonaId);
    if (!zona) {
      return { ok: false, error: "Zona no encontrada." };
    }

    const filasCopia = clonarFilas(filasPorZona);
    const filasZona = filasCopia[zonaId];
    const letra = cajonNombre.charAt(0);
    const colIdx = parseInt(cajonNombre.slice(1), 10) - 1;
    const fila = filasZona.find((f) => f.letra === letra);

    if (!fila || colIdx < 0 || colIdx >= fila.cajones.length) {
      return { ok: false, error: "Cajón inválido." };
    }

    const valorActual = fila.cajones[colIdx];
    if (valorActual === 1) {
      return { ok: false, error: "Ese cajón ya está ocupado." };
    }

    // Si ya tenía un cajón asignado antes, lo libera primero
    const previo = vehiculosEstacionados[mat];
    if (previo) {
      liberarEnMapa(filasCopia, previo);
    }

    const eraAccesible = valorActual === 2;
    fila.cajones[colIdx] = 1;

    const hora = horaActual();
    const nuevosActivos: Record<string, VehiculoEstacionado> = {
      ...vehiculosEstacionados,
      [mat]: {
        matricula: mat,
        zonaId,
        zonaNombre: zona.nombre,
        cajonNombre,
        eraAccesible,
        horaIngreso: hora,
      },
    };

    const nuevoMov: MovimientoEstacionamiento = {
      id: `${Date.now()}-${mat}`,
      tipo: "ENTRADA",
      matricula: mat,
      zonaId,
      zonaNombre: zona.nombre,
      cajonNombre,
      hora,
    };

    await persistir(
      filasCopia,
      nuevosActivos,
      [nuevoMov, ...historial].slice(0, 30)
    );

    return {
      ok: true,
      zonaId,
      zonaNombre: zona.nombre,
      cajonNombre,
      mensaje: `Cajón ${cajonNombre} asignado en ${zona.nombre}.`,
    };
  }

  async function registrarSalidaVehiculo(
    matricula: string
  ): Promise<ResultadoAccion> {
    if (cargando || errorCarga) {
      return {
        ok: false,
        error: errorCarga ?? "La disponibilidad todavía se está cargando.",
      };
    }

    const mat = matricula.trim().toUpperCase();
    const registro = vehiculosEstacionados[mat];
    if (!registro) {
      return {
        ok: false,
        error: `No hay ningún vehículo activo registrado con la matrícula ${mat}.`,
      };
    }

    const filasCopia = clonarFilas(filasPorZona);
    liberarEnMapa(filasCopia, registro);

    const nuevosActivos = { ...vehiculosEstacionados };
    delete nuevosActivos[mat];

    const nuevoMov: MovimientoEstacionamiento = {
      id: `${Date.now()}-${mat}`,
      tipo: "SALIDA",
      matricula: mat,
      zonaId: registro.zonaId,
      zonaNombre: registro.zonaNombre,
      cajonNombre: registro.cajonNombre,
      hora: horaActual(),
    };

    await persistir(
      filasCopia,
      nuevosActivos,
      [nuevoMov, ...historial].slice(0, 30)
    );

    return {
      ok: true,
      zonaId: registro.zonaId,
      zonaNombre: registro.zonaNombre,
      cajonNombre: registro.cajonNombre,
      mensaje: `Salida registrada. Cajón ${registro.cajonNombre} liberado en ${registro.zonaNombre}.`,
    };
  }

  async function reiniciarEstacionamientos() {
    const iniciales = crearFilasIniciales();
    await persistir(iniciales, {}, []);
  }

  return (
    <EstacionamientoContext.Provider
      value={{
        zonas,
        alertasSaturacion,
        vehiculosEstacionados,
        historial,
        cargando,
        errorCarga,
        obtenerCajonDeUsuario,
        registrarIngresoEnZona,
        ocuparCajonEspecifico,
        registrarSalidaVehiculo,
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
