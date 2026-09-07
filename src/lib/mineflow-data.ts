export type Rol = "Administrador" | "Despachador" | "Supervisor";

export type Criticidad = "Crítica" | "Alta" | "Media" | "Baja";
export type EstadoAlerta = "Nueva" | "En revisión" | "Resuelta" | "Descartada";

export type EventoTimeline = {
  hora: string;
  titulo: string;
  detalle: string;
  autor: string;
};

export type Alerta = {
  id: string;
  titulo: string;
  descripcion: string;
  criticidad: Criticidad;
  estado: EstadoAlerta;
  equipo: string;
  tipoEquipo: "Pala" | "Camión";
  zona: string;
  hora: string;
  minutosAtras: number;
  regla: string;
  timeline: EventoTimeline[];
};

export type Pala = {
  id: string;
  nombre: string;
  zona: string;
  estado: "Operativa" | "En riesgo" | "Detenida";
  disponibilidad: number;
  camionesAsignados: number;
  toneladasTurno: number;
  ultimaCarga: string;
};

export type Camion = {
  id: string;
  nombre: string;
  modelo: string;
  estado: "En ruta" | "Cargando" | "En cola" | "Mantención";
  palaAsignada: string;
  combustible: number;
  cargaTon: number;
  ciclosTurno: number;
};

export const CRITICIDAD_ORDEN: Record<Criticidad, number> = {
  Crítica: 0,
  Alta: 1,
  Media: 2,
  Baja: 3,
};

