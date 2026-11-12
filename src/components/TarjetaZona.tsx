import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colores } from "../constants/colores";
import { Zona } from "../data/estacionamientos";

type Props = {
  zona: Zona;
  estoyAqui?: boolean;
  puedeReportar?: boolean;
  onReportarLlegada?: () => void;
  onReportarLleno?: () => void;
  onDesmarcarLleno?: () => void;
  onVerEnMapa?: () => void;
};

export default function TarjetaZona({
  zona,
  estoyAqui = false,
  puedeReportar = false,
  onReportarLlegada,
  onReportarLleno,
  onDesmarcarLleno,
  onVerEnMapa,
}: Props) {
  let estado = "Disponible";
  let colorFondo = colores.verde;

  if (zona.estaLleno) {
    estado = "LLENO";
    colorFondo = colores.rojo;
  } else if (zona.nivelAlerta === "concurrido") {
    estado = "Alta afluencia";
    colorFondo = colores.naranjaAlerta;
  }

  const etiquetaEdificio = zona.nombre.toLowerCase().startsWith("edificio ")
    ? `el edificio ${zona.nombre.slice("Edificio ".length)}`
    : zona.nombre;

  return (
    <View
      style={[
        styles.tarjeta,
        zona.estaLleno && styles.tarjetaLlena,
        estoyAqui && styles.tarjetaMiUbicacion,
      ]}
    >
      <View style={styles.filaSuperior}>
        <View style={styles.izquierda}>
          <View style={styles.tituloFila}>
            <Text style={styles.nombre}>Estacionamiento {zona.nombre}</Text>
            {estoyAqui && (
              <View style={styles.badgeMiLugar}>
                <Text style={styles.badgeMiLugarTexto}>Estás aquí</Text>
              </View>
            )}
          </View>
          <Text style={styles.descripcion}>{zona.descripcion}</Text>
          <Text style={styles.acceso}>
            {zona.edificiosCercanos} · {zona.accesoCercano}
          </Text>
        </View>

        <View style={styles.derecha}>
          <View style={[styles.estado, { backgroundColor: colorFondo }]}>
            <Text style={styles.estadoTexto}>{estado}</Text>
          </View>
        </View>
      </View>

      {/* Conteo colaborativo en tiempo real */}
      <View style={styles.cajaConteo}>
        <View style={styles.conteoPrincipal}>
          <Text style={styles.textoPersonas}>
            Personas en el lugar: {zona.personasEnElLugar}
          </Text>
          <Text style={styles.subConteo}>
            {zona.personasEnElLugar === 1
              ? "1 vehículo estacionado reportado"
              : `${zona.personasEnElLugar} vehículos estacionados reportados`}
          </Text>
        </View>

        <View style={styles.capacidadBox}>
          <Text style={styles.capacidadEtiqueta}>Capacidad real</Text>
          <Text style={styles.capacidadValor}>
            {zona.capacidadRealDetectada !== null
              ? `${zona.capacidadRealDetectada} autos`
              : zona.maximoRegistrado > 0
                ? `Máx. ${zona.maximoRegistrado} (en curso)`
                : "Por descubrir"}
          </Text>
        </View>
      </View>

      {zona.estaLleno && zona.ultimoReporteLleno && (
        <View style={styles.avisoLlenoDetalle}>
          <Text style={styles.avisoLlenoTexto}>
            Aviso de cupo lleno enviado por un{" "}
            {zona.ultimoReporteLleno.rol.toLowerCase()} a las{" "}
            {zona.ultimoReporteLleno.hora}.
          </Text>
        </View>
      )}

      {/* Botones colaborativos rápidos */}
      {puedeReportar && (
        <View style={styles.accionesFila}>
          {!estoyAqui && !zona.estaLleno && onReportarLlegada && (
            <TouchableOpacity
              style={styles.btnLlegada}
              onPress={onReportarLlegada}
            >
              <Text style={styles.btnLlegadaTexto}>
                Me estacioné en {etiquetaEdificio}
              </Text>
            </TouchableOpacity>
          )}

          {!zona.estaLleno && onReportarLleno && (
            <TouchableOpacity style={styles.btnLleno} onPress={onReportarLleno}>
              <Text style={styles.btnLlenoTexto}>
                Marcar como &quot;lleno&quot;
              </Text>
            </TouchableOpacity>
          )}

          {zona.estaLleno && onDesmarcarLleno && (
            <TouchableOpacity
              style={styles.btnDisponible}
              onPress={onDesmarcarLleno}
            >
              <Text style={styles.btnDisponibleTexto}>
                Ya hay espacio libre
              </Text>
            </TouchableOpacity>
          )}

          {onVerEnMapa && (
            <TouchableOpacity style={styles.btnMapa} onPress={onVerEnMapa}>
              <Text style={styles.btnMapaTexto}>Ver en mapa</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colores.estructura,
    backgroundColor: colores.blanco,
  },
  tarjetaLlena: {
    borderColor: colores.rojo,
    backgroundColor: "#FFF5F5",
  },
  tarjetaMiUbicacion: {
    borderColor: colores.verdeUtch,
    borderWidth: 2,
  },
  filaSuperior: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  izquierda: {
    flex: 1,
    paddingRight: 10,
  },
  tituloFila: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  nombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: colores.texto,
  },
  badgeMiLugar: {
    backgroundColor: colores.verdeUtch,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeMiLugarTexto: {
    color: colores.blanco,
    fontSize: 11,
    fontWeight: "bold",
  },
  descripcion: {
    marginTop: 3,
    fontSize: 13,
    color: "#475569",
  },
  acceso: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "bold",
    color: colores.verdeUtch,
  },
  derecha: {
    alignItems: "flex-end",
  },
  estado: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: "bold",
    color: colores.blanco,
  },
  cajaConteo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  conteoPrincipal: {
    flex: 1,
    paddingRight: 8,
  },
  textoPersonas: {
    fontSize: 17,
    fontWeight: "bold",
    color: colores.verdeUtch,
  },
  subConteo: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  capacidadBox: {
    alignItems: "flex-end",
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#CBD5E1",
  },
  capacidadEtiqueta: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  capacidadValor: {
    fontSize: 13,
    fontWeight: "bold",
    color: colores.texto,
    marginTop: 2,
  },
  avisoLlenoDetalle: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  avisoLlenoTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: colores.rojo,
  },
  accionesFila: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  btnLlegada: {
    flexGrow: 1,
    backgroundColor: colores.verdeUtch,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnLlegadaTexto: {
    color: colores.blanco,
    fontSize: 13,
    fontWeight: "bold",
  },
  btnLleno: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: colores.rojo,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnLlenoTexto: {
    color: colores.rojo,
    fontSize: 13,
    fontWeight: "bold",
  },
  btnDisponible: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: colores.verdeUtch,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnDisponibleTexto: {
    color: colores.verdeUtch,
    fontSize: 13,
    fontWeight: "bold",
  },
  btnMapa: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnMapaTexto: {
    color: colores.texto,
    fontSize: 13,
    fontWeight: "bold",
  },
});
