import { Stack } from "expo-router";
import GuardiaUbicacionBeta from "../components/GuardiaUbicacionBeta";
import { EstacionamientoProvider } from "../context/EstacionamientoContext";
import { SesionProvider } from "../context/SesionContext";

export default function RootLayout() {
  return (
    <SesionProvider>
      <EstacionamientoProvider>
        <GuardiaUbicacionBeta>
          <Stack screenOptions={{ headerShown: false }} />
        </GuardiaUbicacionBeta>
      </EstacionamientoProvider>
    </SesionProvider>
  );
}
