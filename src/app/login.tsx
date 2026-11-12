import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Boton from "../components/Boton";
import Encabezado from "../components/Encabezado";
import { colores } from "../constants/colores";
import { useSesion } from "../context/SesionContext";

export default function Login() {
  const router = useRouter();
  const { iniciarSesion } = useSesion();
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);

  async function continuar() {
    setAviso("");
    setCargando(true);
    try {
      const res = await iniciarSesion(matricula, password);
      if (!res.ok) {
        setAviso(res.error);
        return;
      }

      router.replace("/");
    } catch {
      setAviso("No fue posible iniciar sesión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScrollView style={styles.pantalla} keyboardShouldPersistTaps="handled">
      <Encabezado titulo="Iniciar sesión" onAtras={() => router.back()} />
      <View style={styles.contenido}>
        <Text style={styles.titulo}>Bienvenido a UTCH ParkMate</Text>
        <Text style={styles.descripcion}>
          Inicia sesión con tu cuenta de alumno o docente para reportar en qué
          estacionamiento te encuentras o avisar cuando un área ya esté llena.
        </Text>

        <Text style={styles.etiqueta}>Matrícula (Alumno) o Clave (Docente)</Text>
        <TextInput
          value={matricula}
          onChangeText={(texto) => {
            setMatricula(texto);
            setAviso("");
          }}
          placeholder="Ej. 1221100456 o DOC-104"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.entrada}
          accessibilityLabel="Matrícula o Clave"
        />

        <Text style={styles.etiqueta}>Contraseña</Text>
        <TextInput
          value={password}
          onChangeText={(texto) => {
            setPassword(texto);
            setAviso("");
          }}
          placeholder="Tu contraseña"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={continuar}
          style={styles.entrada}
          accessibilityLabel="Contraseña"
        />

        {aviso !== "" && <Text style={styles.aviso}>{aviso}</Text>}

        <View style={styles.botones}>
          <Boton
            texto={cargando ? "Verificando..." : "Iniciar sesión"}
            onPress={cargando ? () => {} : continuar}
          />
          <Boton
            texto="¿No tienes cuenta? Crear cuenta (Alumno / Docente)"
            tipo="secundario"
            onPress={() => router.replace("/registro")}
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
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: colores.texto,
  },
  descripcion: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 23,
    color: colores.texto,
  },
  etiqueta: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: colores.texto,
  },
  entrada: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colores.estructura,
    borderRadius: 10,
    backgroundColor: colores.blanco,
    color: colores.texto,
    fontSize: 17,
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
    marginTop: 14,
  },
});
