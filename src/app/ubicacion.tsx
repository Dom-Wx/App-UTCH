import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Boton from "../components/Boton";
import Encabezado from "../components/Encabezado";
import MapaCampus from "../components/MapaCampus";
import SeccionReportesMalEstacionado from "../components/SeccionReportesMalEstacionado";
import { colores } from "../constants/colores";
import { useEstacionamiento } from "../context/EstacionamientoContext";
import { useSesion } from "../context/SesionContext";

export default function Ubicacion() {
  const router = useRouter();
  const params = useLocalSearchParams<{ zona?: string }>();
  const {
    usuario,
    matricula,
    cargando: cargandoSesion,
  } = useSesion();
  const {
    zonas,
    cargando,
    errorCarga,
    obtenerCajonDeUsuario,
    reportarLlegadaEnZona,
    reportarCupoLleno,
    reportarEspacioDisponible,
    registrarSalidaVehiculo,
    sumarAutoComunidad,
  } = useEstacionamiento();

  const miRegistro = obtenerCajonDeUsuario(matricula);
  const [zonaElegida, setZonaElegida] = useState(
    params.zona ?? miRegistro?.zonaId ?? "ED"
  );
  const [mensajeExito, setMensajeExito] = useState("");
  const [avisoError, setAvisoError] = useState("");

  useEffect(() => {
    if (params.zona) {
      setZonaElegida(params.zona);
    } else if (miRegistro?.zonaId) {
      setZonaElegida(miRegistro.zonaId);
    }
  }, [params.zona, miRegistro?.zonaId]);

  const zona =
    zonas.find((elemento) => elemento.id === zonaElegida) ?? zonas[0];
  const estoyEnEstaZona = miRegistro?.zonaId === zona.id;

  function limpiarMensajes() {
    setMensajeExito("");
    setAvisoError("");
  }

  async function manejarLlegada() {
    limpiarMensajes();
    if (!usuario) return;

    try {
      const res = await reportarLlegadaEnZona(zona.id, {
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

  async function manejarCupoLleno() {
    limpiarMensajes();
    if (!usuario) return;

    try {
      const res = await reportarCupoLleno(zona.id, {
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
      setAvisoError("No fue posible marcar el estacionamiento como lleno.");
    }
  }

  async function manejarDesmarcarLleno() {
    limpiarMensajes();
    if (!usuario) return;

    try {
      const res = await reportarEspacioDisponible(zona.id, {
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

  async function manejarSimularAuto() {
    limpiarMensajes();
    if (!usuario) return;
    const res = await sumarAutoComunidad(zona.id);
    if (!res.ok) {
      setAvisoError(res.error);
      return;
    }
    setMensajeExito(res.mensaje);
  }

  if (cargando || cargandoSesion) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={colores.verdeUtch} />
        <Text style={styles.textoCargando}>
          Cargando mapa colaborativo del campus...
        </Text>
      </View>
    );
  }

  // Bloqueo si el usuario no ha iniciado sesión ni creado cuenta
  if (usuario === null) {
    return (
      <ScrollView style={styles.pantalla}>
        <Encabezado
          titulo="Mapa colaborativo UTCH"
          onAtras={() => router.replace("/")}
        />
        <View style={styles.contenido}>
          <View style={styles.cajaBloqueoSesion}>
            <Text style={styles.bloqueoTitulo}>
              Funciones bloqueadas (Sin sesión activa)
            </Text>
            <Text style={styles.bloqueoTexto}>
              Para ver el mapa en tiempo real, reportar tu llegada o marcar un
              estacionamiento como lleno, primero debes crear una cuenta o
              iniciar sesión como alumno o docente.
            </Text>
            <Boton
              texto="Iniciar sesión"
              onPress={() => router.replace("/login")}
            />
            <Boton
              texto="Crear cuenta (Alumno o Docente)"
              tipo="secundario"
              onPress={() => router.replace("/registro")}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  const etiquetaEdificio = zona.nombre.toLowerCase().startsWith("edificio ")
    ? `el edificio ${zona.nombre.slice("Edificio ".length)}`
    : zona.nombre;

  return (
    <ScrollView style={styles.pantalla}>
      <Encabezado
        titulo="Mapa colaborativo UTCH"
        onAtras={() => router.back()}
      />

      <View style={styles.contenido}>
        <Text style={styles.descripcion}>
          Toca cualquier área de estacionamiento en el mapa para consultar
          cuántas personas hay en el lugar, reportar tu llegada o avisar que ya
          está lleno.
        </Text>

        {errorCarga !== null && <Text style={styles.aviso}>{errorCarga}</Text>}

        <MapaCampus
          zonaElegida={zonaElegida}
          onElegir={(id) => {
            setZonaElegida(id);
            limpiarMensajes();
          }}
        />

        {/* Tarjeta colaborativa de la zona seleccionada */}
        <View style={[styles.detalle, zona.estaLleno && styles.detalleLleno]}>
          <View style={styles.detalleHeader}>
            <Text style={styles.nombreZona}>
              Estacionamiento {zona.nombre}
            </Text>
            <View
              style={[
                styles.badgeEstado,
                {
                  backgroundColor: zona.estaLleno
                    ? colores.rojo
                    : zona.nivelAlerta === "concurrido"
                      ? colores.naranjaAlerta
                      : colores.verdeUtch,
                },
              ]}
            >
              <Text style={styles.badgeEstadoTexto}>
                {zona.estaLleno ? "LLENO" : "DISPONIBLE"}
              </Text>
            </View>
          </View>

          <Text style={styles.metaZona}>
            {zona.descripcion} · {zona.accesoCercano}
          </Text>

          {/* Conteo principal requerido */}
          <View style={styles.metricasGrid}>
            <View style={styles.metricaCard}>
              <Text style={styles.metricaEtiqueta}>CONTEO EN TIEMPO REAL</Text>
              <Text style={styles.metricaPrincipal}>
                Personas en el lugar: {zona.personasEnElLugar}
              </Text>
              <Text style={styles.metricaSub}>
                Autos reportados por alumnos y docentes
              </Text>
            </View>

            <View style={styles.metricaCard}>
              <Text style={styles.metricaEtiqueta}>
                CAPACIDAD REAL DE VEHÍCULOS
              </Text>
              <Text style={styles.metricaSecundaria}>
                {zona.capacidadRealDetectada !== null
                  ? `${zona.capacidadRealDetectada} vehículos`
                  : "En aprendizaje"}
              </Text>
              <Text style={styles.metricaSub}>
                {zona.capacidadRealDetectada !== null
                  ? 'Registrada al marcarse como "lleno"'
                  : `Máximo actual: ${zona.maximoRegistrado} auto(s)`}
              </Text>
            </View>
          </View>

          {zona.estaLleno && (
            <View style={styles.alertaRoja}>
              <Text style={styles.alertaRojaTexto}>
                Estacionamiento de {etiquetaEdificio} marcado como
                &quot;LLENO&quot; por la comunidad.
              </Text>
              {zona.ultimoReporteLleno && (
                <Text style={styles.alertaRojaSub}>
                  Reportado por {zona.ultimoReporteLleno.reportadoPor} (
                  {zona.ultimoReporteLleno.rol}) a las{" "}
                  {zona.ultimoReporteLleno.hora}.
                </Text>
              )}
            </View>
          )}

          {estoyEnEstaZona && miRegistro && (
            <View style={styles.miLugarBanner}>
              <Text style={styles.miLugarTexto}>
                Tu reporte activo: &quot;{miRegistro.fraseReporte}&quot; (
                {miRegistro.horaIngreso})
              </Text>
            </View>
          )}

          {mensajeExito !== "" && (
            <View style={styles.cajaExito}>
              <Text style={styles.textoExito}>{mensajeExito}</Text>
            </View>
          )}

          {avisoError !== "" && <Text style={styles.aviso}>{avisoError}</Text>}

          {/* Botones de acción colaborativa en la zona */}
          <View style={styles.accionesZona}>
            {estoyEnEstaZona ? (
              <Boton
                texto="Registrar mi salida (Dejé libre mi espacio)"
                tipo="alerta"
                onPress={manejarSalida}
              />
            ) : (
              !zona.estaLleno && (
                <Boton
                  texto={`Reportar: "Me estacioné en ${etiquetaEdificio}"`}
                  onPress={manejarLlegada}
                />
              )
            )}

            {!zona.estaLleno ? (
              <Boton
                texto={`Ya no encontré lugar · Marcar ${etiquetaEdificio} como "lleno"`}
                tipo="alerta"
                onPress={manejarCupoLleno}
              />
            ) : (
              <Boton
                texto="Reportar que ya hay espacio disponible"
                tipo="secundario"
                onPress={manejarDesmarcarLleno}
              />
            )}

            <TouchableOpacity
              style={styles.btnSimularExtra}
              onPress={manejarSimularAuto}
            >
              <Text style={styles.btnSimularExtraTexto}>
                + Simular llegada de otro usuario a {zona.nombre} (+1 auto)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reportes con foto de vehículos mal estacionados en esta zona */}
        <View style={styles.seccionHistorial}>
          <SeccionReportesMalEstacionado zonaPreseleccionadaId={zona.id} />
        </View>

        <Boton
          texto="Volver al inicio"
          tipo="secundario"
          onPress={() => router.replace("/")}
        />
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
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  cajaBloqueoSesion: {
    padding: 20,
    borderRadius: 14,
    backgroundColor: colores.blanco,
    borderWidth: 1.5,
    borderColor: colores.rojo,
  },
  bloqueoTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: colores.rojo,
    marginBottom: 8,
  },
  bloqueoTexto: {
    fontSize: 15,
    lineHeight: 22,
    color: colores.texto,
    marginBottom: 14,
  },
  descripcion: {
    marginBottom: 14,
    fontSize: 15,
    lineHeight: 22,
    color: colores.texto,
  },
  detalle: {
    marginTop: 18,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colores.estructura,
    backgroundColor: colores.blanco,
  },
  detalleLleno: {
    borderColor: colores.rojo,
    backgroundColor: "#FFF5F5",
  },
  detalleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nombreZona: {
    fontSize: 20,
    fontWeight: "bold",
    color: colores.texto,
    flex: 1,
    paddingRight: 8,
  },
  badgeEstado: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeEstadoTexto: {
    fontSize: 12,
    fontWeight: "bold",
    color: colores.blanco,
  },
  metaZona: {
    marginTop: 4,
    fontSize: 13,
    color: "#475569",
  },
  metricasGrid: {
    marginTop: 14,
    gap: 10,
  },
  metricaCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricaEtiqueta: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  metricaPrincipal: {
    fontSize: 22,
    fontWeight: "bold",
    color: colores.verdeUtch,
    marginTop: 4,
  },
  metricaSecundaria: {
    fontSize: 18,
    fontWeight: "bold",
    color: colores.texto,
    marginTop: 4,
  },
  metricaSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  alertaRoja: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: colores.rojo,
  },
  alertaRojaTexto: {
    fontSize: 14,
    fontWeight: "bold",
    color: colores.rojo,
  },
  alertaRojaSub: {
    fontSize: 12,
    color: "#991B1B",
    marginTop: 3,
  },
  miLugarBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: colores.verdeUtch,
  },
  miLugarTexto: {
    fontSize: 14,
    fontWeight: "bold",
    color: colores.verdeUtch,
  },
  cajaExito: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: colores.verdeUtch,
  },
  textoExito: {
    color: "#065F46",
    fontSize: 14,
    fontWeight: "bold",
  },
  aviso: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    color: colores.rojo,
    fontSize: 14,
    fontWeight: "bold",
  },
  accionesZona: {
    marginTop: 8,
  },
  btnSimularExtra: {
    marginTop: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: colores.azulAccesible,
    alignItems: "center",
  },
  btnSimularExtraTexto: {
    color: "#0369A1",
    fontSize: 13,
    fontWeight: "bold",
  },
  seccionHistorial: {
    marginTop: 22,
    marginBottom: 10,
  },
  subtitulo: {
    marginBottom: 6,
    fontSize: 19,
    fontWeight: "bold",
    color: colores.texto,
  },
  ayuda: {
    marginBottom: 12,
    fontSize: 14,
    color: "#475569",
  },
  cardMov: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.estructura,
    marginBottom: 8,
  },
  cardMovTitulo: {
    fontSize: 13,
    fontWeight: "bold",
    color: colores.texto,
  },
  cardMovDesc: {
    fontSize: 14,
    fontWeight: "bold",
    color: colores.verdeUtch,
    marginTop: 2,
  },
  cardMovConteo: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
});
