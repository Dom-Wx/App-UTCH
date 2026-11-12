import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Boton from "../components/Boton";
import Encabezado from "../components/Encabezado";
import MapaCajones from "../components/MapaCajones";
import MapaCampus from "../components/MapaCampus";
import { colores } from "../constants/colores";
import { useEstacionamiento } from "../context/EstacionamientoContext";
import { useSesion } from "../context/SesionContext";

export default function Ubicacion() {
  const router = useRouter();
  const {
    usuario,
    matricula,
    accesible,
    cargando: cargandoSesion,
  } = useSesion();
  const {
    zonas,
    cargando,
    errorCarga,
    obtenerCajonDeUsuario,
    ocuparCajonEspecifico,
  } = useEstacionamiento();

  const miRegistro = obtenerCajonDeUsuario(matricula);
  const [zonaElegida, setZonaElegida] = useState(
    miRegistro?.zonaId ?? "EN"
  );
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (miRegistro) {
      setZonaElegida(miRegistro.zonaId);
    }
  }, [miRegistro?.zonaId]);

  const zona = zonas.find((elemento) => elemento.id === zonaElegida) ?? zonas[0];
  const cajonEnEstaZona =
    miRegistro && miRegistro.zonaId === zona.id ? miRegistro.cajonNombre : null;

  async function elegirCajon(nombre: string, valor: number) {
    setAviso("");

    if (!usuario || !matricula) {
      router.push("/registro");
      return;
    }

    if (valor === 1) return;

    const tipoPermitido =
      usuario.rol === "Personal" ? "Personal" : "Estudiantes";
    if (zona.tipo !== tipoPermitido) {
      setAviso(
        usuario.rol === "Personal"
          ? "El personal debe usar los estacionamientos verdes."
          : "Los estacionamientos verdes son exclusivos para Personal/Docentes UTCH."
      );
      return;
    }

    if (valor === 2 && !accesible) {
      setAviso("Este cajón es exclusivo para personas con discapacidad.");
      return;
    }

    try {
      const res = await ocuparCajonEspecifico(zona.id, nombre, matricula);
      if (!res.ok) {
        setAviso(res.error);
      }
    } catch {
      setAviso("No fue posible guardar la asignación. Intenta de nuevo.");
    }
  }

  if (cargando || cargandoSesion) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={colores.verdeUtch} />
        <Text style={styles.textoCargando}>Cargando disponibilidad...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.pantalla}>
      <Encabezado titulo="Mapa del campus UTCH" onAtras={() => router.back()} />

      <View style={styles.contenido}>
        <Text style={styles.descripcion}>
          Toca cualquier estacionamiento en el mapa para ver sus cajones en
          tiempo real.
        </Text>
        {errorCarga !== null && (
          <Text style={styles.aviso}>{errorCarga}</Text>
        )}

        <MapaCampus
          zonaElegida={zonaElegida}
          onElegir={(id) => {
            setZonaElegida(id);
            setAviso("");
          }}
        />

        {/* Tarjeta de detalle en vivo de la zona seleccionada */}
        <View style={styles.detalle}>
          <View style={styles.detalleHeader}>
            <Text style={styles.nombreZona}>{zona.nombre}</Text>
            <View
              style={[
                styles.badgeTipo,
                {
                  backgroundColor:
                    zona.tipo === "Personal"
                      ? colores.verde
                      : colores.azulAccesible,
                },
              ]}
            >
              <Text style={styles.badgeTipoTexto}>{zona.tipo}</Text>
            </View>
          </View>

          <Text style={styles.disponibilidad}>
            {zona.libres} de {zona.total} cajones disponibles ({zona.porcentajeOcupacion}% ocupado)
          </Text>
          <Text style={styles.metaZona}>
            {zona.edificiosCercanos} · {zona.accesoCercano}
          </Text>

          {zona.nivelAlerta === "casi_lleno" && (
            <View style={styles.alertaAmarilla}>
              <Text style={styles.alertaAmarillaTexto}>
                Alerta: Esta zona superó el 80% de su capacidad.
              </Text>
            </View>
          )}

          {zona.nivelAlerta === "lleno" && (
            <View style={styles.alertaRoja}>
              <Text style={styles.alertaRojaTexto}>
                Zona saturada (100% llena). Elige otro estacionamiento en el mapa.
              </Text>
            </View>
          )}
        </View>

        {aviso !== "" && <Text style={styles.aviso}>{aviso}</Text>}

        {/* Croquis real de cajones de la zona seleccionada */}
        <View style={styles.cajones}>
          <Text style={styles.subtitulo}>Croquis de {zona.nombre}</Text>
          <Text style={styles.ayuda}>
            {matricula === null
              ? "Crea tu cuenta o inicia sesión para apartar un cajón."
              : cajonEnEstaZona === null
                ? "Toca un cajón verde libre para asignar tu lugar."
                : `Tu cajón asignado en esta zona es ${zona.id}-${cajonEnEstaZona}.`}
          </Text>

          <MapaCajones
            filas={zona.filas}
            cajon={cajonEnEstaZona}
            onElegir={elegirCajon}
          />
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
    borderWidth: 1,
    borderColor: colores.estructura,
    backgroundColor: colores.blanco,
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
  },
  badgeTipo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTipoTexto: {
    fontSize: 12,
    fontWeight: "bold",
    color: colores.blanco,
  },
  disponibilidad: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "bold",
    color: colores.verdeUtch,
  },
  metaZona: {
    marginTop: 2,
    fontSize: 13,
    color: "#475569",
  },
  alertaAmarilla: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colores.naranjaFondo,
    borderWidth: 1,
    borderColor: colores.naranjaAlerta,
  },
  alertaAmarillaTexto: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#92400E",
  },
  alertaRoja: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: colores.rojo,
  },
  alertaRojaTexto: {
    fontSize: 13,
    fontWeight: "bold",
    color: colores.rojo,
  },
  aviso: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    color: colores.rojo,
    fontSize: 14,
    fontWeight: "bold",
  },
  cajones: {
    marginTop: 22,
  },
  subtitulo: {
    marginBottom: 4,
    fontSize: 20,
    fontWeight: "bold",
    color: colores.texto,
  },
  ayuda: {
    marginBottom: 12,
    fontSize: 14,
    color: "#475569",
  },
});
