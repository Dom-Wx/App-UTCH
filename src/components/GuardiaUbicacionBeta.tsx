import { usePathname } from "expo-router";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colores } from "../constants/colores";
import { useSesion } from "../context/SesionContext";
import Boton from "./Boton";

export default function GuardiaUbicacionBeta({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const {
    permisoUbicacion,
    solicitandoUbicacion,
    solicitarPermisoUbicacion,
    otorgarPermisoCampusBeta,
    denegarPermisoUbicacion,
  } = useSesion();

  // Permitir navegar a /login y /registro para que el usuario pueda crear su cuenta o iniciar sesión
  const enPantallaAuth = pathname === "/login" || pathname === "/registro";

  // Si aún no ha otorgado el permiso de ubicación y no está en /login o /registro,
  // bloqueamos las funciones mostrando la Nota importante de Fase Beta.
  if (permisoUbicacion !== "otorgado" && !enPantallaAuth) {
    return (
      <ScrollView
        style={styles.pantallaBloqueo}
        contentContainerStyle={styles.contenidoBloqueo}
      >
        <View style={styles.encabezadoBeta}>
          <View style={styles.badgeBeta}>
            <Text style={styles.badgeBetaTexto}>FASE BETA · UTCH PARKMATE</Text>
          </View>
          <Text style={styles.tituloPrincipal}>
            Permiso de Ubicación en la Escuela Requerido
          </Text>
        </View>

        {/* Nota importante obligatoria */}
        <View style={styles.cajaNotaImportante}>
          <Text style={styles.notaTitulo}>Nota importante:</Text>
          <Text style={styles.notaTexto}>
            Esta aplicación se encuentra en fase beta y en constante desarrollo,
            por lo que requiere acceso a tu ubicación dentro de la escuela para
            funcionar correctamente. Si no otorgas este permiso, no podrás
            utilizar sus funciones.
          </Text>
        </View>

        {/* Mensaje de bloqueo cuando el usuario rechaza el permiso */}
        {permisoUbicacion === "denegado" && (
          <View style={styles.alertaDenegado}>
            <Text style={styles.alertaDenegadoTitulo}>
              Funciones bloqueadas por falta de permiso de ubicación
            </Text>
            <Text style={styles.alertaDenegadoTexto}>
              No otorgaste el permiso de ubicación. Todas las funciones de la
              aplicación están bloqueadas hasta que permitas el acceso a tu
              ubicación dentro de la escuela.
            </Text>
          </View>
        )}

        {/* Explicación del modelo colaborativo */}
        <View style={styles.cajaColaborativa}>
          <Text style={styles.colaborativaSubtitulo}>
            Funcionamiento colaborativo
          </Text>
          <Text style={styles.colaborativaParrafo}>
            Originalmente, esta aplicación estaba diseñada para buscar lugares
            de estacionamiento disponibles; sin embargo, debido a la dificultad
            para conseguir el equipo necesario para monitorear los espacios en
            tiempo real, su funcionamiento ha cambiado.
          </Text>

          <Text style={styles.colaborativaSubtitulo}>
            Ahora opera de manera colaborativa:
          </Text>

          <View style={styles.pasoItem}>
            <Text style={styles.pasoNumero}>1. Registro:</Text>
            <Text style={styles.pasoTexto}>
              Inicias sesión o creas una cuenta (como alumno o docente) para
              desbloquear las funciones.
            </Text>
          </View>

          <View style={styles.pasoItem}>
            <Text style={styles.pasoNumero}>2. Registro de llegada:</Text>
            <Text style={styles.pasoTexto}>
              Al llegar y estacionarte en cualquier área de la escuela, lo
              reportas en la app (por ejemplo: &quot;Me estacioné en el edificio
              D&quot;). El sistema irá sumando el conteo de autos en esa zona
              (&quot;Personas en el lugar: 1&quot;).
            </Text>
          </View>

          <View style={styles.pasoItem}>
            <Text style={styles.pasoNumero}>3. Aviso de cupo lleno:</Text>
            <Text style={styles.pasoTexto}>
              Cuando lleguen más usuarios al mismo estacionamiento y ya no
              encuentren espacios disponibles, podrán reportarlo para marcar el
              estacionamiento del edificio D como &quot;lleno&quot;.
            </Text>
          </View>

          <Text style={styles.colaborativaCierre}>
            De esta manera, la plataforma actualizará su información en tiempo
            real según el uso de la comunidad y permitirá conocer la capacidad
            real de vehículos de cada estacionamiento.
          </Text>
        </View>

        {/* Botones de permiso */}
        <View style={styles.accionesPermiso}>
          {solicitandoUbicacion ? (
            <View style={styles.cargandoBox}>
              <ActivityIndicator size="small" color={colores.verdeUtch} />
              <Text style={styles.cargandoTexto}>
                Verificando ubicación dentro de la escuela...
              </Text>
            </View>
          ) : (
            <>
              <Boton
                texto="Otorgar permiso de ubicación en la escuela"
                onPress={solicitarPermisoUbicacion}
              />
              {permisoUbicacion === "denegado" && (
                <Boton
                  texto="Autorizar ubicación en Campus UTCH (Modo Beta)"
                  tipo="secundario"
                  onPress={otorgarPermisoCampusBeta}
                />
              )}
              <TouchableOpacity
                style={styles.btnRechazar}
                onPress={denegarPermisoUbicacion}
              >
                <Text style={styles.btnRechazarTexto}>
                  No otorgar permiso (mantener funciones bloqueadas)
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    );
  }

  return <View style={styles.contenedorActivo}>{children}</View>;
}

const styles = StyleSheet.create({
  pantallaBloqueo: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenidoBloqueo: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  encabezadoBeta: {
    marginBottom: 16,
  },
  badgeBeta: {
    alignSelf: "flex-start",
    backgroundColor: colores.verdeUtch,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeBetaTexto: {
    color: colores.blanco,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  tituloPrincipal: {
    fontSize: 26,
    fontWeight: "bold",
    color: colores.texto,
  },
  cajaNotaImportante: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colores.naranjaFondo,
    borderWidth: 2,
    borderColor: colores.naranjaAlerta,
    marginBottom: 16,
  },
  notaTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 4,
  },
  notaTexto: {
    fontSize: 15,
    lineHeight: 22,
    color: "#78350F",
    fontWeight: "600",
  },
  alertaDenegado: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    borderWidth: 2,
    borderColor: colores.rojo,
    marginBottom: 16,
  },
  alertaDenegadoTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: colores.rojo,
    marginBottom: 4,
  },
  alertaDenegadoTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: "#991B1B",
  },
  cajaColaborativa: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: colores.blanco,
    borderWidth: 1,
    borderColor: colores.estructura,
    marginBottom: 16,
  },
  colaborativaSubtitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: colores.verdeUtch,
    marginBottom: 6,
    marginTop: 4,
  },
  colaborativaParrafo: {
    fontSize: 14,
    lineHeight: 21,
    color: colores.texto,
    marginBottom: 12,
  },
  pasoItem: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 4,
    borderLeftColor: colores.verdeUtch,
  },
  pasoNumero: {
    fontSize: 14,
    fontWeight: "bold",
    color: colores.texto,
    marginBottom: 2,
  },
  pasoTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },
  colaborativaCierre: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colores.texto,
  },
  accionesPermiso: {
    marginTop: 4,
  },
  cargandoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  cargandoTexto: {
    fontSize: 15,
    fontWeight: "bold",
    color: colores.verdeUtch,
  },
  btnRechazar: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnRechazarTexto: {
    fontSize: 14,
    fontWeight: "bold",
    color: colores.rojo,
    textDecorationLine: "underline",
  },
  contenedorActivo: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  barraUbicacionActiva: {
    backgroundColor: "#064E3B",
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  barraInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  indicadorPunto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  barraTexto: {
    color: "#ECFDF5",
    fontSize: 12,
    fontWeight: "bold",
  },
  btnRevocar: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  btnRevocarTexto: {
    color: "#FEE2E2",
    fontSize: 11,
    fontWeight: "bold",
  },
  contenidoApp: {
    flex: 1,
  },
});
