# UTCH ParkMate (Fase Beta · Colaborativo)

Aplicación móvil/web colaborativa para el reporte de llegada y disponibilidad de estacionamientos en tiempo real en la **Universidad Tecnológica de Chihuahua (UTCH)**.

> **Nota importante:** Esta aplicación se encuentra en fase beta y en constante desarrollo, por lo que requiere acceso a tu ubicación dentro de la escuela para funcionar correctamente. Si no otorgas este permiso, no podrás utilizar sus funciones.

## Funcionamiento Colaborativo

Originalmente, esta aplicación estaba diseñada para buscar lugares de estacionamiento disponibles mediante monitoreo físico; sin embargo, debido a la dificultad para conseguir el equipo necesario para monitorear los espacios en tiempo real, ahora opera de manera colaborativa:

1. **Permiso de ubicación obligatorio:** Al abrir la app debes autorizar el acceso a tu ubicación dentro de la escuela. Si rechazas o revocas el permiso, las funciones quedan bloqueadas.
2. **Registro:** Inicias sesión o creas una cuenta (como **alumno** o **docente**).
3. **Registro de llegada:** Al llegar y estacionarte en cualquier área de la escuela, lo reportas en la app (por ejemplo: *"Me estacioné en el edificio D"*). El sistema irá sumando el conteo de autos en esa zona (*"Personas en el lugar: 1"*).
4. **Aviso de cupo lleno:** Cuando lleguen más usuarios al mismo estacionamiento y ya no encuentren espacios disponibles, podrán reportarlo para marcar el estacionamiento (ej. del edificio D) como **"lleno"**, registrando así la capacidad real de vehículos de cada estacionamiento.

## Cómo iniciar el proyecto

```bash
npx expo start --web
```

Para abrir el menú interactivo de Expo (Android / iOS / Expo Go):

```bash
npx expo start
```
