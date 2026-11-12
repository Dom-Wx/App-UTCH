import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Boton from "../components/Boton";
import Encabezado from "../components/Encabezado";
import { colores } from "../constants/colores";
import { useSesion } from "../context/SesionContext";

export default function Ajustes() {
  const router = useRouter();
  const { usuario, actualizarCarro } = useSesion();

  const [vehiculo, setVehiculo] = useState(
    usuario && usuario.vehiculo !== "Vehículo particular"
      ? usuario.vehiculo
      : ""
  );
  const [placas, setPlacas] = useState(
    usuario && usuario.placas !== "SIN-PLACAS" ? usuario.placas : ""
  );
  const [mensajeExito, setMensajeExito] = useState("");
  const [avisoError, setAvisoError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setVehiculo(
        usuario.vehiculo !== "Vehículo particular" ? usuario.vehiculo : ""
      );
      setPlacas(usuario.placas !== "SIN-PLACAS" ? usuario.placas : "");
    }
  }, [usuario?.matricula]);

  if (usuario === null) {
    return (
      <ScrollView style={styles.pantalla}>
        <Encabezado titulo="Ajustes" onAtras={() => router.replace("/")} />
        <View style={styles.contenido}>
          <View style={styles.cajaBloqueo}>
            <Text style={styles.bloqueoTitulo}>
              Ajustes bloqueados (Sin sesión activa)
            </Text>
            <Text style={styles.bloqueoTexto}>
              Inicia sesión o crea una cuenta para poder agregar o cambiar tu
              carro.
            </Text>
            <Boton
              texto="Iniciar sesión"
              onPress={() => router.replace("/login")}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  async function guardarCambios() {
    setMensajeExito("");
    setAvisoError("");
    setGuardando(true);
    try {
      const res = await actualizarCarro(vehiculo, placas);
      if (!res.ok) {
        setAvisoError(res.error);
        return;
      }
      setMensajeExito("Tu carro se actualizó correctamente.");
    } catch {
      setAvisoError("No se pudo guardar tu carro. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.pantalla} keyboardShouldPersistTaps="handled">
      <Encabezado titulo="Ajustes" onAtras={() => router.back()} />

      <View style={styles.contenido}>
        <Text style={styles.titulo}>Mi Carro</Text>
        <Text style={styles.descripcion}>
          Aquí puedes poner o cambiar los datos de tu carro registrado en tu
          cuenta ({usuario.rol} · {usuario.matricula}).
        </Text>

        <View style={styles.resumenActual}>
          <Text style={styles.resumenEtiqueta}>CARRO ACTUALMENTE GUARDADO</Text>
          <Text style={styles.resumenValor}>{usuario.vehiculo}</Text>
          <Text style={styles.resumenPlacas}>
            Placas:{" "}
            {usuario.placas === "SIN-PLACAS"
              ? "Sin placas registradas"
              : usuario.placas}
          </Text>
        </View>

        <Text style={styles.etiqueta}>Modelo y color de tu carro</Text>
        <TextInput
          value={vehiculo}
          onChangeText={(t) => {
            setVehiculo(t);
            setAvisoError("");
            setMensajeExito("");
          }}
          placeholder="Ej. Nissan Versa Blanco"
          style={styles.entrada}
        />

        <Text style={styles.etiqueta}>Placas del carro (opcional)</Text>
        <TextInput
          value={placas}
          onChangeText={(t) => {
            setPlacas(t);
            setAvisoError("");
            setMensajeExito("");
          }}
          placeholder="Ej. ELP-1234"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.entrada}
        />

        {mensajeExito !== "" && (
          <View style={styles.cajaExito}>
            <Text style={styles.textoExito}>{mensajeExito}</Text>
          </View>
        )}

        {avisoError !== "" && <Text style={styles.aviso}>{avisoError}</Text>}

        <View style={styles.botones}>
          <Boton
            texto={guardando ? "Guardando..." : "Guardar mi carro"}
            onPress={guardando ? () => {} : guardarCambios}
          />
          <Boton
            texto="Volver al inicio"
            tipo="secundario"
            onPress={() => router.replace("/")}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  cajaBloqueo: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: colores.blanco,
    borderWidth: 1.5,
    borderColor: colores.rojo,
  },
  bloqueoTitulo: {
    fontSize: 19,
    fontWeight: "bold",
    color: colores.rojo,
    marginBottom: 8,
  },
  bloqueoTexto: {
    fontSize: 15,
    color: colores.texto,
    marginBottom: 14,
    lineHeight: 21,
  },
  titulo: {
    fontSize: 25,
    fontWeight: "bold",
    color: colores.texto,
  },
  descripcion: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 15,
    lineHeight: 22,
    color: colores.texto,
  },
  resumenActual: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.estructura,
    marginBottom: 10,
  },
  resumenEtiqueta: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  resumenValor: {
    fontSize: 18,
    fontWeight: "bold",
    color: colores.verdeUtch,
    marginTop: 4,
  },
  resumenPlacas: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },
  etiqueta: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 15,
    fontWeight: "bold",
    color: colores.texto,
  },
  entrada: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colores.estructura,
    borderRadius: 10,
    backgroundColor: colores.blanco,
    color: colores.texto,
    fontSize: 16,
  },
  cajaExito: {
    marginTop: 14,
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
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    color: colores.rojo,
    fontSize: 14,
    fontWeight: "bold",
  },
  botones: {
    marginTop: 16,
  },
});

