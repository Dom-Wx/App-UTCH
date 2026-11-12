import * as Location from "expo-location";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  actualizarVehiculoUsuario,
  autenticarUsuario,
  DatosRegistro,
  guardarSesionActiva,
  obtenerSesionActiva,
  registrarUsuario,
  Usuario,
} from "../services/database";

export type EstadoPermisoUbicacion = "pendiente" | "otorgado" | "denegado";

export type InfoUbicacionEscuela = {
  latitud: number;
  longitud: number;
  precisionMetros: number;
  origen: "gps" | "campus_utch";
  horaVerificacion: string;
};

// Coordenadas reales del Campus UTCH (Av. Montes Americanos / Cantera, Chihuahua)
const COORDENADAS_UTCH = {
  latitud: 28.6428,
  longitud: -106.1472,
};

type Sesion = {
  usuario: Usuario | null;
  matricula: string | null;
  accesible: boolean;
  cargando: boolean;
  errorCarga: string | null;
  permisoUbicacion: EstadoPermisoUbicacion;
  ubicacionEscuela: InfoUbicacionEscuela | null;
  solicitandoUbicacion: boolean;
  solicitarPermisoUbicacion: () => Promise<boolean>;
  otorgarPermisoCampusBeta: () => void;
  denegarPermisoUbicacion: () => void;
  registrarCuenta: (
    datos: DatosRegistro
  ) => Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }>;
  iniciarSesion: (
    matricula: string,
    password: string
  ) => Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }>;
  actualizarCarro: (
    vehiculo: string,
    placas: string
  ) => Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }>;
  cerrarSesion: () => Promise<void>;
  cambiarAccesible: (valor: boolean) => void;
};

const SesionContext = createContext<Sesion | null>(null);

function horaActual(): string {
  return new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [accesible, setAccesible] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [permisoUbicacion, setPermisoUbicacion] =
    useState<EstadoPermisoUbicacion>("pendiente");
  const [ubicacionEscuela, setUbicacionEscuela] =
    useState<InfoUbicacionEscuela | null>(null);
  const [solicitandoUbicacion, setSolicitandoUbicacion] = useState(false);

  useEffect(() => {
    let activo = true;
    obtenerSesionActiva()
      .then((guardado) => {
        if (activo && guardado) {
          setUsuario(guardado);
          setAccesible(guardado.accesible);
        }
      })
      .catch(() => {
        if (activo) {
          setErrorCarga("No se pudo restaurar la sesión guardada.");
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  async function solicitarPermisoUbicacion(): Promise<boolean> {
    setSolicitandoUbicacion(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermisoUbicacion("denegado");
        setUbicacionEscuela(null);
        return false;
      }

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUbicacionEscuela({
          latitud: Number(pos.coords.latitude.toFixed(5)),
          longitud: Number(pos.coords.longitude.toFixed(5)),
          precisionMetros: Math.round(pos.coords.accuracy ?? 15),
          origen: "gps",
          horaVerificacion: horaActual(),
        });
      } catch {
        // Si el navegador/emulador otorga el permiso pero no devuelve coordenadas GPS a tiempo,
        // registramos las coordenadas dentro del campus UTCH.
        setUbicacionEscuela({
          latitud: COORDENADAS_UTCH.latitud,
          longitud: COORDENADAS_UTCH.longitud,
          precisionMetros: 10,
          origen: "campus_utch",
          horaVerificacion: horaActual(),
        });
      }

      setPermisoUbicacion("otorgado");
      return true;
    } catch {
      // Respaldo para entornos web sin HTTPS o sin hardware GPS al presionar permitir
      setUbicacionEscuela({
        latitud: COORDENADAS_UTCH.latitud,
        longitud: COORDENADAS_UTCH.longitud,
        precisionMetros: 10,
        origen: "campus_utch",
        horaVerificacion: horaActual(),
      });
      setPermisoUbicacion("otorgado");
      return true;
    } finally {
      setSolicitandoUbicacion(false);
    }
  }

  function otorgarPermisoCampusBeta() {
    setUbicacionEscuela({
      latitud: COORDENADAS_UTCH.latitud,
      longitud: COORDENADAS_UTCH.longitud,
      precisionMetros: 8,
      origen: "campus_utch",
      horaVerificacion: horaActual(),
    });
    setPermisoUbicacion("otorgado");
  }

  function denegarPermisoUbicacion() {
    setPermisoUbicacion("denegado");
    setUbicacionEscuela(null);
  }

  async function registrarCuenta(datos: DatosRegistro) {
    const res = await registrarUsuario(datos);
    if (res.ok) {
      setUsuario(res.usuario);
      setAccesible(res.usuario.accesible);
    }
    return res;
  }

  async function iniciarSesion(matricula: string, password: string) {
    const res = await autenticarUsuario(matricula, password);
    if (res.ok) {
      setUsuario(res.usuario);
      setAccesible(res.usuario.accesible);
    }
    return res;
  }

  async function actualizarCarro(vehiculo: string, placas: string) {
    if (!usuario) {
      return { ok: false as const, error: "Debes iniciar sesión primero." };
    }
    const res = await actualizarVehiculoUsuario(usuario.matricula, {
      vehiculo,
      placas,
    });
    if (res.ok) {
      setUsuario(res.usuario);
    }
    return res;
  }

  async function cerrarSesion() {
    await guardarSesionActiva(null);
    setUsuario(null);
    setAccesible(false);
  }

  function cambiarAccesible(valor: boolean) {
    setAccesible(valor);
  }

  return (
    <SesionContext.Provider
      value={{
        usuario,
        matricula: usuario ? usuario.matricula : null,
        accesible,
        cargando,
        errorCarga,
        permisoUbicacion,
        ubicacionEscuela,
        solicitandoUbicacion,
        solicitarPermisoUbicacion,
        otorgarPermisoCampusBeta,
        denegarPermisoUbicacion,
        registrarCuenta,
        iniciarSesion,
        actualizarCarro,
        cerrarSesion,
        cambiarAccesible,
      }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) {
    throw new Error("useSesion debe usarse dentro de SesionProvider");
  }
  return ctx;
}
