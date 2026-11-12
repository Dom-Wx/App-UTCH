import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colores } from "../constants/colores";
import { useEstacionamiento } from "../context/EstacionamientoContext";
import { useSesion } from "../context/SesionContext";
import Boton from "./Boton";

type Props = {
  zonaPreseleccionadaId?: string;
};

const MOTIVOS_RAPIDOS = [
  "Se estacionó mal ocupando dos cajones",
  "Obstruyendo salida o circulación",
  "Estacionado en rampa o lugar prohibido",
];

export default function SeccionReportesMalEstacionado({
  zonaPreseleccionadaId,
}: Props) {
  const { usuario } = useSesion();
  const { zonas, reportesMalEstacionado, publicarReporteMalEstacionado } =
    useEstacionamiento();

  const [zonaId, setZonaId] = useState(zonaPreseleccionadaId ?? "ED");
  const [motivo, setMotivo] = useState("");
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [avisoError, setAvisoError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [publicando, setPublicando] = useState(false);

  async function tomarFotoCamara() {
    setAvisoError("");
    setMensajeExito("");
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        setAvisoError(
          "Permite el acceso a la cámara o usa 'Subir foto' para adjuntar la evidencia."
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.45,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets[0]) {
        const asset = resultado.assets[0];
        const uriFinal = asset.base64
          ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
          : asset.uri;
        setFotoUri(uriFinal);
      }
    } catch {
      // En algunos navegadores de escritorio launchCameraAsync abre selector de archivos
      elegirFotoGaleria();
    }
  }

  async function elegirFotoGaleria() {
    setAvisoError("");
    setMensajeExito("");
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.45,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets[0]) {
        const asset = resultado.assets[0];
        const uriFinal = asset.base64
          ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
          : asset.uri;
        setFotoUri(uriFinal);
      }
    } catch {
      setAvisoError("No fue posible cargar la foto seleccionada.");
    }
  }

  async function enviarReporte() {
    if (!usuario) return;
    setAvisoError("");
    setMensajeExito("");
    setPublicando(true);

    try {
      const res = await publicarReporteMalEstacionado({
        zonaId,
        motivo,
        fotoUri: fotoUri ?? "",
        rolReportante: usuario.rol,
      });

      if (!res.ok) {
        setAvisoError(res.error);
        return;
      }

      setMotivo("");
      setFotoUri(null);
      setMensajeExito(res.mensaje);
    } catch {
      setAvisoError("No se pudo publicar el reporte. Intenta de nuevo.");
    } finally {
      setPublicando(false);
    }
  }

  const reportesFiltrados = zonaPreseleccionadaId
    ? reportesMalEstacionado.filter((r) => r.zonaId === zonaPreseleccionadaId)
    : reportesMalEstacionado;

  return (
    <View style={styles.contenedor}>
      <Text style={styles.subtitulo}>
        Reportes de la comunidad (Alguien se estacionó mal)
      </Text>
      <Text style={styles.avisoPrivacidad}>
        Por seguridad, nunca se publican los carros de quienes llegan a
        estacionarse normalmente. Esta sección es únicamente para tomar foto y
        reportar cuando alguien se estacionó mal para que todos lo vean.
      </Text>

      {/* Formulario para reportar un carro mal estacionado con foto */}
      <View style={styles.cajaFormulario}>
        <Text style={styles.formTitulo}>
          Reportar vehículo mal estacionado con foto
        </Text>

        {!zonaPreseleccionadaId && (
          <>
            <Text style={styles.etiqueta}>¿En qué estacionamiento está?</Text>
            <View style={styles.chipsZonas}>
              {zonas.map((z) => {
                const activa = z.id === zonaId;
                return (
                  <TouchableOpacity
                    key={z.id}
                    onPress={() => setZonaId(z.id)}
                    style={[styles.chipZona, activa && styles.chipZonaActiva]}
                  >
                    <Text
                      style={[
                        styles.chipZonaTexto,
                        activa && styles.chipZonaTextoActivo,
                      ]}
                    >
                      {z.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.etiqueta}>¿Por qué está mal estacionado?</Text>
        <View style={styles.chipsMotivos}>
          {MOTIVOS_RAPIDOS.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => {
                setMotivo(m);
                setAvisoError("");
              }}
              style={[
                styles.chipMotivo,
                motivo === m && styles.chipMotivoActivo,
              ]}
            >
              <Text
                style={[
                  styles.chipMotivoTexto,
                  motivo === m && styles.chipMotivoTextoActivo,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          value={motivo}
          onChangeText={(t: string) => {
            setMotivo(t);
            setAvisoError("");
          }}
          placeholder="Describe qué pasó (ej. Invadió dos cajones en el Edificio D)"
          style={styles.entrada}
        />

        {/* Botones para tomar o elegir foto */}
        <Text style={styles.etiqueta}>Evidencia fotográfica</Text>
        <View style={styles.filaFotoBotones}>
          <TouchableOpacity
            style={styles.btnCamara}
            onPress={tomarFotoCamara}
          >
            <Text style={styles.btnCamaraTexto}>Tomar foto con cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnGaleria}
            onPress={elegirFotoGaleria}
          >
            <Text style={styles.btnGaleriaTexto}>Subir / Elegir foto</Text>
          </TouchableOpacity>
        </View>

        {fotoUri !== null && (
          <View style={styles.previewBox}>
            <Image
              source={{ uri: fotoUri }}
              style={styles.imagenPreview}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.btnQuitarFoto}
              onPress={() => setFotoUri(null)}
            >
              <Text style={styles.btnQuitarFotoTexto}>Cambiar o quitar foto</Text>
            </TouchableOpacity>
          </View>
        )}

        {mensajeExito !== "" && (
          <View style={styles.cajaExito}>
            <Text style={styles.textoExito}>{mensajeExito}</Text>
          </View>
        )}
        {avisoError !== "" && <Text style={styles.aviso}>{avisoError}</Text>}

        <Boton
          texto={
            publicando
              ? "Publicando reporte..."
              : "Publicar foto y reporte para que todos lo vean"
          }
          tipo="alerta"
          onPress={publicando ? () => {} : enviarReporte}
        />
      </View>

      {/* Lista pública de reportes con foto */}
      <Text style={styles.listaTitulo}>
        Fotos recientes de vehículos mal estacionados
      </Text>
      {reportesFiltrados.length === 0 ? (
        <View style={styles.sinReportesBox}>
          <Text style={styles.sinReportesTexto}>
            No hay reportes de vehículos mal estacionados en este momento. Si
            alguien se estaciona mal, tómale foto arriba para que toda la
            comunidad lo vea.
          </Text>
        </View>
      ) : (
        reportesFiltrados.map((rep) => (
          <View key={rep.id} style={styles.cardReporte}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeZona}>
                <Text style={styles.badgeZonaTexto}>
                  Estacionamiento {rep.zonaNombre}
                </Text>
              </View>
              <Text style={styles.cardHora}>
                Reportado por {rep.rolReportante} · {rep.hora}
              </Text>
            </View>

            <Text style={styles.cardMotivo}>{rep.motivo}</Text>

            <Image
              source={{ uri: rep.fotoUri }}
              style={styles.imagenReporte}
              resizeMode="cover"
            />
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginTop: 6,
  },
  subtitulo: {
    fontSize: 21,
    fontWeight: "bold",
    color: colores.texto,
  },
  avisoPrivacidad: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 13.5,
    lineHeight: 20,
    color: "#475569",
  },
  cajaFormulario: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colores.blanco,
    borderWidth: 1.5,
    borderColor: colores.estructura,
    marginBottom: 20,
  },
  formTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: colores.rojo,
    marginBottom: 6,
  },
  etiqueta: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "bold",
    color: colores.texto,
  },
  chipsZonas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipZona: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colores.estructura,
    backgroundColor: "#F8FAFC",
  },
  chipZonaActiva: {
    backgroundColor: colores.verdeUtch,
    borderColor: colores.verdeUtch,
  },
  chipZonaTexto: {
    fontSize: 13,
    fontWeight: "bold",
    color: colores.texto,
  },
  chipZonaTextoActivo: {
    color: colores.blanco,
  },
  chipsMotivos: {
    gap: 6,
    marginBottom: 8,
  },
  chipMotivo: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colores.estructura,
    backgroundColor: "#F8FAFC",
  },
  chipMotivoActivo: {
    backgroundColor: "#FEE2E2",
    borderColor: colores.rojo,
  },
  chipMotivoTexto: {
    fontSize: 13,
    color: colores.texto,
    fontWeight: "600",
  },
  chipMotivoTextoActivo: {
    color: colores.rojo,
    fontWeight: "bold",
  },
  entrada: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colores.estructura,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    color: colores.texto,
    fontSize: 15,
  },
  filaFotoBotones: {
    flexDirection: "row",
    gap: 10,
  },
  btnCamara: {
    flex: 1,
    backgroundColor: colores.verdeUtch,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  btnCamaraTexto: {
    color: colores.blanco,
    fontSize: 14,
    fontWeight: "bold",
  },
  btnGaleria: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  btnGaleriaTexto: {
    color: colores.texto,
    fontSize: 14,
    fontWeight: "bold",
  },
  previewBox: {
    marginTop: 12,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colores.estructura,
  },
  imagenPreview: {
    width: "100%",
    height: 210,
    backgroundColor: "#0F172A",
  },
  btnQuitarFoto: {
    paddingVertical: 8,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
  },
  btnQuitarFotoTexto: {
    color: colores.rojo,
    fontSize: 13,
    fontWeight: "bold",
  },
  cajaExito: {
    marginTop: 12,
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
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    color: colores.rojo,
    fontSize: 14,
    fontWeight: "bold",
  },
  listaTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 10,
  },
  sinReportesBox: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.estructura,
  },
  sinReportesTexto: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  cardReporte: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colores.blanco,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  badgeZona: {
    backgroundColor: colores.rojo,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeZonaTexto: {
    color: colores.blanco,
    fontSize: 12,
    fontWeight: "bold",
  },
  cardHora: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  cardMotivo: {
    fontSize: 16,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 10,
  },
  imagenReporte: {
    width: "100%",
    height: 230,
    borderRadius: 10,
    backgroundColor: "#0F172A",
  },
});

