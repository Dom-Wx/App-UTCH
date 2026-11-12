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
import TarjetaZona from "../components/TarjetaZona";
import { colores } from "../constants/colores";
import { useEstacionamiento } from "../context/EstacionamientoContext";
import { useSesion } from "../context/SesionContext";

export default function Inicio() {
  const router = useRouter();
  const {
    usuario,
    matricula,
    accesible,
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
    registrarIngresoEnZona,
    registrarSalidaVehiculo,
  } = useEstacionamiento();

  const [aviso, setAviso] = useState("");
  const miEstacionado = obtenerCajonDeUsuario(matricula);

  async function registrarEntradaRapida() {
    if (!usuario || !matricula) return;
    setAviso("");

    const tipoPermitido =
      usuario.rol === "Personal" ? "Personal" : "Estudiantes";
    const candidatas = zonas.filter(
      (z) => z.tipo === tipoPermitido && z.libres > 0
    );

    if (candidatas.length === 0) {
      setAviso("Todos los estacionamientos permitidos están llenos.");
      return;
    }

    const preferida =
      candidatas.find((z) => z.accesoCercano === usuario.accesoRecomendado) ??
      candidatas[0];

    try {
      const res = await registrarIngresoEnZona(
        preferida.id,
        matricula,
        accesible
      );
      if (!res.ok) {
        setAviso(res.error);
        return;
      }

      router.push("/ubicacion");
    } catch {
      setAviso("No fue posible guardar la entrada. Intenta de nuevo.");
    }
  }

  async function registrarSalidaRapida() {
    if (!matricula) return;
    setAviso("");
    try {
      const res = await registrarSalidaVehiculo(matricula);
      if (!res.ok) {
        setAviso(res.error);
      }
    } catch {
      setAviso("No fue posible guardar la salida. Intenta de nuevo.");
    }
  }

  async function salir() {
    setAviso("");
    try {
      await cerrarSesion();
    } catch {
      setAviso("No fue posible cerrar la sesión. Intenta de nuevo.");
    }
  }

  if (cargando || cargandoEstacionamiento) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={colores.verdeUtch} />
        <Text style={styles.textoCargando}>Cargando perfil UTCH...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.pantalla}>
      {/* Encabezado de marca */}
      <View style={styles.marca}>
        <View style={styles.logo}>
          <Text style={styles.logoTexto}>P</Text>
        </View>
        <View style={styles.marcaInfo}>
          <Text style={styles.nombreApp}>UTCH ParkMate</Text>
          <Text style={styles.lema}>Cultura Vial y Estacionamiento</Text>
        </View>
        {usuario !== null && (
          <TouchableOpacity onPress={salir} style={styles.btnSalir}>
            <Text style={styles.btnSalirTexto}>Salir</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.panel}>
        {usuario === null && (
          <View>
            <Text style={styles.panelTitulo}>
              Llega a la UTCH sin perder tiempo.
            </Text>
            <Text style={styles.panelTexto}>
              Crea tu cuenta con tu matrícula para guardar tu vehículo, generar
              tu pase QR y ver lugares libres en tiempo real.
            </Text>
            <Boton
              texto="Crear cuenta UTCH"
              tipo="secundario"
              onPress={() => router.push("/registro")}
            />
            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={styles.enlaceLogin}
            >
              <Text style={styles.enlaceLoginTexto}>
                Ya tengo una cuenta · Iniciar sesión
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {usuario !== null && (
          <View>
            <View style={styles.etiquetaRolBox}>
              <Text style={styles.etiquetaRolTexto}>
                {usuario.rol} · {usuario.matricula}
              </Text>
            </View>

            <Text style={styles.panelTitulo}>
              Hola, {usuario.nombre.split(" ")[0]}
            </Text>
            <Text style={styles.panelTexto}>
              {usuario.carreraNombre} · Placas: {usuario.placas}
            </Text>

            <View style={styles.credencialBox}>
              <Text style={styles.credencialTitulo}>
                Pase Digital de Caseta (QR)
              </Text>
              <Text style={styles.credencialCodigo}>{usuario.codigoQR}</Text>
              <Text style={styles.credencialRuta}>
                Entrada recomendada: {usuario.accesoRecomendado}
              </Text>
            </View>

            {miEstacionado === null ? (
              <Boton
                texto="Registrar entrada y asignar cajón"
                tipo="secundario"
                onPress={registrarEntradaRapida}
              />
            ) : (
              <View style={styles.cajonAsignadoBox}>
                <Text style={styles.cajonAsignadoTitulo}>
                  Estacionado en {miEstacionado.zonaNombre} · Cajón{" "}
                  {miEstacionado.zonaId}-{miEstacionado.cajonNombre}
                </Text>
                <Text style={styles.cajonHora}>
                  Hora de ingreso: {miEstacionado.horaIngreso}
                </Text>
                <Boton
                  texto="Ver ubicación en el mapa"
                  tipo="secundario"
                  onPress={() => router.push("/ubicacion")}
                />
                <Boton
                  texto="Registrar mi salida (liberar lugar)"
                  tipo="alerta"
                  onPress={registrarSalidaRapida}
                />
              </View>
            )}
          </View>
        )}
      </View>

      {aviso !== "" && <Text style={styles.aviso}>{aviso}</Text>}
      {(errorCargaSesion || errorCargaEstacionamiento) && (
        <Text style={styles.aviso}>
          {errorCargaSesion ?? errorCargaEstacionamiento}
        </Text>
      )}

      {/* Alertas de saturación en tiempo real (>80% o Lleno) */}
      {alertasSaturacion.length > 0 && (
        <View style={styles.seccionAlertas}>
          <Text style={styles.alertasTitulo}>Alertas de saturación en vivo</Text>
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

      {/* Lista de zonas en tiempo real */}
      <View style={styles.seccion}>
        <Text style={styles.subtitulo}>Estacionamientos UTCH</Text>

        {zonas.map((zona) => (
          <TarjetaZona key={zona.id} zona={zona} />
        ))}

        <Boton
          texto="Ver mapa del campus"
          onPress={() => router.push("/ubicacion")}
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
  marca: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 55,
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
    fontSize: 13,
    color: "#475569",
  },
  btnSalir: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colores.estructura,
  },
  btnSalirTexto: {
    fontSize: 14,
    fontWeight: "bold",
    color: colores.rojo,
  },
  panel: {
    paddingHorizontal: 20,
    paddingVertical: 26,
    backgroundColor: colores.verdeUtch,
  },
  panelTitulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: colores.blanco,
  },
  panelTexto: {
    fontSize: 16,
    lineHeight: 22,
    color: "#E2E8F0",
    marginTop: 8,
    marginBottom: 14,
  },
  enlaceLogin: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 6,
  },
  enlaceLoginTexto: {
    color: colores.blanco,
    fontSize: 15,
    textDecorationLine: "underline",
  },
  etiquetaRolBox: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  etiquetaRolTexto: {
    color: colores.blanco,
    fontSize: 13,
    fontWeight: "bold",
  },
  credencialBox: {
    backgroundColor: colores.blanco,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  credencialTitulo: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  credencialCodigo: {
    fontSize: 18,
    fontWeight: "bold",
    color: colores.verdeUtch,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  credencialRuta: {
    fontSize: 13,
    color: colores.verde,
    fontWeight: "bold",
    marginTop: 4,
  },
  cajonAsignadoBox: {
    marginTop: 6,
  },
  cajonAsignadoTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: colores.blanco,
  },
  cajonHora: {
    fontSize: 14,
    color: "#E2E8F0",
    marginTop: 2,
    marginBottom: 6,
  },
  aviso: {
    margin: 20,
    marginBottom: 0,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colores.rojo,
    color: colores.blanco,
    fontSize: 15,
    fontWeight: "bold",
  },
  seccionAlertas: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  alertasTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 8,
  },
  alertaCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
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
    fontSize: 14,
    fontWeight: "bold",
  },
  alertaTextoAmarillo: {
    color: "#92400E",
  },
  alertaTextoRojo: {
    color: colores.rojo,
  },
  alertaAlternativa: {
    marginTop: 4,
    fontSize: 13,
    color: colores.texto,
  },
  seccion: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 12,
  },
});
