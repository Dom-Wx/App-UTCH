export type NivelAlerta = "disponible" | "concurrido" | "lleno";

export type Fila = {
  letra: string;
  cajones: number[];
};

export type ZonaBase = {
  id: string;
  nombre: string; // Ej. "Edificio D"
  nombreCortoMapa: string; // Ej. "Edif. D"
  descripcion: string;
  accesoCercano: "Acceso 1 (Av. Cantera)" | "Acceso 2 (TI / Industrial)";
  edificiosCercanos: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
};

export type InfoReporteLleno = {
  reportadoPor: string;
  rol: string;
  hora: string;
  autosAlMomento: number;
};

export type EstadoZonaGuardado = {
  personasEnElLugar: number;
  estaLleno: boolean;
  capacidadRealDetectada: number | null;
  maximoRegistrado: number;
  ultimoReporteLleno: InfoReporteLleno | null;
};

export type Zona = ZonaBase & {
  personasEnElLugar: number;
  estaLleno: boolean;
  capacidadRealDetectada: number | null;
  maximoRegistrado: number;
  ultimoReporteLleno: InfoReporteLleno | null;
  nivelAlerta: NivelAlerta;
};

export const zonasIniciales: ZonaBase[] = [
  {
    id: "ED",
    nombre: "Edificio D",
    nombreCortoMapa: "Edif. D",
    descripcion: "Servicios Escolares, Cafetería y explanada central",
    accesoCercano: "Acceso 1 (Av. Cantera)",
    edificiosCercanos: "Edificios D, F, G",
    x: 41,
    y: 62,
    ancho: 13,
    alto: 15,
  },
  {
    id: "EP",
    nombre: "Edificio P y O",
    nombreCortoMapa: "Edif. P/O",
    descripcion: "Mecatrónica, Energías Renovables y Biblioteca",
    accesoCercano: "Acceso 1 (Av. Cantera)",
    edificiosCercanos: "Edificios P, O, N",
    x: 4,
    y: 4,
    ancho: 25,
    alto: 29,
  },
  {
    id: "EM",
    nombre: "Edificio E y M",
    nombreCortoMapa: "Edif. E/M",
    descripcion: "Administración, Vinculación y Centro",
    accesoCercano: "Acceso 1 (Av. Cantera)",
    edificiosCercanos: "Edificios E, M, F",
    x: 37,
    y: 25,
    ancho: 14,
    alto: 15,
  },
  {
    id: "EI",
    nombre: "Edificio I y K",
    nombreCortoMapa: "Edif. I/K",
    descripcion: "Tecnologías de la Información e Ing. Industrial",
    accesoCercano: "Acceso 2 (TI / Industrial)",
    edificiosCercanos: "Edificios I, K",
    x: 60,
    y: 69,
    ancho: 35,
    alto: 21,
  },
  {
    id: "EA",
    nombre: "Edificio A, B y C",
    nombreCortoMapa: "Edif. A/B/C",
    descripcion: "Sistemas, Unidad Médica y Laboratorios Pesados",
    accesoCercano: "Acceso 1 (Av. Cantera)",
    edificiosCercanos: "Edificios A, B, C",
    x: 15,
    y: 49,
    ancho: 10,
    alto: 12,
  },
  {
    id: "ER",
    nombre: "Edificio R y L",
    nombreCortoMapa: "Edif. R/L",
    descripcion: "Rectoría, Docentes y Servicios",
    accesoCercano: "Acceso 2 (TI / Industrial)",
    edificiosCercanos: "Edificios R, L, M",
    x: 72,
    y: 25,
    ancho: 15,
    alto: 16,
  },
];

export function estadoInicialZona(): EstadoZonaGuardado {
  return {
    personasEnElLugar: 0,
    estaLleno: false,
    capacidadRealDetectada: null,
    maximoRegistrado: 0,
    ultimoReporteLleno: null,
  };
}

export function calcularZona(
  base: ZonaBase,
  estado?: Partial<EstadoZonaGuardado>
): Zona {
  const personasEnElLugar = Math.max(0, estado?.personasEnElLugar ?? 0);
  const estaLleno = Boolean(estado?.estaLleno);
  const capacidadRealDetectada =
    typeof estado?.capacidadRealDetectada === "number" &&
      estado.capacidadRealDetectada > 0
      ? estado.capacidadRealDetectada
      : null;
  const maximoRegistrado = Math.max(
    personasEnElLugar,
    estado?.maximoRegistrado ?? 0,
    capacidadRealDetectada ?? 0
  );

  let nivelAlerta: NivelAlerta = "disponible";
  if (estaLleno) {
    nivelAlerta = "lleno";
  } else if (
    capacidadRealDetectada !== null &&
    personasEnElLugar >= Math.max(1, Math.floor(capacidadRealDetectada * 0.8))
  ) {
    nivelAlerta = "concurrido";
  } else if (personasEnElLugar >= 10) {
    nivelAlerta = "concurrido";
  }

  return {
    ...base,
    personasEnElLugar,
    estaLleno,
    capacidadRealDetectada,
    maximoRegistrado,
    ultimoReporteLleno: estado?.ultimoReporteLleno ?? null,
    nivelAlerta,
  };
}

// Edificios del campus con proporciones y nombre corto real
export type Edificio = {
  letra: string;
  nombreCorto?: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
};

export const edificios: Edificio[] = [
  { letra: "P", nombreCorto: "Mecatrónica", x: 7, y: 8, ancho: 9, alto: 12 },
  { letra: "O", nombreCorto: "Biblioteca", x: 18, y: 10, ancho: 9, alto: 11 },
  { letra: "S", nombreCorto: "Talleres", x: 30, y: 4, ancho: 7, alto: 9 },
  { letra: "J", nombreCorto: "Serv. Grales", x: 30, y: 15, ancho: 6, alto: 7 },
  { letra: "N", nombreCorto: "Mantto.", x: 18, y: 24, ancho: 8, alto: 11 },
  { letra: "E", nombreCorto: "Admón.", x: 29, y: 25, ancho: 7, alto: 13 },
  { letra: "M", nombreCorto: "Vinculación", x: 52, y: 24, ancho: 7, alto: 14 },
  { letra: "L", nombreCorto: "Serv.", x: 89, y: 27, ancho: 6, alto: 7 },
  { letra: "R", nombreCorto: "Rectoría", x: 87, y: 37, ancho: 10, alto: 12 },
  { letra: "B", nombreCorto: "U. Médica", x: 26, y: 49, ancho: 7, alto: 12 },
  { letra: "F", nombreCorto: "Cafetería", x: 34, y: 49, ancho: 7, alto: 9 },
  { letra: "D", nombreCorto: "Escolares", x: 43, y: 48, ancho: 9, alto: 12 },
  { letra: "G", nombreCorto: "Negocios", x: 55, y: 55, ancho: 8, alto: 14 },
  { letra: "I", nombreCorto: "TI", x: 65, y: 49, ancho: 9, alto: 14 },
  { letra: "K", nombreCorto: "Industrial", x: 76, y: 49, ancho: 9, alto: 14 },
  { letra: "A", nombreCorto: "Sistemas", x: 16, y: 63, ancho: 8, alto: 13 },
  { letra: "C", nombreCorto: "Pesados", x: 32, y: 61, ancho: 7, alto: 13 },
  { letra: "Q", x: 15, y: 78, ancho: 6, alto: 6 },
  { letra: "H", x: 24, y: 78, ancho: 6, alto: 6 },
];
