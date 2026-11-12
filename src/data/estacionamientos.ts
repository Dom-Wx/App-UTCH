export type TipoZona = "Estudiantes" | "Personal";
export type NivelAlerta = "disponible" | "casi_lleno" | "lleno";

// Estado de un cajón en el mapa:
// 0 = libre, 1 = ocupado, 2 = libre para personas con discapacidad
export type Fila = {
  letra: string;
  cajones: number[];
};

export type ZonaBase = {
  id: string;
  nombre: string;
  tipo: TipoZona;
  accesoCercano: "Acceso 1 (Av. Cantera)" | "Acceso 2 (TI / Industrial)";
  edificiosCercanos: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  filasIniciales: Fila[];
};

export type Zona = ZonaBase & {
  filas: Fila[];
  libres: number;
  total: number;
  ocupados: number;
  porcentajeOcupacion: number;
  nivelAlerta: NivelAlerta;
};

export const zonasIniciales: ZonaBase[] = [
  {
    id: "EN",
    nombre: "Estudiantes Norte",
    tipo: "Estudiantes",
    accesoCercano: "Acceso 1 (Av. Cantera)",
    edificiosCercanos: "Edificios P, O, N",
    x: 4,
    y: 4,
    ancho: 25,
    alto: 29,
    filasIniciales: [
      { letra: "A", cajones: [2, 2, 0, 1, 0, 1, 0, 0] },
      { letra: "B", cajones: [1, 0, 0, 1, 0, 0, 1, 0] },
      { letra: "C", cajones: [0, 1, 0, 0, 1, 0, 0, 1] },
      { letra: "D", cajones: [1, 0, 1, 0, 0, 1, 0, 0] },
      { letra: "E", cajones: [0, 0, 1, 1, 0, 0, 1, 0] },
      { letra: "F", cajones: [1, 0, 0, 0, 1, 0, 0, 1] },
    ],
  },
  {
    id: "EC",
    nombre: "Estudiantes Centro",
    tipo: "Estudiantes",
    accesoCercano: "Acceso 1 (Av. Cantera)",
    edificiosCercanos: "Edificios E, M, F",
    x: 37,
    y: 25,
    ancho: 13,
    alto: 15,
    filasIniciales: [
      { letra: "A", cajones: [2, 2, 0, 1, 0, 1] },
      { letra: "B", cajones: [1, 0, 0, 1, 1, 0] },
      { letra: "C", cajones: [0, 1, 1, 0, 1, 0] },
      { letra: "D", cajones: [1, 0, 1, 1, 0, 0] },
    ],
  },
  {
    id: "EO",
    nombre: "Estudiantes Oriente",
    tipo: "Estudiantes",
    accesoCercano: "Acceso 2 (TI / Industrial)",
    edificiosCercanos: "Edificios M, I, L",
    x: 59,
    y: 25,
    ancho: 12,
    alto: 15,
    // Lleno inicialmente (0 libres) para demostrar alerta de saturación total
    filasIniciales: [
      { letra: "A", cajones: [1, 1, 1, 1, 1, 1] },
      { letra: "B", cajones: [1, 1, 1, 1, 1, 1] },
      { letra: "C", cajones: [1, 1, 1, 1, 1, 1] },
      { letra: "D", cajones: [1, 1, 1, 1, 1, 1] },
    ],
  },
  {
    id: "ES",
    nombre: "Estudiantes Sur",
    tipo: "Estudiantes",
    accesoCercano: "Acceso 2 (TI / Industrial)",
    edificiosCercanos: "Edificios I, K, R",
    x: 60,
    y: 69,
    ancho: 35,
    alto: 22,
    // >80% ocupado inicialmente (41 ocupados de 48 = 85%) para demostrar alerta preventiva
    filasIniciales: [
      { letra: "A", cajones: [2, 1, 1, 1, 1, 1, 1, 0] },
      { letra: "B", cajones: [1, 1, 1, 1, 0, 1, 1, 1] },
      { letra: "C", cajones: [1, 1, 0, 1, 1, 1, 1, 1] },
      { letra: "D", cajones: [1, 1, 1, 1, 1, 0, 1, 1] },
      { letra: "E", cajones: [1, 0, 1, 1, 1, 1, 1, 1] },
      { letra: "F", cajones: [1, 1, 1, 1, 1, 1, 0, 1] },
    ],
  },
  {
    id: "PB",
    nombre: "Personal B",
    tipo: "Personal",
    accesoCercano: "Acceso 1 (Av. Cantera)",
    edificiosCercanos: "Edificios A, B, F",
    x: 15,
    y: 49,
    ancho: 10,
    alto: 11,
    filasIniciales: [
      { letra: "A", cajones: [2, 0, 1, 0, 1, 0] },
      { letra: "B", cajones: [1, 0, 1, 1, 0, 0] },
      { letra: "C", cajones: [0, 1, 0, 1, 1, 0] },
    ],
  },
  {
    id: "PG",
    nombre: "Personal G",
    tipo: "Personal",
    accesoCercano: "Acceso 1 (Av. Cantera)",
    edificiosCercanos: "Edificios D, G, C",
    x: 42,
    y: 63,
    ancho: 10,
    alto: 13,
    filasIniciales: [
      { letra: "A", cajones: [2, 1, 0, 1, 0] },
      { letra: "B", cajones: [1, 1, 0, 1, 1] },
      { letra: "C", cajones: [0, 1, 1, 0, 1] },
    ],
  },
  {
    id: "PL",
    nombre: "Personal L (Rectoría)",
    tipo: "Personal",
    accesoCercano: "Acceso 2 (TI / Industrial)",
    edificiosCercanos: "Edificios L, R",
    x: 74,
    y: 26,
    ancho: 14,
    alto: 16,
    filasIniciales: [
      { letra: "A", cajones: [2, 0, 1, 0, 0, 1] },
      { letra: "B", cajones: [0, 1, 0, 1, 0, 0] },
      { letra: "C", cajones: [1, 0, 0, 1, 1, 0] },
      { letra: "D", cajones: [0, 1, 0, 0, 1, 0] },
    ],
  },
];

