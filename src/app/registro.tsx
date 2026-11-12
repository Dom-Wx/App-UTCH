import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Boton from "../components/Boton";
import Encabezado from "../components/Encabezado";
import { colores } from "../constants/colores";
import { useSesion } from "../context/SesionContext";
import { CARRERAS_UTCH, RolUsuario } from "../services/database";

export default function Registro() {
  const router = useRouter();
  const { registrarCuenta } = useSesion();

  const [rol, setRol] = useState<RolUsuario>("Alumno");
  const [matricula, setMatricula] = useState("");
  const [nombre, setNombre] = useState("");
  const [carreraId, setCarreraId] = useState("escolares_general");
  const [placas, setPlacas] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [password, setPassword] = useState("");
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function manejarRegistro() {
    setAviso("");
    setGuardando(true);

    try {
      const resultado = await registrarCuenta({
        matricula,
        nombre,
        password,
        rol,
        carreraId,
        placas,
        vehiculo,
        accesible: false,
      });

      if (!resultado.ok) {
        setAviso(resultado.error);
        return;
      }

      router.replace("/");
    } catch {
      setAviso("No fue posible guardar tu cuenta. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={styles.pantalla} keyboardShouldPersistTaps="handled">
      <Encabezado titulo="Crear cuenta UTCH" onAtras={() => router.back()} />

      <View style={styles.contenido}>
        <Text style={styles.titulo}>Registro en la Comunidad UTCH</Text>
        <Text style={styles.descripcion}>
          Crea tu cuenta como alumno o docente para reportar en qué área de la
          escuela te estacionaste o avisar cuando un estacionamiento esté lleno.
        </Text>

        {/* Rol: Alumno o Docente */}
        <Text style={styles.etiqueta}>¿Eres alumno o docente?</Text>
        <View style={styles.filaOpciones}>
          {(["Alumno", "Docente"] as RolUsuario[]).map((opcion) => {
            const activo = rol === opcion;
            return (
              <TouchableOpacity
                key={opcion}
                onPress={() => {
                  setRol(opcion);
                  setCarreraId(
                    opcion === "Docente"
                      ? "docente_academico"
                      : "escolares_general"
                  );
                }}
                style={[styles.opcionChip, activo && styles.opcionChipActiva]}
              >
                <Text
                  style={[
                    styles.opcionTexto,
                    activo && styles.opcionTextoActivo,
                  ]}
                >
                  Soy {opcion}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Matrícula o Clave */}
        <Text style={styles.etiqueta}>
          {rol === "Alumno"
            ? "Matrícula de alumno"
            : "Clave o Número de docente"}
        </Text>
        <TextInput
          value={matricula}
          onChangeText={(t) => {
            setMatricula(t);
            setAviso("");
          }}
          placeholder={rol === "Alumno" ? "Ej. 1221100456" : "Ej. DOC-104"}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.entrada}
        />

        {/* Nombre */}
        <Text style={styles.etiqueta}>Nombre completo</Text>
        <TextInput
          value={nombre}
          onChangeText={(t) => {
            setNombre(t);
            setAviso("");
          }}
          placeholder="Ej. Ana López García"
          autoCapitalize="words"
          style={styles.entrada}
        />

        {/* Contraseña */}
        <Text style={styles.etiqueta}>Contraseña</Text>
        <TextInput
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setAviso("");
          }}
          placeholder="Mínimo 4 caracteres"
          secureTextEntry
          style={styles.entrada}
        />

        {/* Área o Carrera en UTCH */}
        <Text style={styles.etiqueta}>Área o edificio que visitas más</Text>
        <View style={styles.listaCarreras}>
          {CARRERAS_UTCH.map((carrera) => {
            const seleccionada = carrera.id === carreraId;
            return (
              <TouchableOpacity
                key={carrera.id}
                onPress={() => setCarreraId(carrera.id)}
                style={[
                  styles.tarjetaCarrera,
                  seleccionada && styles.tarjetaCarreraActiva,
                ]}
              >
                <Text
                  style={[
                    styles.nombreCarrera,
                    seleccionada && styles.nombreCarreraActiva,
                  ]}
                >
                  {carrera.nombre}
                </Text>
                <Text
                  style={[
                    styles.metaCarrera,
                    seleccionada && styles.metaCarreraActiva,
                  ]}
                >
                  {carrera.edificio} · {carrera.accesoRecomendado}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Vehículo (opcional) */}
        <Text style={styles.etiqueta}>Placas del vehículo (opcional)</Text>
        <TextInput
          value={placas}
          onChangeText={(t) => {
            setPlacas(t);
            setAviso("");
          }}
          placeholder="Ej. ELP-1234"
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.entrada}
        />

        <Text style={styles.etiqueta}>Modelo y color (opcional)</Text>
        <TextInput
          value={vehiculo}
          onChangeText={setVehiculo}
          placeholder="Ej. Nissan Versa Blanco"
          style={styles.entrada}
        />

        {aviso !== "" && <Text style={styles.aviso}>{aviso}</Text>}

        <View style={styles.acciones}>
          <Boton
            texto={
              guardando ? "Guardando registro..." : "Crear cuenta y entrar"
            }
            onPress={guardando ? () => {} : manejarRegistro}
          />
          <Boton
            texto="Ya tengo cuenta · Iniciar sesión"
            tipo="secundario"
            onPress={() => router.replace("/login")}
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
    paddingBottom: 50,
  },
  titulo: {
    fontSize: 25,
    fontWeight: "bold",
    color: colores.texto,
  },
  descripcion: {
    marginTop: 6,
    marginBottom: 18,
    fontSize: 15,
    lineHeight: 22,
    color: colores.texto,
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
  filaOpciones: {
    flexDirection: "row",
    gap: 10,
  },
  opcionChip: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colores.estructura,
    backgroundColor: colores.blanco,
    alignItems: "center",
  },
  opcionChipActiva: {
    backgroundColor: colores.verdeUtch,
    borderColor: colores.verdeUtch,
  },
  opcionTexto: {
    fontSize: 15,
    fontWeight: "bold",
    color: colores.texto,
    textAlign: "center",
  },
  opcionTextoActivo: {
    color: colores.blanco,
  },
  listaCarreras: {
    gap: 8,
  },
  tarjetaCarrera: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colores.estructura,
    backgroundColor: colores.blanco,
  },
  tarjetaCarreraActiva: {
    backgroundColor: colores.verdeUtch,
    borderColor: colores.verdeUtch,
  },
  nombreCarrera: {
    fontSize: 15,
    fontWeight: "bold",
    color: colores.texto,
  },
  nombreCarreraActiva: {
    color: colores.blanco,
  },
  metaCarrera: {
    marginTop: 2,
    fontSize: 13,
    color: "#475569",
  },
  metaCarreraActiva: {
    color: "#E2E8F0",
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
  acciones: {
    marginTop: 16,
  },
});
