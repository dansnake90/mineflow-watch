import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Search,
  Shovel,
  Truck,
  XCircle,
} from "lucide-react";
import { Shell, TarjetaKpi } from "@/components/mineflow/shell";
import {
  EsqueletoLista,
  EstadoVacio,
  EtiquetaCriticidad,
  EtiquetaEstado,
} from "@/components/mineflow/ui-comunes";
import { CRITICIDAD_ORDEN, type Criticidad, type EstadoAlerta } from "@/lib/mineflow-data";
import {
  generarAlertas,
  hora,
  kpisTurno,
  minutos,
  numero,
  resumirCamiones,
  resumirPalas,
  type AlertaDispatch,
} from "@/lib/dispatch";
import { listarEventos, listarTurnos, obtenerCiclos, registrarEvento, type EventoAlerta } from "@/lib/dispatch-api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel de alertas del turno — MineFlow Alertas" },
      {
        name: "description",
        content:
          "KPIs, alertas priorizadas y estado de palas y camiones calculados con los ciclos de carguío reales del turno DISPATCH.",
      },
      { property: "og:title", content: "Panel de alertas del turno — MineFlow Alertas" },
      {
        property: "og:description",
        content: "Colas, ociosidad de palas, carguíos lentos y tonelaje del turno con datos reales de DISPATCH.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const queryClient = useQueryClient();
  const [pestana, setPestana] = useState<Pestana>("alertas");
  const [busqueda, setBusqueda] = useState("");
  const [filtroCriticidad, setFiltroCriticidad] = useState<Criticidad | "Todas">("Todas");
  const [filtroEstado, setFiltroEstado] = useState<EstadoAlerta | "Todos">("Todos");
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  const turnos = useQuery({ queryKey: ["turnos"], queryFn: listarTurnos });
  const turno = turnos.data?.find((t) => t.activo) ?? turnos.data?.[0] ?? null;

  const ciclos = useQuery({
    queryKey: ["ciclos", turno?.id],
    queryFn: () => obtenerCiclos(turno!.id),
    enabled: Boolean(turno),
  });

  const eventos = useQuery({
    queryKey: ["eventos", turno?.id],
    queryFn: () => listarEventos(turno!.id),
    enabled: Boolean(turno),
  });

  const cambiarEstado = useMutation({
    mutationFn: (entrada: { clave: string; estado: EstadoAlerta }) =>
      registrarEvento({
        turnoId: turno!.id,
        clave: entrada.clave,
        estado: entrada.estado,
        detalle: `Acción registrada desde el panel del turno ${turno!.nombre_turno}.`,
        autor: sesion?.nombre ?? "Usuario demo",
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["eventos", turno?.id] }),
  });

  const datos = useMemo(() => {
    const lista = ciclos.data ?? [];
    const palas = resumirPalas(lista);
    return {
      palas,
      camiones: resumirCamiones(lista),
      alertas: generarAlertas(lista),
      kpis: kpisTurno(lista, palas),
    };
  }, [ciclos.data]);

  const estadoPorClave = useMemo(() => {
    const mapa = new Map<string, EstadoAlerta>();
    for (const e of eventos.data ?? []) mapa.set(e.alerta_clave, e.estado as EstadoAlerta);
    return mapa;
  }, [eventos.data]);

  const eventosPorClave = useMemo(() => {
    const mapa = new Map<string, EventoAlerta[]>();
    for (const e of eventos.data ?? []) {
      const lista = mapa.get(e.alerta_clave) ?? [];
      lista.push(e);
      mapa.set(e.alerta_clave, lista);
    }
    return mapa;
  }, [eventos.data]);

  const estadoDe = (clave: string): EstadoAlerta => estadoPorClave.get(clave) ?? "Nueva";

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return datos.alertas
      .filter((a) => (filtroCriticidad === "Todas" ? true : a.criticidad === filtroCriticidad))
      .filter((a) => (filtroEstado === "Todos" ? true : estadoDe(a.clave) === filtroEstado))
      .filter((a) =>
        texto
          ? [a.titulo, a.equipo, a.zona, a.regla, a.ciclo.operador_camion ?? "", a.ciclo.material ?? ""].some((v) =>
              v.toLowerCase().includes(texto),
            )
          : true,
      )
      .sort(
        (a, b) =>
          CRITICIDAD_ORDEN[a.criticidad] - CRITICIDAD_ORDEN[b.criticidad] || (b.ts ?? "").localeCompare(a.ts ?? ""),
      )
      .slice(0, 200);
  }, [datos.alertas, busqueda, filtroCriticidad, filtroEstado, estadoPorClave]);

  const alerta = datos.alertas.find((a) => a.clave === seleccionada) ?? null;
  const abiertas = datos.alertas.filter((a) => {
    const e = estadoDe(a.clave);
    return e === "Nueva" || e === "En revisión";
  });
  const puedeAccionar = sesion?.rol === "Administrador" || sesion?.rol === "Despachador";
  const cargando = turnos.isLoading || ciclos.isLoading;

  if (!turnos.isLoading && !turno) {
    return (
      <div className="space-y-6">
        <EstadoVacio
          titulo="Todavía no hay un turno cargado"
          mensaje="Sube la exportación Excel de DISPATCH para calcular KPIs, alertas y el estado de palas y camiones."
          icono={<FileSpreadsheet className="h-5 w-5" />}
        />
        <div className="text-center">
          <Link
            to="/cargar"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Cargar turno
          </Link>
        </div>
      </div>
    );
  }

  if (alerta) {
    return (
      <DetalleAlerta
        alerta={alerta}
        estado={estadoDe(alerta.clave)}
        eventos={eventosPorClave.get(alerta.clave) ?? []}
        puedeAccionar={puedeAccionar}
        onVolver={() => setSeleccionada(null)}
        onCambiarEstado={(estado) => cambiarEstado.mutate({ clave: alerta.clave, estado })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{turno?.nombre_turno ?? "Cargando turno…"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {turno?.grupo ?? "—"} · {numero(turno?.filas)} ciclos · archivo {turno?.archivo ?? "—"}
          </p>
        </div>
        <Link to="/cargar" className="shrink-0 text-xs font-semibold text-primary hover:underline">
          Cambiar turno
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaKpi
          etiqueta="Camiones del turno"
          valor={String(datos.kpis.camiones)}
          detalle={`${numero(datos.kpis.toneladas)} t movidas en total`}
          tono="ok"
        />
        <TarjetaKpi
          etiqueta="Palas en riesgo"
          valor={`${datos.kpis.palasRiesgo}/${datos.kpis.palasTotal}`}
          detalle="Según ociosidad y colas del turno"
          tono="alerta"
        />
        <TarjetaKpi
          etiqueta="Alertas abiertas"
          valor={String(abiertas.length)}
          detalle={`${datos.alertas.filter((a) => a.criticidad === "Crítica").length} críticas detectadas`}
          tono="critico"
        />
        <TarjetaKpi
          etiqueta="Cola promedio"
          valor={minutos(datos.kpis.colaPromedio)}
          detalle={`${numero(datos.kpis.mineral)} t de mineral`}
        />
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
                placeholder="Buscar por camión, pala, lugar de carga, operador o regla…"
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
                <li key={a.clave}>
                  <button
                    onClick={() => setSeleccionada(a.clave)}
                    className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent/40"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <EtiquetaCriticidad valor={a.criticidad} />
                          <EtiquetaEstado valor={estadoDe(a.clave)} />
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
                        <p className="font-mono text-sm tabular-nums">{hora(a.ts)}</p>
                        <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {a.tipoEquipo}
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
              {datos.palas.map((p) => (
                <article key={p.pala} className="rounded-xl border border-border bg-card p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl font-bold">{p.pala}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.camiones} camiones · {p.ciclos} ciclos
                      </p>
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
                  <dl className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-surface p-2 text-center">
                      <dt className="text-[11px] text-muted-foreground">Toneladas</dt>
                      <dd className="font-mono text-sm tabular-nums">{numero(p.toneladas)}</dd>
                    </div>
                    <div className="rounded-lg bg-surface p-2 text-center">
                      <dt className="text-[11px] text-muted-foreground">Ociosidad</dt>
                      <dd className="font-mono text-sm tabular-nums">{minutos(p.ociosidad)}</dd>
                    </div>
                    <div className="rounded-lg bg-surface p-2 text-center">
                      <dt className="text-[11px] text-muted-foreground">Cola prom.</dt>
                      <dd className="font-mono text-sm tabular-nums">{minutos(p.esperaPromedio)}</dd>
                    </div>
                    <div className="rounded-lg bg-surface p-2 text-center">
                      <dt className="text-[11px] text-muted-foreground">Últ. carga</dt>
                      <dd className="font-mono text-sm tabular-nums">{hora(p.ultimaCarga)}</dd>
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
                      <th className="px-4 py-3">Operador</th>
                      <th className="px-4 py-3">Pala principal</th>
                      <th className="px-4 py-3 text-right">Ciclos</th>
                      <th className="px-4 py-3 text-right">Toneladas</th>
                      <th className="px-4 py-3 text-right">Cola total</th>
                      <th className="px-4 py-3 text-right">Últ. ciclo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.camiones.map((c) => (
                      <tr key={c.camion} className="border-t border-border">
                        <td className="px-4 py-3 font-semibold">{c.camion}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.operador}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.palaPrincipal}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{c.ciclos}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{numero(c.toneladas)}</td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-mono tabular-nums",
                            c.colaTotal >= 3600 && "text-destructive",
                          )}
                        >
                          {minutos(c.colaTotal)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums">{hora(c.ultimoCiclo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
                {datos.camiones.map((c) => (
                  <article key={c.camion} className="rounded-xl border border-border bg-card p-4">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{c.camion}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.operador}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-[11px] font-semibold">
                        {c.palaPrincipal}
                      </span>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-surface p-2">
                        <dt className="text-muted-foreground">Ciclos</dt>
                        <dd className="font-mono tabular-nums">{c.ciclos}</dd>
                      </div>
                      <div className="rounded-lg bg-surface p-2">
                        <dt className="text-muted-foreground">Toneladas</dt>
                        <dd className="font-mono tabular-nums">{numero(c.toneladas)}</dd>
                      </div>
                      <div className="rounded-lg bg-surface p-2">
                        <dt className="text-muted-foreground">Cola total</dt>
                        <dd className={cn("font-mono tabular-nums", c.colaTotal >= 3600 && "text-destructive")}>
                          {minutos(c.colaTotal)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-surface p-2">
                        <dt className="text-muted-foreground">Últ. ciclo</dt>
                        <dd className="font-mono tabular-nums">{hora(c.ultimoCiclo)}</dd>
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
  estado,
  eventos,
  puedeAccionar,
  onVolver,
  onCambiarEstado,
}: {
  alerta: AlertaDispatch;
  estado: EstadoAlerta;
  eventos: EventoAlerta[];
  puedeAccionar: boolean;
  onVolver: () => void;
  onCambiarEstado: (estado: EstadoAlerta) => void;
}) {
  const c = alerta.ciclo;

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
            <EtiquetaEstado valor={estado} />
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-snug">{alerta.titulo}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{alerta.descripcion}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Equipo", alerta.equipo],
              ["Lugar de carga", alerta.zona],
              ["Cierre de ciclo", hora(c.ts_lleno)],
              ["Material", c.material ?? "—"],
              ["Cola", minutos(c.espera_cola)],
              ["Carguío", minutos(c.tiempo_carguio)],
              ["Ociosidad pala", minutos(c.ociosidad_pala)],
              ["Toneladas", numero(c.toneladas)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-surface p-3">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Regla que la generó</p>
              <p className="mt-1 text-sm font-semibold">{alerta.regla}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Operadores</p>
              <p className="mt-1 text-sm font-semibold">
                {c.operador_camion ?? "—"} · {c.operador_pala ?? "—"}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acciones de estado</p>
            {puedeAccionar ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <BotonAccion
                  onClick={() => onCambiarEstado("En revisión")}
                  activo={estado === "En revisión"}
                  icono={<Clock className="h-4 w-4" />}
                  texto="Tomar y revisar"
                />
                <BotonAccion
                  onClick={() => onCambiarEstado("Resuelta")}
                  activo={estado === "Resuelta"}
                  icono={<CheckCircle2 className="h-4 w-4" />}
                  texto="Marcar resuelta"
                />
                <BotonAccion
                  onClick={() => onCambiarEstado("Descartada")}
                  activo={estado === "Descartada"}
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
            <li className="relative pl-6">
              <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              {eventos.length > 0 && <span className="absolute left-[4px] top-5 h-[calc(100%+0.5rem)] w-0.5 bg-border" />}
              <p className="font-mono text-xs text-muted-foreground">{hora(alerta.ts)}</p>
              <p className="mt-0.5 text-sm font-semibold">Alerta detectada</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Regla “{alerta.regla}” activada con los datos del ciclo importado.
              </p>
              <p className="mt-0.5 text-xs text-primary">Sistema</p>
            </li>
            {eventos.map((e, i) => (
              <li key={e.id} className="relative pl-6">
                <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                {i < eventos.length - 1 && (
                  <span className="absolute left-[4px] top-5 h-[calc(100%+0.5rem)] w-0.5 bg-border" />
                )}
                <p className="font-mono text-xs text-muted-foreground">{hora(e.created_at)}</p>
                <p className="mt-0.5 text-sm font-semibold">Estado cambiado a {e.estado}</p>
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
