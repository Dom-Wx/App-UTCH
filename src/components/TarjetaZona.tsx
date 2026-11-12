import { StyleSheet, Text, View } from "react-native";
import { colores } from "../constants/colores";
import { Zona } from "../data/estacionamientos";

type Props = {
  zona: Zona;
};

// Tarjeta con el nombre de la zona, sus lugares libres, porcentaje y alerta
export default function TarjetaZona({ zona }: Props) {
  let estado = `Disponible (${zona.porcentajeOcupacion}%)`;
  let colorFondo = colores.verde;
  let colorTexto = colores.blanco;

  if (zona.nivelAlerta === "lleno") {
    estado = "Lleno (100%)";
    colorFondo = colores.rojo;
    colorTexto = colores.blanco;
  } else if (zona.nivelAlerta === "casi_lleno") {
    estado = `Casi lleno (${zona.porcentajeOcupacion}%)`;
    colorFondo = colores.naranjaAlerta;
    colorTexto = colores.blanco;
  }

  return (
    <View style={styles.tarjeta}>
      <View style={styles.izquierda}>
        <Text style={styles.nombre}>{zona.nombre}</Text>
        <Text style={styles.tipo}>
          {zona.tipo} · {zona.edificiosCercanos}
        </Text>
        <Text style={styles.acceso}>{zona.accesoCercano}</Text>
      </View>

      <View style={styles.derecha}>
        <Text style={styles.libres}>
          {zona.libres} / {zona.total} libres
        </Text>
        <View style={[styles.estado, { backgroundColor: colorFondo }]}>
          <Text style={[styles.estadoTexto, { color: colorTexto }]}>
            {estado}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.estructura,
    backgroundColor: colores.blanco,
  },
  izquierda: {
    flex: 1,
    paddingRight: 10,
  },
  nombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: colores.texto,
  },
  tipo: {
    marginTop: 2,
    fontSize: 13,
    color: "#475569",
  },
  acceso: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "bold",
    color: colores.verdeUtch,
  },
  derecha: {
    alignItems: "flex-end",
  },
  libres: {
    fontSize: 16,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 4,
  },
  estado: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
