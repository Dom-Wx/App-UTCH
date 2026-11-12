import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { colores } from "../constants/colores";
import { useEstacionamiento } from "../context/EstacionamientoContext";
import { edificios } from "../data/estacionamientos";

type Props = {
  zonaElegida: string;
  onElegir: (id: string) => void;
};

// Mapa arquitectónico vectorial e interactivo del Campus UTCH
export default function MapaCampus({ zonaElegida, onElegir }: Props) {
  const { width } = useWindowDimensions();
  const { zonas } = useEstacionamiento();

  const ancho = Math.min(width - 32, 560);
  const alto = Math.round(ancho * 0.88);

  function px(valor: number) {
    return (valor / 100) * ancho;
  }

  function py(valor: number) {
    return (valor / 100) * alto;
  }

  return (
    <View>
      <View style={[styles.mapa, { width: ancho, height: alto }]}>
        {/* Áreas verdes decorativas del campus */}
        <View
          style={[
            styles.areaVerde,
            { left: px(25), top: py(46), width: px(36), height: py(34) },
          ]}
        />
        <View
          style={[
            styles.areaVerde,
            { left: px(63), top: py(46), width: px(24), height: py(20) },
          ]}
        />
        <View
          style={[
            styles.areaVerde,
            { left: px(16), top: py(6), width: px(20), height: py(32) },
          ]}
        />

        {/* ==================== VIALIDADES Y CALLES ==================== */}
        {/* Av. Cantera (Lateral Poniente y Sur) */}
        <View
          style={[
            styles.avenidaExterna,
            { left: px(0), top: py(34), width: px(12), height: py(66) },
          ]}
        >
          <View style={styles.lineaAmarillaVertical} />
          <Text style={styles.textoCantera}>AV. CANTERA</Text>
        </View>
        <View
          style={[
            styles.avenidaExterna,
            { left: px(0), top: py(91), width: px(100), height: py(9) },
          ]}
        >
          <View style={styles.lineaAmarillaHorizontal} />
        </View>

        {/* Bulevar Central UTCH */}
        <View
          style={[
            styles.calleAsfalto,
            { left: px(10), top: py(41), width: px(76), height: py(5.5) },
          ]}
        >
          <View style={styles.lineaCarrilHorizontal} />
        </View>

        {/* Vialidad Norte */}
        <View
          style={[
            styles.calleAsfalto,
            { left: px(25), top: py(8), width: px(4.5), height: py(35) },
          ]}
        />

        {/* Circuito poniente */}
        <View
          style={[
            styles.calleAsfalto,
            { left: px(11), top: py(42), width: px(4), height: py(46) },
          ]}
        />
        <View
          style={[
            styles.calleAsfalto,
            { left: px(11), top: py(85), width: px(48), height: py(4) },
          ]}
        />

        {/* Vialidad central hacia D, G, C */}
        <View
          style={[
            styles.calleAsfalto,
            { left: px(37.5), top: py(44), width: px(3.5), height: py(43) },
          ]}
        />

        {/* Vialidad oriente */}
        <View
          style={[
            styles.calleAsfalto,
            { left: px(57), top: py(44), width: px(4.5), height: py(48) },
          ]}
        />

        {/* Glorieta 1 */}
        <View
          style={[
            styles.glorietaAsfalto,
            {
              left: px(21),
              top: py(38),
              width: px(11),
              height: px(11),
              borderRadius: px(6),
            },
          ]}
        >
          <View
            style={[
              styles.glorietaIsla,
              {
                width: px(5.5),
                height: px(5.5),
                borderRadius: px(3),
              },
            ]}
          />
        </View>

        {/* Glorieta 2 */}
        <View
          style={[
            styles.glorietaAsfalto,
            {
              left: px(54),
              top: py(38),
              width: px(11),
              height: px(11),
              borderRadius: px(6),
            },
          ]}
        >
          <View
            style={[
              styles.glorietaIsla,
              {
                width: px(5.5),
                height: px(5.5),
                borderRadius: px(3),
              },
            ]}
          />
        </View>

        {/* ==================== ESTACIONAMIENTOS COLABORATIVOS ==================== */}
        {zonas.map((zona) => {
          let colorPrincipal = colores.verdeUtch;
          let colorFondo = "rgba(0, 104, 55, 0.20)";

          if (zona.nivelAlerta === "concurrido") {
            colorPrincipal = colores.naranjaAlerta;
            colorFondo = "rgba(217, 119, 6, 0.24)";
          }

          if (zona.estaLleno) {
            colorPrincipal = colores.rojo;
            colorFondo = "rgba(217, 4, 41, 0.25)";
          }

          const seleccionada = zona.id === zonaElegida;

          return (
            <TouchableOpacity
              key={zona.id}
              activeOpacity={0.85}
              onPress={() => onElegir(zona.id)}
              style={[
                styles.zonaLote,
                {
                  left: px(zona.x),
                  top: py(zona.y),
                  width: px(zona.ancho),
                  height: py(zona.alto),
                  backgroundColor: colorFondo,
                  borderColor: seleccionada ? colores.texto : colorPrincipal,
                  borderWidth: seleccionada ? 3 : 2,
                },
              ]}
            >
              {/* Líneas decorativas de área de estacionamiento */}
              <View style={styles.rejillaCajones}>
                <View
                  style={[
                    styles.lineaCajon,
                    { backgroundColor: colorPrincipal },
                  ]}
                />
                <View
                  style={[
                    styles.lineaCajon,
                    { backgroundColor: colorPrincipal },
                  ]}
                />
                <View
                  style={[
                    styles.lineaCajon,
                    { backgroundColor: colorPrincipal },
                  ]}
                />
              </View>

              {/* Pastilla con el conteo colaborativo en vivo */}
              <View
                style={[
                  styles.pastillaZona,
                  { backgroundColor: colorPrincipal },
                ]}
              >
                <Text style={styles.pastillaCodigo}>
                  {zona.nombreCortoMapa}
                </Text>
                <Text style={styles.pastillaNumero}>
                  {zona.estaLleno
                    ? "LLENO"
                    : `${zona.personasEnElLugar} ${zona.personasEnElLugar === 1 ? "auto" : "autos"}`}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ==================== EDIFICIOS UTCH ==================== */}
        {edificios.map((edificio) => (
          <View
            key={edificio.letra}
            pointerEvents="none"
            style={[
              styles.edificio,
              {
                left: px(edificio.x),
                top: py(edificio.y),
                width: px(edificio.ancho),
                height: py(edificio.alto),
              },
            ]}
          >
            <View style={styles.edificioTecho} />
            <Text style={styles.edificioLetra}>{edificio.letra}</Text>
            {edificio.nombreCorto && (
              <Text numberOfLines={1} style={styles.edificioSub}>
                {edificio.nombreCorto}
              </Text>
            )}
          </View>
        ))}

        {/* ==================== CASETAS DE ACCESO ==================== */}
        <View style={[styles.caseta, { left: px(9), top: py(36) }]}>
          <View style={styles.casetaPunto} />
          <Text style={styles.casetaTexto}>ACCESO 1</Text>
        </View>

        <View style={[styles.caseta, { left: px(58), top: py(91.5) }]}>
          <View style={styles.casetaPunto} />
          <Text style={styles.casetaTexto}>ACCESO 2</Text>
        </View>
      </View>

      {/* Leyenda inferior */}
      <View style={styles.leyenda}>
        <View style={styles.leyendaItem}>
          <View
            style={[
              styles.leyendaColor,
              { backgroundColor: colores.verdeUtch },
            ]}
          />
          <Text style={styles.leyendaTexto}>Con espacios disponibles</Text>
        </View>
        <View style={styles.leyendaItem}>
          <View
            style={[
              styles.leyendaColor,
              { backgroundColor: colores.naranjaAlerta },
            ]}
          />
          <Text style={styles.leyendaTexto}>Alta afluencia</Text>
        </View>
        <View style={styles.leyendaItem}>
          <View
            style={[styles.leyendaColor, { backgroundColor: colores.rojo }]}
          />
          <Text style={styles.leyendaTexto}>
            Reportado como &quot;Lleno&quot;
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapa: {
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#EBF1EC",
    overflow: "hidden",
    position: "relative",
  },
  areaVerde: {
    position: "absolute",
    borderRadius: 14,
    backgroundColor: "#D8E8D6",
  },
  avenidaExterna: {
    position: "absolute",
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
  },
  lineaAmarillaVertical: {
    width: 2,
    height: "85%",
    backgroundColor: "#FACC15",
    opacity: 0.7,
  },
  lineaAmarillaHorizontal: {
    width: "90%",
    height: 2,
    backgroundColor: "#FACC15",
    opacity: 0.7,
  },
  textoCantera: {
    position: "absolute",
    color: "#F8FAFC",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1,
    transform: [{ rotate: "-90deg" }],
    width: 80,
    textAlign: "center",
  },
  calleAsfalto: {
    position: "absolute",
    backgroundColor: "#64748B",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  lineaCarrilHorizontal: {
    width: "92%",
    height: 1.5,
    backgroundColor: "#E2E8F0",
    opacity: 0.7,
  },
  glorietaAsfalto: {
    position: "absolute",
    backgroundColor: "#64748B",
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
  },
  glorietaIsla: {
    backgroundColor: colores.verdeUtch,
    borderWidth: 2,
    borderColor: "#DCFCE7",
  },
  zonaLote: {
    position: "absolute",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rejillaCajones: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 6,
    right: 6,
    justifyContent: "space-evenly",
    opacity: 0.25,
  },
  lineaCajon: {
    height: 1.5,
    width: "100%",
  },
  pastillaZona: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  pastillaCodigo: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#E2E8F0",
  },
  pastillaNumero: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: colores.blanco,
  },
  edificio: {
    position: "absolute",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#475569",
    borderBottomWidth: 4,
    borderBottomColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  edificioTecho: {
    position: "absolute",
    top: 2,
    left: 3,
    right: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colores.verdeUtch,
    opacity: 0.75,
  },
  edificioLetra: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 2,
  },
  edificioSub: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#475569",
    textAlign: "center",
  },
  caseta: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: colores.rojo,
    borderWidth: 1,
    borderColor: colores.blanco,
  },
  casetaPunto: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FACC15",
    marginRight: 4,
  },
  casetaTexto: {
    fontSize: 9,
    fontWeight: "bold",
    color: colores.blanco,
  },
  leyenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 12,
    gap: 12,
  },
  leyendaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  leyendaColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 5,
  },
  leyendaTexto: {
    fontSize: 12,
    color: colores.texto,
    fontWeight: "500",
  },
});
