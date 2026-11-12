import { StyleSheet, Text, View } from "react-native";
import { colores } from "../constants/colores";
import { Fila } from "../data/estacionamientos";
import Cajon from "./Cajon";

type Props = {
  filas: Fila[];
  cajon: string | null;
  onElegir: (nombre: string, valor: number) => void;
};

// Croquis interactivo de cajones para cualquier zona del campus
export default function MapaCajones({ filas, cajon, onElegir }: Props) {
  const filaAsignada = cajon === null ? "" : cajon.charAt(0);

  function estadoDe(nombre: string, valor: number) {
    if (nombre === cajon) {
      return "asignado";
    }
    if (valor === 1) {
      return "ocupado";
    }
    if (valor === 2) {
      return "accesible";
    }
    return "libre";
  }

  function dibujarFila(fila: Fila) {
    return (
      <View key={fila.letra} style={styles.fila}>
        <Text style={styles.letraFila}>{fila.letra}</Text>

        {fila.cajones.map((valor, i) => {
          const nombre = fila.letra + (i + 1);
          return (
            <Cajon
              key={nombre}
              nombre={nombre}
              estado={estadoDe(nombre, valor)}
              onPress={() => onElegir(nombre, valor)}
            />
          );
        })}
      </View>
    );
  }

  // Agrupa filas en pares separados por carriles de circulación
  const bloques: { fila1: Fila; fila2?: Fila; numeroCarril: number }[] = [];
  for (let i = 0; i < filas.length; i += 2) {
    bloques.push({
      fila1: filas[i],
      fila2: filas[i + 1],
      numeroCarril: Math.floor(i / 2) + 1,
    });
  }

  return (
    <View>
      {bloques.map((bloque) => {
        const rutaEnEsteCarril =
          filaAsignada !== "" &&
          (filaAsignada === bloque.fila1.letra ||
            filaAsignada === bloque.fila2?.letra);

        return (
          <View key={bloque.numeroCarril}>
            {dibujarFila(bloque.fila1)}
            <View style={[styles.carril, rutaEnEsteCarril && styles.carrilRuta]}>
              <Text
                style={[
                  styles.carrilTexto,
                  rutaEnEsteCarril && styles.carrilRutaTexto,
                ]}
              >
                {rutaEnEsteCarril
                  ? `Carril ${bloque.numeroCarril} · Tu ruta`
                  : `Carril ${bloque.numeroCarril}`}
              </Text>
            </View>
            {bloque.fila2 && dibujarFila(bloque.fila2)}
          </View>
        );
      })}

      {/* Qué significa cada color */}
      <View style={styles.leyenda}>
        <View style={styles.leyendaFila}>
          <View style={[styles.cuadro, { backgroundColor: colores.verde }]} />
          <Text style={styles.leyendaTexto}>Libre</Text>
        </View>
        <View style={styles.leyendaFila}>
          <View style={[styles.cuadro, { backgroundColor: colores.gris }]} />
          <Text style={styles.leyendaTexto}>Ocupado</Text>
        </View>
        <View style={styles.leyendaFila}>
          <View
            style={[styles.cuadro, { backgroundColor: colores.azulAccesible }]}
          />
          <Text style={styles.leyendaTexto}>Discapacidad</Text>
        </View>
        <View style={styles.leyendaFila}>
          <View
            style={[styles.cuadro, { backgroundColor: colores.verdeUtch }]}
          />
          <Text style={styles.leyendaTexto}>Tu cajón</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
  },
  letraFila: {
    width: 22,
    fontSize: 15,
    fontWeight: "bold",
    color: colores.texto,
  },
  carril: {
    marginVertical: 6,
    marginLeft: 25,
    marginRight: 3,
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
  },
  carrilRuta: {
    backgroundColor: colores.verdeUtch,
  },
  carrilTexto: {
    fontSize: 13,
    color: colores.texto,
  },
  carrilRutaTexto: {
    fontWeight: "bold",
    color: colores.blanco,
  },
  leyenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
  },
  leyendaFila: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
    marginBottom: 8,
  },
  cuadro: {
    width: 16,
    height: 16,
    marginRight: 6,
    borderRadius: 3,
  },
  leyendaTexto: {
    fontSize: 14,
    color: colores.texto,
  },
});
