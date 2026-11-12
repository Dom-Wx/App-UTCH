import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Boton from "../components/Boton";
import SeccionReportesMalEstacionado from "../components/SeccionReportesMalEstacionado";
import TarjetaZona from "../components/TarjetaZona";
import { colores } from "../constants/colores";
import { useEstacionamiento } from "../context/EstacionamientoContext";
import { useSesion } from "../context/SesionContext";

export default function Inicio() {
  const router = useRouter();
  const {
    usuario,
    matricula,
    cargando,
    errorCarga: errorCargaSesion,
    cerrarSesion,
  } = useSesion();
  const {
    zonas,
    alertasSaturacion,
    cargando: cargandoEstacionamiento,
    errorCarga: errorCargaEstacionamiento,
    obtenerCajonDeUsuario,
    reportarLlegadaEnZona,
    reportarCupoLleno,
    reportarEspacioDisponible,
    registrarSalidaVehiculo,
    sumarAutoComunidad,
    reiniciarEstacionamientos,
  } = useEstacionamiento();

  const [zonaSeleccionadaId, setZonaSeleccionadaId] = useState("ED");
  const [mensajeExito, setMensajeExito] = useState("");
  const [avisoError, setAvisoError] = useState("");

  const miEstacionado = obtenerCajonDeUsuario(matricula);
  const zonaSeleccionada =
    zonas.find((z) => z.id === zonaSeleccionadaId) ?? zonas[0];
  const zonaDondeEstoy = miEstacionado
    ? zonas.find((z) => z.id === miEstacionado.zonaId)
    : null;

  function limpiarMensajes() {
    setMensajeExito("");
    setAvisoError("");
  }

  async function manejarReportarLlegada(zonaId: string) {
    limpiarMensajes();
    if (!usuario) return;

    try {
      const res = await reportarLlegadaEnZona(zonaId, {
        matricula: usuario.matricula,
        nombre: usuario.nombre,
        rol: usuario.rol,
      });
      if (!res.ok) {
        setAvisoError(res.error);
        return;
      }
      setMensajeExito(res.mensaje);
    } catch {
      setAvisoError("No fue posible guardar tu reporte de llegada.");
    }
  }

  async function manejarReportarLleno(zonaId: string) {
    limpiarMensajes();
    if (!usuario) return;

    try {
      const res = await reportarCupoLleno(zonaId, {
        matricula: usuario.matricula,
        nombre: usuario.nombre,
        rol: usuario.rol,
      });
      if (!res.ok) {
        setAvisoError(res.error);
        return;
      }
      setMensajeExito(res.mensaje);
    } catch {
      setAvisoError("No fue posible enviar el aviso de cupo lleno.");
    }
  }

  async function manejarDesmarcarLleno(zonaId: string) {
    limpiarMensajes();
    if (!usuario) return;

    try {
      const res = await reportarEspacioDisponible(zonaId, {
        matricula: usuario.matricula,
        nombre: usuario.nombre,
        rol: usuario.rol,
      });
      if (!res.ok) {
        setAvisoError(res.error);
        return;
      }
      setMensajeExito(res.mensaje);
    } catch {
      setAvisoError("No fue posible actualizar el estado del estacionamiento.");
    }
  }

  async function manejarSalida() {
    if (!matricula) return;
    limpiarMensajes();
    try {
      const res = await registrarSalidaVehiculo(matricula);
      if (!res.ok) {
        setAvisoError(res.error);
        return;
      }
      setMensajeExito(res.mensaje);
    } catch {
      setAvisoError("No fue posible registrar tu salida.");
    }
  }

  async function manejarSimularLlegada(zonaId: string) {
    limpiarMensajes();
    if (!usuario) return;
    const res = await sumarAutoComunidad(zonaId);
    if (!res.ok) {
      setAvisoError(res.error);
      return;
    }
    setMensajeExito(res.mensaje);
  }

  async function salir() {
    limpiarMensajes();
    try {
      await cerrarSesion();
    } catch {
      setAvisoError("No fue posible cerrar la sesión.");
    }
  }

  if (cargando || cargandoEstacionamiento) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={colores.verdeUtch} />
        <Text style={styles.textoCargando}>
          Cargando plataforma colaborativa UTCH...
        </Text>
      </View>
    );
  }

  // ==================== BLOQUEO SI NO HA INICIADO SESIÓN ====================
  if (usuario === null) {
    return (
      <ScrollView style={styles.pantalla}>
        <View style={styles.marca}>
          <View style={styles.logo}>
            <Text style={styles.logoTexto}>P</Text>
          </View>
          <View style={styles.marcaInfo}>
            <Text style={styles.nombreApp}>UTCH ParkMate</Text>
            <Text style={styles.lema}>
              Estacionamiento Colaborativo · Fase Beta
            </Text>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.etiquetaRolBox}>
            <Text style={styles.etiquetaRolTexto}>
              INICIO DE SESIÓN OBLIGATORIO PARA USAR LA APP
            </Text>
          </View>
          <Text style={styles.panelTitulo}>
            Inicia sesión o crea tu cuenta para desbloquear las funciones
          </Text>
          <Text style={styles.panelTexto}>
            Para consultar los estacionamientos en tiempo real, reportar tu
            llegada o avisar cuando un estacionamiento esté lleno, primero debes
            iniciar sesión o registrarte como alumno o docente.
          </Text>

          <Boton
            texto="Iniciar sesión"
            tipo="secundario"
            onPress={() => router.push("/login")}
          />
          <Boton
            texto="Crear cuenta (Alumno o Docente)"
            onPress={() => router.push("/registro")}
          />
        </View>

        <View style={styles.seccionBloqueada}>
          <View style={styles.cajaCandado}>
            <View style={styles.badgeBloqueado}>
              <Text style={styles.badgeBloqueadoTexto}>
                FUNCIONES BLOQUEADAS (SIN SESIÓN ACTIVA)
              </Text>
            </View>
            <Text style={styles.candadoTitulo}>
              ¿Qué se desbloquea al iniciar sesión o crear tu cuenta?
            </Text>

            <View style={styles.itemFuncionBloqueada}>
              <Text style={styles.itemFuncionTitulo}>
                1. Registro como Alumno o Docente
              </Text>
              <Text style={styles.itemFuncionDesc}>
                Tu cuenta te identifica dentro de la comunidad escolar para
                colaborar en tiempo real.
              </Text>
            </View>

            <View style={styles.itemFuncionBloqueada}>
              <Text style={styles.itemFuncionTitulo}>
                2. Registro de llegada por edificio
              </Text>
              <Text style={styles.itemFuncionDesc}>
                Al llegar y estacionarte en cualquier área de la escuela, lo
                reportas en la app (por ejemplo: &quot;Me estacioné en el
                edificio D&quot;) y el sistema suma el conteo (&quot;Personas en
                el lugar: 1&quot;).
              </Text>
            </View>

            <View style={styles.itemFuncionBloqueada}>
              <Text style={styles.itemFuncionTitulo}>
                3. Aviso de cupo lleno y capacidad real
              </Text>
              <Text style={styles.itemFuncionDesc}>
                Si llegas al estacionamiento y ya no encuentras espacios
                disponibles, podrás reportarlo para marcar el estacionamiento
                (ej. Edificio D) como &quot;lleno&quot; y conocer su capacidad
                real de vehículos.
              </Text>
            </View>

            <View style={styles.notaBetaResumen}>
              <Text style={styles.notaBetaResumenTitulo}>Nota importante:</Text>
              <Text style={styles.notaBetaResumenTexto}>
                Esta aplicación se encuentra en fase beta y en constante
                desarrollo, por lo que requiere tanto tu acceso de ubicación
                dentro de la escuela como haber iniciado sesión para utilizar
                sus funciones.
              </Text>
            </View>

            <Boton
              texto="Crear cuenta ahora (Alumno / Docente)"
              onPress={() => router.push("/registro")}
            />
            <Boton
              texto="Ya tengo una cuenta · Iniciar sesión"
              tipo="secundario"
              onPress={() => router.push("/login")}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  // ==================== FUNCIONES DESBLOQUEADAS (USUARIO CON SESIÓN) ====================
  const etiquetaZonaSeleccionada = zonaSeleccionada.nombre
    .toLowerCase()
    .startsWith("edificio ")
    ? `el edificio ${zonaSeleccionada.nombre.slice("Edificio ".length)}`
    : zonaSeleccionada.nombre;

  return (
    <ScrollView style={styles.pantalla}>
      {/* Encabezado de marca */}
      <View style={styles.marca}>
        <View style={styles.logo}>
          <Text style={styles.logoTexto}>P</Text>
        </View>
        <View style={styles.marcaInfo}>
          <Text style={styles.nombreApp}>UTCH ParkMate</Text>
          <Text style={styles.lema}>
            Estacionamiento Colaborativo · Comunidad UTCH
          </Text>
        </View>
        <View style={styles.marcaBotones}>
          <TouchableOpacity
            onPress={() => router.push("/ajustes")}
            style={styles.btnAjustes}
          >
            <Text style={styles.btnAjustesTexto}>Ajustes</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={salir} style={styles.btnSalir}>
            <Text style={styles.btnSalirTexto}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Panel principal de usuario y reporte rápido */}
      <View style={styles.panel}>
        <View style={styles.etiquetaRolBox}>
          <Text style={styles.etiquetaRolTexto}>
            {usuario.rol} · {usuario.matricula}
          </Text>
        </View>

        <Text style={styles.panelTitulo}>
          Hola, {usuario.nombre.split(" ")[0]}
        </Text>
        <Text style={styles.panelTexto}>
          {usuario.carreraNombre} · Carro: {usuario.vehiculo}
          {usuario.placas !== "SIN-PLACAS"
            ? ` (${usuario.placas})`
            : ""}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/ajustes")}
          style={styles.linkAjustesCarro}
        >
          <Text style={styles.linkAjustesCarroTexto}>
            Cambiar mi carro en Ajustes
          </Text>
        </TouchableOpacity>

        {/* Si el usuario ya reportó que está estacionado */}
        {miEstacionado !== null && (
          <View style={styles.miReporteBox}>
            <Text style={styles.miReporteEtiqueta}>
              TU REPORTE DE LLEGADA ACTIVO
            </Text>
            <Text style={styles.miReporteFrase}>
              &quot;{miEstacionado.fraseReporte}&quot;
            </Text>
            <Text style={styles.miReporteMeta}>
              Hora de registro: {miEstacionado.horaIngreso} · Personas en el
              lugar: {zonaDondeEstoy?.personasEnElLugar ?? 1}
            </Text>
            <Boton
              texto="Registrar mi salida (Dejé libre mi lugar)"
              tipo="alerta"
              onPress={manejarSalida}
            />
          </View>
        )}

        {/* Selector rápido de edificio para reportar llegada o cupo lleno */}
        <View style={styles.panelReporteRapido}>
          <Text style={styles.reporteRapidoTitulo}>
            ¿En qué área de la escuela estás?
          </Text>
          <View style={styles.chipsZonas}>
            {zonas.map((z) => {
              const activa = z.id === zonaSeleccionada.id;
              return (
                <TouchableOpacity
                  key={z.id}
                  onPress={() => {
                    setZonaSeleccionadaId(z.id);
                    limpiarMensajes();
                  }}
                  style={[
                    styles.chipZona,
                    activa && styles.chipZonaActiva,
                    z.estaLleno && !activa && styles.chipZonaLlena,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipZonaTexto,
                      activa && styles.chipZonaTextoActivo,
                    ]}
                  >
                    {z.nombre} ({z.personasEnElLugar})
                    {z.estaLleno ? " · LLENO" : ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.resumenZonaRapida}>
            <Text style={styles.resumenZonaNombre}>
              Estacionamiento {zonaSeleccionada.nombre}
            </Text>
            <Text style={styles.resumenZonaConteo}>
              Personas en el lugar: {zonaSeleccionada.personasEnElLugar}
            </Text>
            <Text style={styles.resumenZonaEstado}>
              Estado:{" "}
              {zonaSeleccionada.estaLleno
                ? 'Marcado como "LLENO" (Sin espacios disponibles)'
                : "Con espacios disponibles"}
              {zonaSeleccionada.capacidadRealDetectada !== null
                ? ` · Capacidad real conocida: ${zonaSeleccionada.capacidadRealDetectada} autos`
                : ""}
            </Text>
          </View>

          {!zonaSeleccionada.estaLleno && (
            <Boton
              texto={`Reportar: "Me estacioné en ${etiquetaZonaSeleccionada}"`}
              onPress={() => manejarReportarLlegada(zonaSeleccionada.id)}
            />
          )}

          {!zonaSeleccionada.estaLleno ? (
            <Boton
              texto={`Aviso de cupo lleno: Marcar ${zonaSeleccionada.nombre} como "lleno"`}
              tipo="alerta"
              onPress={() => manejarReportarLleno(zonaSeleccionada.id)}
            />
          ) : (
            <Boton
              texto={`Reportar que ya hay espacio libre en ${zonaSeleccionada.nombre}`}
              tipo="secundario"
              onPress={() => manejarDesmarcarLleno(zonaSeleccionada.id)}
            />
          )}
        </View>
      </View>

      {/* Mensajes de confirmación o error */}
      {mensajeExito !== "" && (
        <View style={styles.cajaExito}>
          <Text style={styles.textoExito}>{mensajeExito}</Text>
        </View>
      )}
      {avisoError !== "" && <Text style={styles.aviso}>{avisoError}</Text>}
      {(errorCargaSesion || errorCargaEstacionamiento) && (
        <Text style={styles.aviso}>
          {errorCargaSesion ?? errorCargaEstacionamiento}
        </Text>
      )}

      {/* Avisos de cupo lleno en tiempo real */}
      {alertasSaturacion.length > 0 && (
        <View style={styles.seccionAlertas}>
          <Text style={styles.alertasTitulo}>
            Avisos de cupo lleno de la comunidad
          </Text>
          {alertasSaturacion.map((alerta) => {
            const esLleno = alerta.nivel === "lleno";
            return (
              <View
                key={alerta.zonaId}
                style={[
                  styles.alertaCard,
                  esLleno ? styles.alertaCardRoja : styles.alertaCardAmarilla,
                ]}
              >
                <Text
                  style={[
                    styles.alertaTexto,
                    esLleno
                      ? styles.alertaTextoRojo
                      : styles.alertaTextoAmarillo,
                  ]}
                >
                  {alerta.mensaje}
                </Text>
                {alerta.detalleReporte && (
                  <Text style={styles.alertaDetalle}>
                    {alerta.detalleReporte}
                  </Text>
                )}
                {alerta.alternativa && (
                  <Text style={styles.alertaAlternativa}>
                    {alerta.alternativa}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Lista de estacionamientos en tiempo real */}
      <View style={styles.seccion}>
        <View style={styles.encabezadoSeccion}>
          <Text style={styles.subtitulo}>Estacionamientos del Campus</Text>
          <TouchableOpacity
            onPress={() => router.push("/ubicacion")}
            style={styles.linkMapa}
          >
            <Text style={styles.linkMapaTexto}>Abrir mapa interactivo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.descripcionSeccion}>
          El conteo se actualiza colaborativamente cuando alumnos y docentes
          reportan su llegada o avisan que un estacionamiento ya está lleno.
        </Text>

        {zonas.map((zona) => (
          <TarjetaZona
            key={zona.id}
            zona={zona}
            estoyAqui={miEstacionado?.zonaId === zona.id}
            puedeReportar={true}
            onReportarLlegada={() => manejarReportarLlegada(zona.id)}
            onReportarLleno={() => manejarReportarLleno(zona.id)}
            onDesmarcarLleno={() => manejarDesmarcarLleno(zona.id)}
            onVerEnMapa={() =>
              router.push({
                pathname: "/ubicacion",
                params: { zona: zona.id },
              })
            }
          />
        ))}

        <Boton
          texto="Ver mapa interactivo del campus UTCH"
          onPress={() => router.push("/ubicacion")}
        />
      </View>

      {/* Reportes de vehículos mal estacionados con foto y herramientas beta */}
      <View style={styles.seccion}>
        <SeccionReportesMalEstacionado />

        {/* Herramientas de prueba en Fase Beta */}
        <View style={styles.cajaPruebasBeta}>
          <Text style={styles.pruebasTitulo}>
            Herramientas de prueba colaborativa (Fase Beta)
          </Text>
          <Text style={styles.pruebasTexto}>
            Simula la llegada de más miembros de la comunidad a{" "}
            {zonaSeleccionada.nombre} para probar el conteo en vivo y la
            detección de capacidad real.
          </Text>
          <View style={styles.pruebasBotones}>
            <TouchableOpacity
              style={styles.btnSimular}
              onPress={() => manejarSimularLlegada(zonaSeleccionada.id)}
            >
              <Text style={styles.btnSimularTexto}>
                + Sumar llegada de otro auto en {zonaSeleccionada.nombre}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnReiniciar}
              onPress={async () => {
                limpiarMensajes();
                await reiniciarEstacionamientos();
                setMensajeExito(
                  "Todos los conteos colaborativos fueron reiniciados a 0."
                );
              }}
            >
              <Text style={styles.btnReiniciarTexto}>
                Reiniciar todos los conteos a 0
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colores.fondo,
  },
  textoCargando: {
    marginTop: 12,
    fontSize: 16,
    color: colores.texto,
  },
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  marca: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: colores.blanco,
  },
  logo: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: colores.verdeUtch,
    alignItems: "center",
    justifyContent: "center",
  },
  logoTexto: {
    fontSize: 28,
    fontWeight: "bold",
    color: colores.blanco,
  },
  marcaInfo: {
    flex: 1,
  },
  nombreApp: {
    fontSize: 20,
    fontWeight: "bold",
    color: colores.texto,
  },
  lema: {
    fontSize: 12.5,
    color: "#475569",
  },
  marcaBotones: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnAjustes: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colores.verdeUtch,
    backgroundColor: "#F0FDF4",
  },
  btnAjustesTexto: {
    fontSize: 13,
    fontWeight: "bold",
    color: colores.verdeUtch,
  },
  btnSalir: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colores.estructura,
  },
  btnSalirTexto: {
    fontSize: 13,
    fontWeight: "bold",
    color: colores.rojo,
  },
  linkAjustesCarro: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  linkAjustesCarroTexto: {
    color: colores.blanco,
    fontSize: 13,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  panel: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: colores.verdeUtch,
  },
  panelTitulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: colores.blanco,
  },
  panelTexto: {
    fontSize: 15,
    lineHeight: 22,
    color: "#E2E8F0",
    marginTop: 6,
    marginBottom: 12,
  },
  etiquetaRolBox: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  etiquetaRolTexto: {
    color: colores.blanco,
    fontSize: 12,
    fontWeight: "bold",
  },
  seccionBloqueada: {
    padding: 20,
    paddingBottom: 40,
  },
  cajaCandado: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: colores.blanco,
    borderWidth: 1.5,
    borderColor: colores.estructura,
  },
  badgeBloqueado: {
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: colores.rojo,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  badgeBloqueadoTexto: {
    color: colores.rojo,
    fontSize: 11,
    fontWeight: "bold",
  },
  candadoTitulo: {
    fontSize: 19,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 12,
  },
  itemFuncionBloqueada: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 4,
    borderLeftColor: colores.verdeUtch,
    marginBottom: 10,
  },
  itemFuncionTitulo: {
    fontSize: 15,
    fontWeight: "bold",
    color: colores.texto,
  },
  itemFuncionDesc: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "#475569",
    marginTop: 3,
  },
  notaBetaResumen: {
    marginTop: 6,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colores.naranjaFondo,
    borderWidth: 1,
    borderColor: colores.naranjaAlerta,
  },
  notaBetaResumenTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#92400E",
  },
  notaBetaResumenTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: "#78350F",
    marginTop: 2,
  },
  miReporteBox: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    marginBottom: 14,
  },
  miReporteEtiqueta: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#A7F3D0",
    letterSpacing: 0.5,
  },
  miReporteFrase: {
    fontSize: 19,
    fontWeight: "bold",
    color: colores.blanco,
    marginTop: 4,
  },
  miReporteMeta: {
    fontSize: 13,
    color: "#E2E8F0",
    marginTop: 4,
    marginBottom: 4,
  },
  panelReporteRapido: {
    backgroundColor: colores.blanco,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  reporteRapidoTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 10,
  },
  chipsZonas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chipZona: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colores.estructura,
    backgroundColor: "#F8FAFC",
  },
  chipZonaActiva: {
    backgroundColor: colores.verdeUtch,
    borderColor: colores.verdeUtch,
  },
  chipZonaLlena: {
    borderColor: colores.rojo,
    backgroundColor: "#FEF2F2",
  },
  chipZonaTexto: {
    fontSize: 13,
    fontWeight: "bold",
    color: colores.texto,
  },
  chipZonaTextoActivo: {
    color: colores.blanco,
  },
  resumenZonaRapida: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 6,
  },
  resumenZonaNombre: {
    fontSize: 15,
    fontWeight: "bold",
    color: colores.texto,
  },
  resumenZonaConteo: {
    fontSize: 18,
    fontWeight: "bold",
    color: colores.verdeUtch,
    marginTop: 2,
  },
  resumenZonaEstado: {
    fontSize: 13,
    color: "#334155",
    marginTop: 2,
  },
  cajaExito: {
    margin: 20,
    marginBottom: 0,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    borderWidth: 1.5,
    borderColor: colores.verdeUtch,
  },
  textoExito: {
    color: "#065F46",
    fontSize: 14,
    fontWeight: "bold",
  },
  aviso: {
    margin: 20,
    marginBottom: 0,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colores.rojo,
    color: colores.blanco,
    fontSize: 14,
    fontWeight: "bold",
  },
  seccionAlertas: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  alertasTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 8,
  },
  alertaCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  alertaCardAmarilla: {
    backgroundColor: colores.naranjaFondo,
    borderColor: colores.naranjaAlerta,
  },
  alertaCardRoja: {
    backgroundColor: "#FEE2E2",
    borderColor: colores.rojo,
  },
  alertaTexto: {
    fontSize: 15,
    fontWeight: "bold",
  },
  alertaTextoAmarillo: {
    color: "#92400E",
  },
  alertaTextoRojo: {
    color: colores.rojo,
  },
  alertaDetalle: {
    marginTop: 4,
    fontSize: 13,
    color: "#7F1D1D",
    fontWeight: "500",
  },
  alertaAlternativa: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "bold",
    color: colores.texto,
  },
  seccion: {
    padding: 20,
    paddingBottom: 16,
  },
  encabezadoSeccion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 21,
    fontWeight: "bold",
    color: colores.texto,
  },
  linkMapa: {
    paddingVertical: 4,
  },
  linkMapaTexto: {
    fontSize: 14,
    fontWeight: "bold",
    color: colores.verdeUtch,
    textDecorationLine: "underline",
  },
  descripcionSeccion: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 14,
    lineHeight: 20,
  },
  sinHistorialBox: {
    marginTop: 10,
    padding: 16,
    borderRadius: 10,
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.estructura,
  },
  sinHistorialTexto: {
    fontSize: 14,
    color: "#64748B",
  },
  itemHistorial: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.estructura,
  },
  itemHistorialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  itemHistorialUsuario: {
    fontSize: 13,
    fontWeight: "bold",
    color: colores.texto,
  },
  itemHistorialHora: {
    fontSize: 12,
    color: "#64748B",
  },
  itemHistorialDesc: {
    fontSize: 14,
    fontWeight: "bold",
    color: colores.verdeUtch,
  },
  itemHistorialRojo: {
    color: colores.rojo,
  },
  itemHistorialConteo: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
  },
  cajaPruebasBeta: {
    marginTop: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  pruebasTitulo: {
    fontSize: 15,
    fontWeight: "bold",
    color: colores.texto,
  },
  pruebasTexto: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 19,
  },
  pruebasBotones: {
    gap: 8,
  },
  btnSimular: {
    backgroundColor: colores.azulAccesible,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  btnSimularTexto: {
    color: colores.blanco,
    fontSize: 14,
    fontWeight: "bold",
  },
  btnReiniciar: {
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.estructura,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  btnReiniciarTexto: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "bold",
  },
});
