import type { Criticidad } from "./mineflow-data";
import { CRITICIDAD_ORDEN } from "./mineflow-data";

export type Ciclo = {
  id: string;
  camion: string;
  pala: string | null;
  operador_camion: string | null;
  operador_pala: string | null;
  material: string | null;
  grupo_material: string | null;
  es_mineral: boolean | null;
  lugar_carga: string | null;
  unidad_carga: string | null;
  toneladas: number | null;
  capacidad: number | null;
  ts_asignacion: string | null;
  ts_llegada: string | null;
  ts_carguio: string | null;
  ts_lleno: string | null;
  espera_cola: number | null;
  tiempo_aculatamiento: number | null;
  tiempo_carguio: number | null;
  ociosidad_pala: number | null;
  ociosidad_camion: number | null;
  viaje_vacio: number | null;
  viaje_vacio_esperado: number | null;
  distancia: number | null;
};

export type Turno = {
  id: string;
  nombre_turno: string;
  grupo: string | null;
  shift_id: string | null;
  inicio: string | null;
  fin: string | null;
  archivo: string;
  filas: number;
  activo: boolean;
  created_at: string;
};

export type CicloNuevo = Omit<Ciclo, "id">;

export type TurnoNuevo = {
  nombre_turno: string;
  grupo: string | null;
  shift_id: string | null;
  inicio: string | null;
  fin: string | null;
  archivo: string;
  filas: number;
};

/* ---------- formato ---------- */

export function minutos(segundos: number | null | undefined) {
  if (segundos == null) return "—";
  return `${Math.round(segundos / 60)} min`;
}

