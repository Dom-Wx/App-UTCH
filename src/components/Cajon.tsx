import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colores } from "../constants/colores";

type Props = {
  nombre: string;
  estado: "libre" | "ocupado" | "accesible" | "asignado";
  onPress: () => void;
};

// Un cajón del mapa. Su color depende de su estado.
export default function Cajon({ nombre, estado, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.cajon, styles[estado]]}
      onPress={onPress}
      disabled={estado === "ocupado"}
    >
      {estado !== "ocupado" && (
        <Text style={[styles.texto, estado === "libre" && styles.textoOscuro]}>
          {nombre}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cajon: {
    flex: 1,
    height: 52,
    margin: 3,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  libre: {
    backgroundColor: colores.verde,
  },
  ocupado: {
    backgroundColor: colores.gris,
  },
  accesible: {
    backgroundColor: colores.azulAccesible,
  },
  asignado: {
    backgroundColor: colores.verdeUtch,
  },
  texto: {
    fontSize: 15,
    fontWeight: "bold",
    color: colores.blanco,
  },
  textoOscuro: {
    color: colores.texto,
  },
});
