import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, Lock, Trash2, Upload } from "lucide-react";
import { Shell } from "@/components/mineflow/shell";
import { EstadoVacio } from "@/components/mineflow/ui-comunes";
import { leerArchivoDispatch, numero } from "@/lib/dispatch";
import { activarTurno, eliminarTurno, guardarTurno, listarTurnos } from "@/lib/dispatch-api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cargar")({
  head: () => ({
    meta: [
      { title: "Cargar turno DISPATCH — MineFlow Alertas" },
      {
        name: "description",
        content:
          "Sube la exportación Excel de DISPATCH (hoja StdShiftLoads) y alimenta el panel de alertas con los ciclos reales del turno.",
      },
      { property: "og:title", content: "Cargar turno DISPATCH — MineFlow Alertas" },
      {
        property: "og:description",
        content: "Importa ciclos de carguío reales desde Excel y recalcula KPIs y alertas del turno.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <Shell>
      <Cargar />
    </Shell>
  ),
});

function fechaCorta(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(
    new Date(iso),
  );
}

function Cargar() {
  const { sesion } = useAuth();
  const puedeCargar = sesion?.rol === "Administrador" || sesion?.rol === "Despachador";
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const turnos = useQuery({ queryKey: ["turnos"], queryFn: listarTurnos });

  const subir = useMutation({
    mutationFn: async (archivo: File) => {
      const lectura = await leerArchivoDispatch(archivo);
      return guardarTurno(lectura);
    },
    onSuccess: (turno) => {
      setError(null);
      setMensaje(`Turno ${turno.nombre_turno} cargado con ${numero(turno.filas)} ciclos.`);
      void queryClient.invalidateQueries();
    },
    onError: (e: Error) => {
      setMensaje(null);
      setError(e.message || "No se pudo leer el archivo.");
    },
  });

  const activar = useMutation({
    mutationFn: activarTurno,
    onSuccess: () => void queryClient.invalidateQueries(),
  });

  const borrar = useMutation({
    mutationFn: eliminarTurno,
    onSuccess: () => {
      setMensaje("Turno eliminado correctamente.");
      setError(null);
      void queryClient.invalidateQueries();
    },
    onError: (e: Error) => {
      setMensaje(null);
      setError(e.message || "No se pudo eliminar el turno.");
    },
  });

  const recibir = (archivo: File | undefined) => {
    if (!archivo || !puedeCargar) return;
    subir.mutate(archivo);
  };

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">Cargar datos de DISPATCH</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sube la exportación Excel del turno (hoja de ciclos de carguío) para alimentar el panel.
          </p>
        </div>
        <FileSpreadsheet className="h-6 w-6 shrink-0 text-primary" />
      </header>

      {!puedeCargar && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-muted-foreground">
            Tu rol <span className="font-semibold text-foreground">{sesion?.rol}</span> puede revisar los turnos
            cargados, pero no subir archivos nuevos.
          </p>
        </div>
      )}

      <section
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          recibir(e.dataTransfer.files[0]);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          arrastrando ? "border-primary bg-primary/5" : "border-border bg-card",
          !puedeCargar && "opacity-60",
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-3 font-semibold">Arrastra aquí el archivo del turno</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Formatos aceptados: .xlsx, .xls o .csv con las columnas de ciclos de DISPATCH.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => recibir(e.target.files?.[0])}
        />
        <button
          disabled={!puedeCargar || subir.isPending}
          onClick={() => inputRef.current?.click()}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {subir.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {subir.isPending ? "Procesando archivo…" : "Seleccionar archivo"}
        </button>

        {mensaje && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            {mensaje}
          </p>
        )}
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Turnos cargados</h2>
          <p className="text-sm text-muted-foreground">El turno activo es el que muestra el panel de alertas.</p>
        </div>

        {turnos.isLoading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">Cargando turnos…</p>
        ) : (turnos.data ?? []).length === 0 ? (
          <div className="p-5">
            <EstadoVacio
              titulo="Aún no hay turnos cargados"
              mensaje="Sube una exportación de DISPATCH para ver KPIs y alertas con datos reales."
              icono={<FileSpreadsheet className="h-5 w-5" />}
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {(turnos.data ?? []).map((t) => (
              <li key={t.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{t.nombre_turno}</p>
                    {t.activo && (
                      <span className="rounded-md bg-success/20 px-2 py-0.5 text-[11px] font-semibold text-success">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {t.archivo} · {t.grupo ?? "Sin grupo"} · {numero(t.filas)} ciclos
                  </p>
                  <p className="mt-1 font-mono text-xs text-primary">
                    {fechaCorta(t.inicio)} → {fechaCorta(t.fin)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!t.activo && (
                    <button
                      disabled={activar.isPending}
                      onClick={() => activar.mutate(t.id)}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold transition-colors hover:border-primary/60 hover:bg-accent disabled:opacity-50"
                    >
                      Usar este turno
                    </button>
                  )}
                  {puedeCargar && (
                    <button
                      title="Eliminar turno"
                      disabled={borrar.isPending}
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro de eliminar el turno "${t.nombre_turno}"?`)) {
                          borrar.mutate(t.id);
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-border bg-surface p-2 text-muted-foreground transition-colors hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {borrar.isPending && borrar.variables === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
