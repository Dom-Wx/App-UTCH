import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colores } from "../constants/colores";

type Props = {
  texto: string;
  onPress: () => void;
  tipo?: "primario" | "secundario" | "alerta";
};

export default function Boton({ texto, onPress, tipo = "primario" }: Props) {
  return (
    <TouchableOpacity style={[styles.boton, styles[tipo]]} onPress={onPress}>
      <Text
        style={[styles.texto, tipo === "secundario" && styles.textoSecundario]}
      >
        {texto}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boton: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 10,
  },
  primario: {
    backgroundColor: colores.verdeUtch,
    borderColor: colores.verdeUtch,
  },
  secundario: {
    backgroundColor: colores.blanco,
    borderColor: colores.verdeUtch,
  },
  alerta: {
    backgroundColor: colores.rojo,
    borderColor: colores.rojo,
  },
  texto: {
    fontSize: 17,
    fontWeight: "bold",
    color: colores.blanco,
  },
  textoSecundario: {
    color: colores.verdeUtch,
  },
});
