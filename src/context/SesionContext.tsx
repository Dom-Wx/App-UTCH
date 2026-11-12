import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  autenticarUsuario,
  DatosRegistro,
  guardarSesionActiva,
  obtenerSesionActiva,
  registrarUsuario,
  Usuario,
} from "../services/database";

type Sesion = {
  usuario: Usuario | null;
  matricula: string | null;
  accesible: boolean;
  cargando: boolean;
  errorCarga: string | null;
  registrarCuenta: (
    datos: DatosRegistro
  ) => Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }>;
  iniciarSesion: (
    matricula: string,
    password: string
  ) => Promise<{ ok: true; usuario: Usuario } | { ok: false; error: string }>;
  cerrarSesion: () => Promise<void>;
  cambiarAccesible: (valor: boolean) => void;
};

const SesionContext = createContext<Sesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [accesible, setAccesible] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

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
        registrarCuenta,
        iniciarSesion,
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
