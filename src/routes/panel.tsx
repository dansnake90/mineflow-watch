import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Search, Shovel, Truck, XCircle } from "lucide-react";
import { Shell, TarjetaKpi } from "@/components/mineflow/shell";
import {
  EsqueletoLista,
  EstadoVacio,
  EtiquetaCriticidad,
  EtiquetaEstado,
  useCargaSimulada,
} from "@/components/mineflow/ui-comunes";
import {
  CRITICIDAD_ORDEN,
  alertas as alertasBase,
  camiones,
  palas,
  type Alerta,
  type Criticidad,
  type EstadoAlerta,
} from "@/lib/mineflow-data";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel de alertas — MineFlow Alertas" },
      {
        name: "description",
        content: "Panel oscuro con KPIs del turno, alertas priorizadas y estado de palas y camiones de la faena.",
      },
      { property: "og:title", content: "Panel de alertas — MineFlow Alertas" },
      {
        property: "og:description",
        content: "KPIs del turno, alertas priorizadas por criticidad y estado en vivo de palas y camiones.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <Panel />
    </Shell>
  ),
});

type Pestana = "alertas" | "palas" | "camiones";

const CRITICIDADES: (Criticidad | "Todas")[] = ["Todas", "Crítica", "Alta", "Media", "Baja"];
const ESTADOS: (EstadoAlerta | "Todos")[] = ["Todos", "Nueva", "En revisión", "Resuelta", "Descartada"];

