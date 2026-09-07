import { cn } from "@/lib/utils";
import type { Criticidad, EstadoAlerta } from "@/lib/mineflow-data";
import { useEffect, useState } from "react";

export function EtiquetaCriticidad({ valor, className }: { valor: Criticidad; className?: string }) {
  const estilos: Record<Criticidad, string> = {
    Crítica: "bg-destructive/15 text-destructive border-destructive/40",
    Alta: "bg-warning/15 text-warning border-warning/40",
    Media: "bg-primary/15 text-primary border-primary/40",
    Baja: "bg-info/15 text-info border-info/40",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        estilos[valor],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {valor}
    </span>
  );
}

export function EtiquetaEstado({ valor }: { valor: EstadoAlerta }) {
  const estilos: Record<EstadoAlerta, string> = {
    Nueva: "bg-secondary text-secondary-foreground",
    "En revisión": "bg-info/20 text-info",
    Resuelta: "bg-success/20 text-success",
    Descartada: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold", estilos[valor])}>
      {valor}
    </span>
  );
}

export function EstadoVacio({
  titulo,
  mensaje,
  icono,
}: {
  titulo: string;
  mensaje: string;
  icono?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        {icono ?? "—"}
      </div>
      <h3 className="text-lg font-semibold">{titulo}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{mensaje}</p>
    </div>
  );
}

export function EsqueletoLista({ filas = 4 }: { filas?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 rounded bg-secondary" />
            <div className="h-4 w-16 rounded bg-secondary" />
          </div>
          <div className="mt-3 h-4 w-2/3 rounded bg-secondary" />
          <div className="mt-2 h-3 w-1/3 rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export function useRelojTurno() {
  const [hora, setHora] = useState<string | null>(null);

  useEffect(() => {
    const actualizar = () =>
      setHora(
        new Intl.DateTimeFormat("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    actualizar();
    const id = window.setInterval(actualizar, 1000);
    return () => window.clearInterval(id);
  }, []);

  return hora;
}

export function useCargaSimulada(ms = 700) {
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setCargando(false), ms);
    return () => window.clearTimeout(id);
  }, [ms]);
  return cargando;
}
