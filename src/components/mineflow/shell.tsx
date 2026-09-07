import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Gauge, LogOut, Menu, Settings, Truck, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRelojTurno } from "./ui-comunes";
import { cn } from "@/lib/utils";

const navegacion = [
  { a: "/panel", etiqueta: "Panel de alertas", Icono: Bell },
  { a: "/ajustes", etiqueta: "Ajustes y reglas", Icono: Settings },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const { sesion, listo, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const hora = useRelojTurno();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ruta = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (listo && !sesion) void navigate({ to: "/" });
  }, [listo, sesion, navigate]);

  useEffect(() => {
    setMenuAbierto(false);
  }, [ruta]);

  if (!listo || !sesion) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando sala de despacho…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="franja-riesgo h-1 w-full" />
      <header className="sticky top-0 z-30 border-b border-border bg-sidebar/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 lg:flex lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold uppercase leading-none tracking-wide">
                MineFlow Alertas
              </p>
              <p className="truncate text-xs text-muted-foreground">Sala de despacho · Turno A</p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {navegacion.map(({ a, etiqueta, Icono }) => (
              <Link
                key={a}
                to={a}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "bg-accent text-foreground" }}
              >
                <Icono className="h-4 w-4" />
                {etiqueta}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <div className="text-right">
              <p className="font-mono text-base font-semibold tabular-nums">{hora ?? "--:--:--"}</p>
              <p className="text-xs text-muted-foreground">Hora local</p>
            </div>
            <div className="h-9 w-px bg-border" />
            <div className="text-right">
              <p className="text-sm font-semibold">{sesion.nombre}</p>
              <p className="text-xs text-primary">{sesion.rol}</p>
            </div>
            <button
              onClick={() => {
                cerrarSesion();
                void navigate({ to: "/" });
              }}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>

          <button
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Abrir menú"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border text-muted-foreground lg:hidden"
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuAbierto && (
          <div className="border-t border-border bg-sidebar px-4 py-3 lg:hidden">
            <div className="mb-3 flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{sesion.nombre}</p>
                <p className="text-xs text-primary">{sesion.rol}</p>
              </div>
              <p className="font-mono text-sm tabular-nums">{hora ?? "--:--:--"}</p>
            </div>
            <div className="space-y-1">
              {navegacion.map(({ a, etiqueta, Icono }) => (
                <Link
                  key={a}
                  to={a}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  activeProps={{ className: "bg-accent text-foreground" }}
                >
                  <Icono className="h-4 w-4" />
                  {etiqueta}
                </Link>
              ))}
              <button
                onClick={() => {
                  cerrarSesion();
                  void navigate({ to: "/" });
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

export function TarjetaKpi({
  etiqueta,
  valor,
  detalle,
  tono = "neutro",
}: {
  etiqueta: string;
  valor: string;
  detalle: string;
  tono?: "neutro" | "alerta" | "critico" | "ok";
}) {
  const tonos = {
    neutro: "text-foreground",
    alerta: "text-warning",
    critico: "text-destructive",
    ok: "text-success",
  } as const;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">{etiqueta}</p>
        <Gauge className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <p className={cn("mt-2 font-display text-3xl font-bold tabular-nums", tonos[tono])}>{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>
    </div>
  );
}