export function calcularZona(base: ZonaBase, filas: Fila[]): Zona {
  let total = 0;
  let ocupados = 0;

  for (const fila of filas) {
    for (const estado of fila.cajones) {
      total += 1;
      if (estado === 1) {
        ocupados += 1;
      }
    }
  }

  const libres = total - ocupados;
  const porcentajeOcupacion =
    total === 0 ? 100 : Math.round((ocupados / total) * 100);

  let nivelAlerta: NivelAlerta = "disponible";
  if (libres === 0) {
    nivelAlerta = "lleno";
  } else if (porcentajeOcupacion >= 80) {
    nivelAlerta = "casi_lleno";
  }

  return {
    ...base,
    filas,
    libres,
    total,
    ocupados,
    porcentajeOcupacion,
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
  { letra: "M", nombreCorto: "Vinculación", x: 51, y: 24, ancho: 7, alto: 14 },
  { letra: "L", nombreCorto: "Serv.", x: 89, y: 27, ancho: 6, alto: 7 },
  { letra: "R", nombreCorto: "Rectoría", x: 87, y: 37, ancho: 10, alto: 12 },
  { letra: "B", nombreCorto: "U. Médica", x: 26, y: 49, ancho: 7, alto: 12 },
  { letra: "F", nombreCorto: "Cafetería", x: 34, y: 49, ancho: 7, alto: 9 },
  { letra: "D", nombreCorto: "Escolares", x: 43, y: 49, ancho: 8, alto: 11 },
  { letra: "G", nombreCorto: "Negocios", x: 53, y: 55, ancho: 8, alto: 14 },
  { letra: "I", nombreCorto: "TI", x: 65, y: 49, ancho: 9, alto: 14 },
  { letra: "K", nombreCorto: "Industrial", x: 76, y: 49, ancho: 9, alto: 14 },
  { letra: "A", nombreCorto: "Sistemas", x: 16, y: 63, ancho: 8, alto: 13 },
  { letra: "C", nombreCorto: "Pesados", x: 34, y: 61, ancho: 7, alto: 13 },
  { letra: "Q", x: 15, y: 78, ancho: 6, alto: 6 },
  { letra: "H", x: 24, y: 78, ancho: 6, alto: 6 },
];
