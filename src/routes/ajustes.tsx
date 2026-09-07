import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, SlidersHorizontal } from "lucide-react";
import { Shell } from "@/components/mineflow/shell";
import { EtiquetaCriticidad } from "@/components/mineflow/ui-comunes";
import { reglasDemo, usuariosDemo } from "@/lib/mineflow-data";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes y reglas de alerta — MineFlow Alertas" },
      {
        name: "description",
        content: "Configura reglas demo de alerta, umbrales por criticidad y preferencias de turno de la faena.",
      },
      { property: "og:title", content: "Ajustes y reglas de alerta — MineFlow Alertas" },
      {
        property: "og:description",
        content: "Reglas de ejemplo con umbrales, criticidad y activación para la sala de despacho minera.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <Ajustes />
    </Shell>
  ),
});

function Ajustes() {
  const { sesion } = useAuth();
  const puedeEditar = sesion?.rol === "Administrador";
  const [reglas, setReglas] = useState(reglasDemo);
  const [sonido, setSonido] = useState(true);
  const [soloCriticas, setSoloCriticas] = useState(false);

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">Ajustes y reglas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configuración de ejemplo del Turno A</p>
        </div>
        <SlidersHorizontal className="h-6 w-6 shrink-0 text-primary" />
      </header>

      {!puedeEditar && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-muted-foreground">
            Estás con el rol <span className="font-semibold text-foreground">{sesion?.rol}</span>: puedes revisar la
            configuración, pero sólo el Administrador puede modificar reglas.
          </p>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Reglas de alerta</h2>
          <p className="text-sm text-muted-foreground">Umbrales demostrativos que generan las alertas del panel.</p>
        </div>
        <ul className="divide-y divide-border">
          {reglas.map((r) => (
            <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{r.nombre}</p>
                  <EtiquetaCriticidad valor={r.criticidad} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.descripcion}</p>
                <p className="mt-1 font-mono text-xs text-primary">Umbral {r.umbral}</p>
              </div>
              <button
                disabled={!puedeEditar}
                onClick={() =>
                  setReglas((prev) => prev.map((x) => (x.id === r.id ? { ...x, activa: !x.activa } : x)))
                }
                aria-label={`${r.activa ? "Desactivar" : "Activar"} regla ${r.nombre}`}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
                  r.activa ? "bg-primary" : "bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform",
                    r.activa ? "translate-x-[1.375rem]" : "translate-x-0.5",
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Preferencias de la sala</h2>
          <div className="mt-4 space-y-3">
            {[
              { etiqueta: "Aviso sonoro en alertas críticas", valor: sonido, set: setSonido },
              { etiqueta: "Mostrar sólo alertas críticas y altas", valor: soloCriticas, set: setSoloCriticas },
            ].map((op) => (
              <div
                key={op.etiqueta}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg bg-surface p-3"
              >
                <p className="min-w-0 text-sm">{op.etiqueta}</p>
                <button
                  onClick={() => op.set(!op.valor)}
                  aria-label={op.etiqueta}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    op.valor ? "bg-primary" : "bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform",
                      op.valor ? "translate-x-[1.375rem]" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Roles demo</h2>
          <ul className="mt-4 space-y-3">
            {usuariosDemo.map((u) => (
              <li key={u.rol} className="rounded-lg bg-surface p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <p className="truncate text-sm font-semibold">{u.nombre}</p>
                  <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {u.rol}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{u.descripcion}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