export const alertas: Alerta[] = [
  {
    id: "ALT-1042",
    titulo: "Pala 04 sin camión asignado hace 12 min",
    descripcion:
      "La Pala 04 se encuentra sin flota asignada, generando pérdida de productividad estimada en 340 t por hora detenida.",
    criticidad: "Crítica",
    estado: "Nueva",
    equipo: "Pala 04",
    tipoEquipo: "Pala",
    zona: "Rajo Norte",
    hora: "14:22",
    minutosAtras: 12,
    regla: "Pala sin asignación > 10 min",
    timeline: [
      { hora: "14:22", titulo: "Alerta generada", detalle: "Regla “Pala sin asignación > 10 min” activada.", autor: "Sistema" },
      { hora: "14:24", titulo: "Notificación enviada", detalle: "Aviso al despacho del Turno A.", autor: "Sistema" },
    ],
  },
  {
    id: "ALT-1041",
    titulo: "Camión 218 con caída de presión en neumático trasero",
    descripcion:
      "Sensor de presión reporta 82 psi bajo el umbral mínimo definido para el modelo. Se recomienda derivar a taller.",
    criticidad: "Crítica",
    estado: "En revisión",
    equipo: "Camión 218",
    tipoEquipo: "Camión",
    zona: "Ruta 3",
    hora: "14:05",
    minutosAtras: 29,
    regla: "Presión de neumático fuera de rango",
    timeline: [
      { hora: "14:05", titulo: "Alerta generada", detalle: "Lectura de 82 psi (mínimo 110 psi).", autor: "Sistema" },
      { hora: "14:09", titulo: "Tomada por despachador", detalle: "Se contacta al operador por radio.", autor: "M. Rojas" },
      { hora: "14:14", titulo: "En revisión", detalle: "Camión desvía a zona de inspección.", autor: "M. Rojas" },
    ],
  },
  {
    id: "ALT-1040",
    titulo: "Cola excesiva en Pala 02 (5 camiones en espera)",
    descripcion: "Tiempo promedio de espera en cola de 9 min. Se sugiere redistribuir dos camiones a la Pala 06.",
    criticidad: "Alta",
    estado: "Nueva",
    equipo: "Pala 02",
    tipoEquipo: "Pala",
    zona: "Rajo Sur",
    hora: "13:58",
    minutosAtras: 36,
    regla: "Cola > 4 camiones",
    timeline: [
      { hora: "13:58", titulo: "Alerta generada", detalle: "5 camiones detectados en cola.", autor: "Sistema" },
    ],
  },
  {
    id: "ALT-1039",
    titulo: "Camión 205 con combustible bajo (14%)",
    descripcion: "Autonomía estimada de 40 min. Programar carga de combustible antes del próximo ciclo.",
    criticidad: "Alta",
    estado: "Nueva",
    equipo: "Camión 205",
    tipoEquipo: "Camión",
    zona: "Ruta 1",
    hora: "13:40",
    minutosAtras: 54,
    regla: "Combustible < 20%",
    timeline: [
      { hora: "13:40", titulo: "Alerta generada", detalle: "Nivel de combustible 14%.", autor: "Sistema" },
      { hora: "13:47", titulo: "Comentario", detalle: "Se agenda carga al término del ciclo actual.", autor: "P. Silva" },
    ],
  },
  {
    id: "ALT-1038",
    titulo: "Pala 06 con rendimiento bajo el plan (−18%)",
    descripcion: "Toneladas por hora bajo el objetivo del turno. Revisar condiciones de frente de carga.",
    criticidad: "Media",
    estado: "En revisión",
    equipo: "Pala 06",
    tipoEquipo: "Pala",
    zona: "Rajo Norte",
    hora: "13:12",
    minutosAtras: 82,
    regla: "Rendimiento < 85% del plan",
    timeline: [
      { hora: "13:12", titulo: "Alerta generada", detalle: "Rendimiento 82% del plan de turno.", autor: "Sistema" },
      { hora: "13:30", titulo: "En revisión", detalle: "Supervisor inspecciona frente de carga.", autor: "C. Fuentes" },
    ],
  },
  {
    id: "ALT-1037",
    titulo: "Camión 231 detenido fuera de punto de carga",
    descripcion: "Equipo sin movimiento por 7 min en zona no habilitada para detención.",
    criticidad: "Media",
    estado: "Resuelta",
    equipo: "Camión 231",
    tipoEquipo: "Camión",
    zona: "Ruta 2",
    hora: "12:48",
    minutosAtras: 106,
    regla: "Detención no planificada > 5 min",
    timeline: [
      { hora: "12:48", titulo: "Alerta generada", detalle: "Detención de 7 min detectada.", autor: "Sistema" },
      { hora: "12:55", titulo: "Resuelta", detalle: "Operador retoma ruta tras cambio de turno de conductor.", autor: "M. Rojas" },
    ],
  },
  {
    id: "ALT-1036",
    titulo: "Pala 01 con mantención preventiva próxima (2 h)",
    descripcion: "Ventana de mantención programada. Coordinar reasignación de flota antes de la detención.",
    criticidad: "Baja",
    estado: "Nueva",
    equipo: "Pala 01",
    tipoEquipo: "Pala",
    zona: "Rajo Sur",
    hora: "12:20",
    minutosAtras: 134,
    regla: "Mantención programada < 3 h",
    timeline: [
      { hora: "12:20", titulo: "Alerta generada", detalle: "Mantención preventiva agendada a las 16:30.", autor: "Sistema" },
    ],
  },
  {
    id: "ALT-1035",
    titulo: "Camión 212 con exceso de carga (+8%)",
    descripcion: "Carga por sobre el límite recomendado del modelo. Revisar calibración de pala asignada.",
    criticidad: "Baja",
    estado: "Descartada",
    equipo: "Camión 212",
    tipoEquipo: "Camión",
    zona: "Ruta 3",
    hora: "11:55",
    minutosAtras: 159,
    regla: "Sobrecarga > 5%",
    timeline: [
      { hora: "11:55", titulo: "Alerta generada", detalle: "Carga registrada 8% sobre el límite.", autor: "Sistema" },
      { hora: "12:02", titulo: "Descartada", detalle: "Diferencia atribuida a humedad del material.", autor: "C. Fuentes" },
    ],
  },
];

export const palas: Pala[] = [
  { id: "P-01", nombre: "Pala 01", zona: "Rajo Sur", estado: "Operativa", disponibilidad: 94, camionesAsignados: 4, toneladasTurno: 8420, ultimaCarga: "14:31" },
  { id: "P-02", nombre: "Pala 02", zona: "Rajo Sur", estado: "En riesgo", disponibilidad: 88, camionesAsignados: 7, toneladasTurno: 9110, ultimaCarga: "14:33" },
  { id: "P-03", nombre: "Pala 03", zona: "Rajo Centro", estado: "En riesgo", disponibilidad: 81, camionesAsignados: 3, toneladasTurno: 6890, ultimaCarga: "14:28" },
  { id: "P-04", nombre: "Pala 04", zona: "Rajo Norte", estado: "Detenida", disponibilidad: 62, camionesAsignados: 0, toneladasTurno: 4310, ultimaCarga: "14:10" },
  { id: "P-05", nombre: "Pala 05", zona: "Rajo Centro", estado: "En riesgo", disponibilidad: 85, camionesAsignados: 4, toneladasTurno: 7740, ultimaCarga: "14:30" },
  { id: "P-06", nombre: "Pala 06", zona: "Rajo Norte", estado: "En riesgo", disponibilidad: 79, camionesAsignados: 5, toneladasTurno: 7020, ultimaCarga: "14:32" },
];