function Panel() {
  const { sesion } = useAuth();
  const cargando = useCargaSimulada();
  const [pestana, setPestana] = useState<Pestana>("alertas");
  const [lista, setLista] = useState<Alerta[]>(alertasBase);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCriticidad, setFiltroCriticidad] = useState<Criticidad | "Todas">("Todas");
  const [filtroEstado, setFiltroEstado] = useState<EstadoAlerta | "Todos">("Todos");
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return lista
      .filter((a) => (filtroCriticidad === "Todas" ? true : a.criticidad === filtroCriticidad))
      .filter((a) => (filtroEstado === "Todos" ? true : a.estado === filtroEstado))
      .filter((a) =>
        texto
          ? [a.id, a.titulo, a.equipo, a.zona, a.regla].some((v) => v.toLowerCase().includes(texto))
          : true,
      )
      .sort(
        (a, b) =>
          CRITICIDAD_ORDEN[a.criticidad] - CRITICIDAD_ORDEN[b.criticidad] || a.minutosAtras - b.minutosAtras,
      );
  }, [lista, busqueda, filtroCriticidad, filtroEstado]);

  const alerta = lista.find((a) => a.id === seleccionada) ?? null;
  const abiertas = lista.filter((a) => a.estado === "Nueva" || a.estado === "En revisión");
  const puedeAccionar = sesion?.rol === "Administrador" || sesion?.rol === "Despachador";

  const cambiarEstado = (id: string, estado: EstadoAlerta) => {
    setLista((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              estado,
              timeline: [
                ...a.timeline,
                {
                  hora: new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
                    new Date(),
                  ),
                  titulo: `Estado cambiado a ${estado}`,
                  detalle: `Acción registrada desde el panel del Turno A.`,
                  autor: sesion?.nombre ?? "Usuario demo",
                },
              ],
            }
          : a,
      ),
    );
  };

  if (alerta) {
    return (
      <DetalleAlerta
        alerta={alerta}
        puedeAccionar={puedeAccionar}
        onVolver={() => setSeleccionada(null)}
        onCambiarEstado={(estado) => cambiarEstado(alerta.id, estado)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaKpi etiqueta="Camiones activos" valor="23" detalle="De 26 en flota · Turno A" tono="ok" />
        <TarjetaKpi etiqueta="Palas en riesgo" valor="5/6" detalle="1 detenida, 4 con riesgo operacional" tono="alerta" />
        <TarjetaKpi
          etiqueta="Alertas abiertas"
          valor={String(abiertas.length)}
          detalle={`${lista.filter((a) => a.criticidad === "Crítica").length} críticas en el turno`}
          tono="critico"
        />
        <TarjetaKpi etiqueta="Cumplimiento plan" valor="92%" detalle="43.500 t movidas de 47.200 t" />
      </section>

      <nav className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1 sm:inline-grid sm:w-auto sm:grid-flow-col sm:auto-cols-max">
        {(
          [
            { id: "alertas", etiqueta: "Alertas", Icono: AlertTriangle },
            { id: "palas", etiqueta: "Palas", Icono: Shovel },
            { id: "camiones", etiqueta: "Camiones", Icono: Truck },
          ] as const
        ).map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            onClick={() => setPestana(id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              pestana === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
            )}
          >
            <Icono className="h-4 w-4 shrink-0" />
            <span className="truncate">{etiqueta}</span>
          </button>
        ))}
      </nav>

      {pestana === "alertas" && (
        <section className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por equipo, zona, folio o regla…"
                className="w-full rounded-lg border border-input bg-surface py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <select
              value={filtroCriticidad}
              onChange={(e) => setFiltroCriticidad(e.target.value as Criticidad | "Todas")}
              className="rounded-lg border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {CRITICIDADES.map((c) => (
                <option key={c} value={c}>
                  {c === "Todas" ? "Toda criticidad" : c}
                </option>
              ))}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoAlerta | "Todos")}
              className="rounded-lg border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e === "Todos" ? "Todo estado" : e}
                </option>
              ))}
            </select>
          </div>

          {cargando ? (
            <EsqueletoLista filas={5} />
          ) : filtradas.length === 0 ? (
            <EstadoVacio
              titulo="Sin alertas para estos filtros"
              mensaje="Ajusta la búsqueda o los filtros de criticidad y estado para ver más resultados."
              icono={<Search className="h-5 w-5" />}
            />
          ) : (
            <ul className="space-y-3">
              {filtradas.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => setSeleccionada(a.id)}
                    className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent/40"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <EtiquetaCriticidad valor={a.criticidad} />
                          <EtiquetaEstado valor={a.estado} />
                          <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                        </div>
                        <p className="mt-2 font-semibold leading-snug">{a.titulo}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.descripcion}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{a.equipo}</span>
                          <span>{a.zona}</span>
                          <span>Regla: {a.regla}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-sm tabular-nums">{a.hora}</p>
                        <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {a.minutosAtras} min
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {pestana === "palas" && (
        <section className="space-y-3">
          {cargando ? (
            <EsqueletoLista filas={4} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {palas.map((p) => (
                <article key={p.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl font-bold">{p.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.zona}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold",
                        p.estado === "Operativa" && "bg-success/20 text-success",
                        p.estado === "En riesgo" && "bg-warning/20 text-warning",
                        p.estado === "Detenida" && "bg-destructive/20 text-destructive",
                      )}
                    >
                      {p.estado}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Disponibilidad</span>
                      <span className="font-mono tabular-nums text-foreground">{p.disponibilidad}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p.disponibilidad}%` }} />
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-surface p-2">
                      <dt className="text-[11px] text-muted-foreground">Camiones</dt>
                      <dd className="font-mono text-sm tabular-nums">{p.camionesAsignados}</dd>
                    </div>
                    <div className="rounded-lg bg-surface p-2">
                      <dt className="text-[11px] text-muted-foreground">Ton turno</dt>
                      <dd className="font-mono text-sm tabular-nums">{p.toneladasTurno.toLocaleString("es-CL")}</dd>
                    </div>
                    <div className="rounded-lg bg-surface p-2">
                      <dt className="text-[11px] text-muted-foreground">Últ. carga</dt>
                      <dd className="font-mono text-sm tabular-nums">{p.ultimaCarga}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {pestana === "camiones" && (
        <section>
          {cargando ? (
            <EsqueletoLista filas={5} />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Camión</th>
                      <th className="px-4 py-3">Modelo</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Pala asignada</th>
                      <th className="px-4 py-3 text-right">Combustible</th>
                      <th className="px-4 py-3 text-right">Carga (t)</th>
                      <th className="px-4 py-3 text-right">Ciclos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {camiones.map((c) => (
                      <tr key={c.id} className="border-t border-border">
                        <td className="px-4 py-3 font-semibold">{c.nombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.modelo}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-md px-2 py-1 text-[11px] font-semibold",
                              c.estado === "En ruta" && "bg-success/20 text-success",
                              c.estado === "Cargando" && "bg-info/20 text-info",
                              c.estado === "En cola" && "bg-warning/20 text-warning",
                              c.estado === "Mantención" && "bg-destructive/20 text-destructive",
                            )}
                          >
                            {c.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{c.palaAsignada}</td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-mono tabular-nums",
                            c.combustible < 20 && "text-destructive",
                          )}
                        >
                          {c.combustible}%
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{c.cargaTon}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{c.ciclosTurno}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                {camiones.map((c) => (
                  <article key={c.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{c.nombre}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.modelo}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-[11px] font-semibold">
                        {c.estado}
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-surface p-2">
                        <dt className="text-muted-foreground">Pala</dt>
                        <dd>{c.palaAsignada}</dd>
                      </div>
                      <div className="rounded-lg bg-surface p-2">
                        <dt className="text-muted-foreground">Combustible</dt>
                        <dd className={cn("font-mono tabular-nums", c.combustible < 20 && "text-destructive")}>
                          {c.combustible}%
                        </dd>
                      </div>
                      <div className="rounded-lg bg-surface p-2">
                        <dt className="text-muted-foreground">Carga</dt>
                        <dd className="font-mono tabular-nums">{c.cargaTon} t</dd>
                      </div>
                      <div className="rounded-lg bg-surface p-2">
                        <dt className="text-muted-foreground">Ciclos</dt>
                        <dd className="font-mono tabular-nums">{c.ciclosTurno}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function DetalleAlerta({
  alerta,
  puedeAccionar,
  onVolver,
  onCambiarEstado,
}: {
  alerta: Alerta;
  puedeAccionar: boolean;
  onVolver: () => void;
  onCambiarEstado: (estado: EstadoAlerta) => void;
}) {
  return (
    <div className="space-y-6">
      <button
        onClick={onVolver}
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al listado
      </button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <EtiquetaCriticidad valor={alerta.criticidad} />
            <EtiquetaEstado valor={alerta.estado} />
            <span className="font-mono text-xs text-muted-foreground">{alerta.id}</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-snug">{alerta.titulo}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{alerta.descripcion}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Equipo", alerta.equipo],
              ["Zona", alerta.zona],
              ["Detectada", alerta.hora],
              ["Antigüedad", `${alerta.minutosAtras} min`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-surface p-3">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 rounded-lg border border-border bg-surface p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Regla que la generó</p>
            <p className="mt-1 text-sm font-semibold">{alerta.regla}</p>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones de estado</p>
            {puedeAccionar ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <BotonAccion
                  onClick={() => onCambiarEstado("En revisión")}
                  activo={alerta.estado === "En revisión"}
                  icono={<Clock className="h-4 w-4" />}
                  texto="Tomar y revisar"
                />
                <BotonAccion
                  onClick={() => onCambiarEstado("Resuelta")}
                  activo={alerta.estado === "Resuelta"}
                  icono={<CheckCircle2 className="h-4 w-4" />}
                  texto="Marcar resuelta"
                />
                <BotonAccion
                  onClick={() => onCambiarEstado("Descartada")}
                  activo={alerta.estado === "Descartada"}
                  icono={<XCircle className="h-4 w-4" />}
                  texto="Descartar"
                />
              </div>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                Tu rol Supervisor permite seguimiento y lectura. Los cambios de estado los realiza el despachador.
              </p>
            )}
          </div>
        </article>

        <aside className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Historial del evento</h2>
          <ol className="mt-4 space-y-4">
            {alerta.timeline.map((e, i) => (
              <li key={`${e.hora}-${i}`} className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                {i < alerta.timeline.length - 1 && (
                  <span className="absolute left-[4px] top-5 h-[calc(100%+0.5rem)] w-0.5 bg-border" />
                )}
                <p className="font-mono text-xs text-muted-foreground">{e.hora}</p>
                <p className="mt-0.5 text-sm font-semibold">{e.titulo}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{e.detalle}</p>
                <p className="mt-0.5 text-xs text-primary">{e.autor}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

function BotonAccion({
  onClick,
  activo,
  icono,
  texto,
}: {
  onClick: () => void;
  activo: boolean;
  icono: React.ReactNode;
  texto: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
        activo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-foreground hover:border-primary/60 hover:bg-accent",
      )}
    >
      {icono}
      {texto}
    </button>
  );
}
