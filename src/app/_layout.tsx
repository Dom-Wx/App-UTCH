import { Stack } from "expo-router";
import { EstacionamientoProvider } from "../context/EstacionamientoContext";
import { SesionProvider } from "../context/SesionContext";

export default function RootLayout() {
  return (
    <SesionProvider>
      <EstacionamientoProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </EstacionamientoProvider>
    </SesionProvider>
  );
}
