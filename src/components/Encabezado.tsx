import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colores } from "../constants/colores";

type Props = {
  titulo: string;
  onAtras: () => void;
  textoDerecha?: string;
  onDerecha?: () => void;
};

// Barra superior verde UTCH, con el botón para regresar
export default function Encabezado({ titulo, onAtras, textoDerecha, onDerecha }: Props) {
  return (
    <View style={styles.barra}>
      <View style={styles.fila}>
        <TouchableOpacity onPress={onAtras}>
          <Text style={styles.enlace}>Atrás</Text>
        </TouchableOpacity>

        {textoDerecha !== undefined && (
          <TouchableOpacity onPress={onDerecha}>
            <Text style={styles.enlace}>{textoDerecha}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.titulo}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    paddingTop: 55,
    paddingBottom: 18,
    paddingHorizontal: 20,
    backgroundColor: colores.verdeUtch,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  enlace: {
    fontSize: 16,
    color: colores.blanco,
    paddingVertical: 6,
  },
  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    color: colores.blanco,
    marginTop: 6,
  },
});