export const camiones: Camion[] = [
  { id: "C-201", nombre: "Camión 201", modelo: "CAT 793F", estado: "En ruta", palaAsignada: "Pala 01", combustible: 68, cargaTon: 227, ciclosTurno: 9 },
  { id: "C-205", nombre: "Camión 205", modelo: "CAT 793F", estado: "En ruta", palaAsignada: "Pala 02", combustible: 14, cargaTon: 219, ciclosTurno: 8 },
  { id: "C-208", nombre: "Camión 208", modelo: "Komatsu 830E", estado: "Cargando", palaAsignada: "Pala 02", combustible: 55, cargaTon: 231, ciclosTurno: 10 },
  { id: "C-212", nombre: "Camión 212", modelo: "Komatsu 830E", estado: "En cola", palaAsignada: "Pala 02", combustible: 47, cargaTon: 248, ciclosTurno: 7 },
  { id: "C-218", nombre: "Camión 218", modelo: "CAT 797F", estado: "Mantención", palaAsignada: "—", combustible: 39, cargaTon: 0, ciclosTurno: 5 },
  { id: "C-223", nombre: "Camión 223", modelo: "CAT 797F", estado: "En ruta", palaAsignada: "Pala 05", combustible: 72, cargaTon: 352, ciclosTurno: 9 },
  { id: "C-227", nombre: "Camión 227", modelo: "Komatsu 930E", estado: "En cola", palaAsignada: "Pala 06", combustible: 61, cargaTon: 290, ciclosTurno: 8 },
  { id: "C-231", nombre: "Camión 231", modelo: "Komatsu 930E", estado: "En ruta", palaAsignada: "Pala 03", combustible: 58, cargaTon: 298, ciclosTurno: 6 },
  { id: "C-236", nombre: "Camión 236", modelo: "CAT 793F", estado: "Cargando", palaAsignada: "Pala 05", combustible: 44, cargaTon: 224, ciclosTurno: 11 },
  { id: "C-240", nombre: "Camión 240", modelo: "CAT 793F", estado: "En cola", palaAsignada: "Pala 06", combustible: 83, cargaTon: 233, ciclosTurno: 4 },
];

export type Regla = {
  id: string;
  nombre: string;
  descripcion: string;
  criticidad: Criticidad;
  umbral: string;
  activa: boolean;
};

export const reglasDemo: Regla[] = [
  { id: "R-01", nombre: "Pala sin asignación", descripcion: "Avisa cuando una pala queda sin camiones asignados.", criticidad: "Crítica", umbral: "> 10 min", activa: true },
  { id: "R-02", nombre: "Cola excesiva en pala", descripcion: "Avisa cuando se acumulan camiones esperando carga.", criticidad: "Alta", umbral: "> 4 camiones", activa: true },
  { id: "R-03", nombre: "Combustible bajo", descripcion: "Avisa cuando un camión baja del nivel mínimo de combustible.", criticidad: "Alta", umbral: "< 20%", activa: true },
  { id: "R-04", nombre: "Presión de neumático", descripcion: "Avisa ante lecturas fuera del rango del modelo.", criticidad: "Crítica", umbral: "< 110 psi", activa: true },
  { id: "R-05", nombre: "Detención no planificada", descripcion: "Avisa cuando un camión se detiene fuera de punto habilitado.", criticidad: "Media", umbral: "> 5 min", activa: false },
  { id: "R-06", nombre: "Sobrecarga de camión", descripcion: "Avisa cuando la carga supera el límite recomendado.", criticidad: "Baja", umbral: "> 5%", activa: false },
];

export const usuariosDemo: { rol: Rol; nombre: string; correo: string; descripcion: string }[] = [
  { rol: "Administrador", nombre: "Daniel Belmar", correo: "admin@mineflow.cl", descripcion: "Acceso total, incluye ajustes y reglas." },
  { rol: "Despachador", nombre: "Mariela Rojas", correo: "despacho@mineflow.cl", descripcion: "Gestiona alertas y estados en tiempo real." },
  { rol: "Supervisor", nombre: "Carlos Fuentes", correo: "supervisor@mineflow.cl", descripcion: "Vista de seguimiento y comentarios." },
];
