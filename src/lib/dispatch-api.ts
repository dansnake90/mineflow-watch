import { supabase } from "@/integrations/supabase/client";
import type { Ciclo, EstadoAlertaDb, LecturaDispatch, Turno } from "./dispatch";

export type EventoAlerta = {
  id: string;
  alerta_clave: string;
  estado: string;
  detalle: string | null;
  autor: string | null;
  created_at: string;
};

export async function listarTurnos(): Promise<Turno[]> {
  const { data, error } = await supabase
    .from("turnos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Turno[];
}

export async function obtenerCiclos(turnoId: string): Promise<Ciclo[]> {
  const { data, error } = await supabase
    .from("ciclos")
    .select("*")
    .eq("turno_id", turnoId)
    .order("ts_lleno", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Ciclo[];
}

export async function listarEventos(turnoId: string): Promise<EventoAlerta[]> {
  const { data, error } = await supabase
    .from("eventos_alerta")
    .select("id, alerta_clave, estado, detalle, autor, created_at")
    .eq("turno_id", turnoId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventoAlerta[];
}

export async function registrarEvento(entrada: {
  turnoId: string;
  clave: string;
  estado: EstadoAlertaDb;
  detalle: string;
  autor: string;
}) {
  const { error } = await supabase.from("eventos_alerta").insert({
    turno_id: entrada.turnoId,
    alerta_clave: entrada.clave,
    estado: entrada.estado,
    detalle: entrada.detalle,
    autor: entrada.autor,
  });
  if (error) throw error;
}

/** Guarda un turno leído del Excel y lo deja como turno activo. */
export async function guardarTurno({ turno, ciclos }: LecturaDispatch): Promise<Turno> {
  const { data, error } = await supabase.from("turnos").insert(turno).select().single();
  if (error) throw error;
  const nuevo = data as Turno;

  const lote = 400;
  for (let i = 0; i < ciclos.length; i += lote) {
    const { error: errorCiclos } = await supabase
      .from("ciclos")
      .insert(ciclos.slice(i, i + lote).map((c) => ({ ...c, turno_id: nuevo.id })));
    if (errorCiclos) {
      await supabase.from("turnos").delete().eq("id", nuevo.id);
      throw errorCiclos;
    }
  }

  await activarTurno(nuevo.id);
  return nuevo;
}

export async function activarTurno(id: string) {
  const { error: apagar } = await supabase.from("turnos").update({ activo: false }).neq("id", id);
  if (apagar) throw apagar;
  const { error } = await supabase.from("turnos").update({ activo: true }).eq("id", id);
  if (error) throw error;
}

export async function eliminarTurno(id: string) {
  const { error } = await supabase.from("turnos").delete().eq("id", id);
  if (error) throw error;
}