export function hora(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function numero(valor: number | null | undefined, decimales = 0) {
  if (valor == null) return "—";
  return valor.toLocaleString("es-CL", { maximumFractionDigits: decimales });
}

/* ---------- lectura del Excel DISPATCH ---------- */

const COLUMNAS_CLAVE = ["Truck", "Excav", "Tons", "QueueTime"];

function texto(v: unknown): string | null {
  if (v == null || v === "") return null;
  return String(v).trim() || null;
}

function entero(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function decimal(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function fecha(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

type Fila = Record<string, unknown>;

export type LecturaDispatch = { turno: TurnoNuevo; ciclos: CicloNuevo[] };

/** Convierte las filas de la hoja StdShiftLoads en turno + ciclos. */
export function mapearFilas(filas: Fila[], archivo: string): LecturaDispatch {
  const utiles = filas.filter((f) => texto(f["Truck"]));
  if (utiles.length === 0) {
    throw new Error("La hoja de ciclos no tiene filas con camiones (columna Truck).");
  }

  const ciclos: CicloNuevo[] = utiles.map((f) => ({
    camion: texto(f["Truck"]) ?? "—",
    pala: texto(f["Excav"]),
    operador_camion: texto(f["TruckOperatorName"]),
    operador_pala: texto(f["ExcavOperatorName"]),
    material: texto(f["MaterialType"]),
    grupo_material: texto(f["MaterialGroupName"]),
    es_mineral: entero(f["IsOre"]) === 1,
    lugar_carga: texto(f["LoadLocation"]),
    unidad_carga: texto(f["LoadLocationUnit"]),
    toneladas: decimal(f["Tons"]),
    capacidad: decimal(f["TruckSize"]),
    ts_asignacion: fecha(f["AssignTimestamp"]),
    ts_llegada: fecha(f["ArriveTimestamp"]),
    ts_carguio: fecha(f["LoadingTimestamp"]),
    ts_lleno: fecha(f["FullTimestamp"]),
    espera_cola: entero(f["QueueTime"]),
    tiempo_aculatamiento: entero(f["SpotTime"]),
    tiempo_carguio: entero(f["LoadingTime"]),
    ociosidad_pala: entero(f["ShovelIdleTime"]),
    ociosidad_camion: entero(f["TruckIdleTime"]),
    viaje_vacio: entero(f["EmptyTravelDuration"]),
    viaje_vacio_esperado: entero(f["ExpectedEmptyTravelDuration"]),
    distancia: entero(f["TotalDistance"]),
  }));

  const primera = utiles[0] as Fila;
  return {
    turno: {
      nombre_turno: texto(primera["FullShiftName"]) ?? "Turno sin nombre",
      grupo: texto(primera["Crew"]),
      shift_id: texto(primera["ShiftId"]),
      inicio: fecha(primera["ShiftStartTimestamp"]),
      fin: fecha(primera["ShiftEndTimestamp"]),
      archivo,
      filas: ciclos.length,
    },
    ciclos,
  };
}

/** Lee un archivo .xlsx/.csv de DISPATCH en el navegador. */
export async function leerArchivoDispatch(archivo: File): Promise<LecturaDispatch> {
  const XLSX = await import("xlsx");
  const libro = XLSX.read(await archivo.arrayBuffer(), { cellDates: true });

  const nombreHoja =
    libro.SheetNames.find((n) => n.toLowerCase().includes("shiftloads")) ??
    libro.SheetNames.find((n) => {
      const hoja = libro.Sheets[n];
      if (!hoja) return false;
      const cabecera = XLSX.utils.sheet_to_json<Fila>(hoja, { defval: null })[0];
      return cabecera ? COLUMNAS_CLAVE.every((c) => c in cabecera) : false;
    });

  if (!nombreHoja) {
    throw new Error("No se encontró la hoja de ciclos de carguío (StdShiftLoads) en el archivo.");
  }
  const hoja = libro.Sheets[nombreHoja];
  if (!hoja) throw new Error("La hoja de ciclos está vacía.");

  const filas = XLSX.utils.sheet_to_json<Fila>(hoja, { defval: null, raw: true });
  return mapearFilas(filas, archivo.name);
}

/* ---------- resúmenes por equipo ---------- */

export type ResumenPala = {
  pala: string;
  ciclos: number;
  toneladas: number;
  camiones: number;
  esperaPromedio: number;
  ociosidad: number;
  ultimaCarga: string | null;
  estado: "Operativa" | "En riesgo" | "Detenida";
};

export type ResumenCamion = {
  camion: string;
  ciclos: number;
  toneladas: number;
  colaTotal: number;
  carguioPromedio: number;
  palaPrincipal: string;
  operador: string;
  ultimoCiclo: string | null;
};

function promedio(valores: number[]) {
  if (valores.length === 0) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function masFrecuente(valores: string[]) {
  const cuenta = new Map<string, number>();
  for (const v of valores) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

export function resumirPalas(ciclos: Ciclo[]): ResumenPala[] {
  const grupos = new Map<string, Ciclo[]>();
  for (const c of ciclos) {
    if (!c.pala) continue;
    const lista = grupos.get(c.pala) ?? [];
    lista.push(c);
    grupos.set(c.pala, lista);
  }

  return [...grupos.entries()]
    .map(([pala, lista]) => {
      const esperaPromedio = promedio(lista.map((c) => c.espera_cola ?? 0));
      const ociosidad = lista.reduce((a, c) => a + (c.ociosidad_pala ?? 0), 0);
      const ultimaCarga = lista
        .map((c) => c.ts_lleno)
        .filter((v): v is string => Boolean(v))
        .sort()
        .at(-1) ?? null;
      const estado: ResumenPala["estado"] =
        ociosidad >= 3600 ? "Detenida" : ociosidad >= 900 || esperaPromedio >= 600 ? "En riesgo" : "Operativa";

      return {
        pala,
        ciclos: lista.length,
        toneladas: lista.reduce((a, c) => a + (c.toneladas ?? 0), 0),
        camiones: new Set(lista.map((c) => c.camion)).size,
        esperaPromedio,
        ociosidad,
        ultimaCarga,
        estado,
      };
    })
    .sort((a, b) => b.toneladas - a.toneladas);
}

export function resumirCamiones(ciclos: Ciclo[]): ResumenCamion[] {
  const grupos = new Map<string, Ciclo[]>();
  for (const c of ciclos) {
    const lista = grupos.get(c.camion) ?? [];
    lista.push(c);
    grupos.set(c.camion, lista);
  }

  return [...grupos.entries()]
    .map(([camion, lista]) => ({
      camion,
      ciclos: lista.length,
      toneladas: lista.reduce((a, c) => a + (c.toneladas ?? 0), 0),
      colaTotal: lista.reduce((a, c) => a + (c.espera_cola ?? 0), 0),
      carguioPromedio: promedio(lista.map((c) => c.tiempo_carguio ?? 0)),
      palaPrincipal: masFrecuente(lista.map((c) => c.pala ?? "—")),
      operador: masFrecuente(lista.map((c) => c.operador_camion ?? "—")),
      ultimoCiclo: lista.map((c) => c.ts_lleno).filter((v): v is string => Boolean(v)).sort().at(-1) ?? null,
    }))
    .sort((a, b) => b.toneladas - a.toneladas);
}

/* ---------- alertas derivadas de los ciclos ---------- */

export type EstadoAlertaDb = "Nueva" | "En revisión" | "Resuelta" | "Descartada";

export type AlertaDispatch = {
  clave: string;
  titulo: string;
  descripcion: string;
  criticidad: Criticidad;
  regla: string;
  equipo: string;
  tipoEquipo: "Pala" | "Camión";
  zona: string;
  ts: string | null;
  ciclo: Ciclo;
};

export const REGLAS_DISPATCH = [
  { id: "cola-critica", nombre: "Cola de camión sobre 15 min", criticidad: "Crítica" as Criticidad, umbral: "> 15 min" },
  { id: "pala-detenida", nombre: "Pala esperando camión", criticidad: "Crítica" as Criticidad, umbral: "> 15 min" },
  { id: "cola-alta", nombre: "Cola de camión sobre 8 min", criticidad: "Alta" as Criticidad, umbral: "> 8 min" },
  { id: "pala-ociosa", nombre: "Ociosidad de pala", criticidad: "Alta" as Criticidad, umbral: "> 5 min" },
  { id: "carguio-lento", nombre: "Carguío lento", criticidad: "Alta" as Criticidad, umbral: "> 7 min" },
  { id: "sin-tonelaje", nombre: "Ciclo sin tonelaje", criticidad: "Media" as Criticidad, umbral: "0 t" },
  { id: "viaje-vacio", nombre: "Viaje vacío sobre lo esperado", criticidad: "Media" as Criticidad, umbral: "> 50%" },
  { id: "sobrecarga", nombre: "Sobrecarga de camión", criticidad: "Baja" as Criticidad, umbral: "> 10%" },
];

const NOMBRE_REGLA = new Map(REGLAS_DISPATCH.map((r) => [r.id, r.nombre]));

function alerta(
  ciclo: Ciclo,
  reglaId: string,
  criticidad: Criticidad,
  titulo: string,
  descripcion: string,
  equipo: string,
  tipoEquipo: "Pala" | "Camión",
): AlertaDispatch {
  return {
    clave: `${reglaId}:${ciclo.id}`,
    titulo,
    descripcion,
    criticidad,
    regla: NOMBRE_REGLA.get(reglaId) ?? reglaId,
    equipo,
    tipoEquipo,
    zona: ciclo.lugar_carga ?? "Sin lugar de carga",
    ts: ciclo.ts_lleno ?? ciclo.ts_llegada,
    ciclo,
  };
}

export function generarAlertas(ciclos: Ciclo[]): AlertaDispatch[] {
  const lista: AlertaDispatch[] = [];

  for (const c of ciclos) {
    const pala = c.pala ?? "Pala sin registro";
    const cola = c.espera_cola ?? 0;
    const ociosa = c.ociosidad_pala ?? 0;
    const carguio = c.tiempo_carguio ?? 0;

    if (cola >= 900) {
      lista.push(
        alerta(c, "cola-critica", "Crítica", `${c.camion} esperó ${minutos(cola)} en cola en ${pala}`,
          `El camión ${c.camion} acumuló ${minutos(cola)} de cola antes de cargar en ${pala}. Revisar la distribución de flota hacia esa pala.`,
          c.camion, "Camión"),
      );
    } else if (cola >= 480) {
      lista.push(
        alerta(c, "cola-alta", "Alta", `Cola de ${minutos(cola)} para ${c.camion} en ${pala}`,
          `Espera de ${minutos(cola)} sobre el objetivo de 8 min. Evaluar redistribuir camiones a otra pala.`,
          c.camion, "Camión"),
      );
    }

    if (ociosa >= 900) {
      lista.push(
        alerta(c, "pala-detenida", "Crítica", `${pala} detenida ${minutos(ociosa)} sin camión`,
          `${pala} estuvo ${minutos(ociosa)} sin camión disponible antes del ciclo de ${c.camion}. Pérdida directa de productividad.`,
          pala, "Pala"),
      );
    } else if (ociosa >= 300) {
      lista.push(
        alerta(c, "pala-ociosa", "Alta", `${pala} con ${minutos(ociosa)} de ociosidad`,
          `Ociosidad de ${minutos(ociosa)} antes del ciclo de ${c.camion}. Revisar asignación de camiones.`,
          pala, "Pala"),
      );
    }

    if (carguio >= 420) {
      lista.push(
        alerta(c, "carguio-lento", "Alta", `Carguío de ${minutos(carguio)} en ${pala}`,
          `El carguío del camión ${c.camion} tomó ${minutos(carguio)}, sobre el objetivo de 7 min. Revisar frente de carga y material ${c.material ?? "sin registro"}.`,
          pala, "Pala"),
      );
    }

    if ((c.toneladas ?? 0) === 0) {
      lista.push(
        alerta(c, "sin-tonelaje", "Media", `Ciclo de ${c.camion} sin tonelaje registrado`,
          `El ciclo cerró con 0 t en ${pala}. Puede ser un error de pesaje o un ciclo abortado.`,
          c.camion, "Camión"),
      );
    }

    if (c.viaje_vacio && c.viaje_vacio_esperado && c.viaje_vacio > c.viaje_vacio_esperado * 1.5) {
      lista.push(
        alerta(c, "viaje-vacio", "Media", `${c.camion} demoró ${minutos(c.viaje_vacio)} en viaje vacío`,
          `Viaje vacío de ${minutos(c.viaje_vacio)} contra ${minutos(c.viaje_vacio_esperado)} esperados hacia ${pala}.`,
          c.camion, "Camión"),
      );
    }

    if (c.toneladas && c.capacidad && c.toneladas > c.capacidad * 1.1) {
      lista.push(
        alerta(c, "sobrecarga", "Baja", `${c.camion} con carga de ${numero(c.toneladas)} t`,
          `Carga de ${numero(c.toneladas)} t sobre la capacidad nominal de ${numero(c.capacidad, 1)} t. Revisar calibración de ${pala}.`,
          c.camion, "Camión"),
      );
    }
  }

  return lista.sort(
    (a, b) =>
      CRITICIDAD_ORDEN[a.criticidad] - CRITICIDAD_ORDEN[b.criticidad] ||
      (b.ts ?? "").localeCompare(a.ts ?? ""),
  );
}

export function kpisTurno(ciclos: Ciclo[], palas: ResumenPala[]) {
  const toneladas = ciclos.reduce((a, c) => a + (c.toneladas ?? 0), 0);
  const mineral = ciclos.filter((c) => c.es_mineral).reduce((a, c) => a + (c.toneladas ?? 0), 0);
  return {
    camiones: new Set(ciclos.map((c) => c.camion)).size,
    palasRiesgo: palas.filter((p) => p.estado !== "Operativa").length,
    palasTotal: palas.length,
    toneladas,
    mineral,
    colaPromedio: promedio(ciclos.map((c) => c.espera_cola ?? 0)),
  };
}
