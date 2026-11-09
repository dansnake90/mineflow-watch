import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Truck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usuariosDemo, type Rol } from "@/lib/mineflow-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MineFlow Alertas — Acceso a sala de despacho" },
      {
        name: "description",
        content:
          "Acceso demo a MineFlow Alertas: monitoreo de alertas de palas y camiones para la sala de despacho minera.",
      },
      { property: "og:title", content: "MineFlow Alertas — Acceso a sala de despacho" },
      {
        property: "og:description",
        content: "Prototipo de monitoreo de alertas mineras con roles Administrador, Despachador y Supervisor.",
      },
    ],
  }),
  component: PaginaAcceso,
});

function PaginaAcceso() {
  const { sesion, listo, iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [rol, setRol] = useState<Rol>("Despachador");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (listo && sesion) void navigate({ to: "/panel" });
  }, [listo, sesion, navigate]);

  const entrar = () => {
    setEnviando(true);
    window.setTimeout(() => {
      iniciarSesion(rol);
      void navigate({ to: "/panel" });
    }, 600);
  };

  const usuario = usuariosDemo.find((u) => u.rol === rol)!;

  return (
    <div className="min-h-screen bg-background">
      <div className="franja-riesgo h-1 w-full" />
      <div className="mx-auto grid min-h-[calc(100vh-4px)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:py-16">
        <section>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="h-6 w-6" />
            </div>
            <p className="font-display text-2xl font-bold uppercase tracking-wide">MineFlow Alertas</p>
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
            Alertas priorizadas para la sala de despacho
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Visualiza en un solo lugar el estado de palas y camiones del turno, con alertas ordenadas por criticidad,
            historial de cada evento y acciones de seguimiento. Prototipo con datos de ejemplo.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>· Prioridad automática por criticidad y antigüedad</li>
            <li>· Timeline de cada alerta con responsables</li>
            <li>· Reglas de alerta configurables por rol</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-wider">Acceso demo</p>
          </div>
          <h2 className="mt-3 text-2xl font-semibold">Selecciona tu rol</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No se requiere contraseña: es una demostración con datos simulados.
          </p>

          <div className="mt-6 space-y-3">
            {usuariosDemo.map((u) => (
              <button
                key={u.rol}
                onClick={() => setRol(u.rol)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-colors",
                  rol === u.rol
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface hover:border-primary/50 hover:bg-accent",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold">{u.rol}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{u.nombre}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{u.descripcion}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="correo">
              Correo corporativo
            </label>
            <input
              id="correo"
              readOnly
              value={usuario.correo}
              className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-muted-foreground"
            />
          </div>

          <button
            onClick={entrar}
            disabled={enviando}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando ? "Ingresando…" : `Ingresar como ${rol}`}
          </button>
        </section>
      </div>
    </div>
  );
}
