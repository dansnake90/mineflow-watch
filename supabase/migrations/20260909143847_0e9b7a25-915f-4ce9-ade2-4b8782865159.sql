CREATE TABLE public.turnos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_turno TEXT NOT NULL,
  grupo TEXT,
  shift_id TEXT,
  inicio TIMESTAMPTZ,
  fin TIMESTAMPTZ,
  archivo TEXT NOT NULL,
  filas INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ciclos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id UUID NOT NULL REFERENCES public.turnos(id) ON DELETE CASCADE,
  camion TEXT NOT NULL,
  pala TEXT,
  operador_camion TEXT,
  operador_pala TEXT,
  material TEXT,
  grupo_material TEXT,
  es_mineral BOOLEAN,
  lugar_carga TEXT,
  unidad_carga TEXT,
  toneladas NUMERIC,
  capacidad NUMERIC,
  ts_asignacion TIMESTAMPTZ,
  ts_llegada TIMESTAMPTZ,
  ts_carguio TIMESTAMPTZ,
  ts_lleno TIMESTAMPTZ,
  espera_cola INTEGER,
  tiempo_aculatamiento INTEGER,
  tiempo_carguio INTEGER,
  ociosidad_pala INTEGER,
  ociosidad_camion INTEGER,
  viaje_vacio INTEGER,
  viaje_vacio_esperado INTEGER,
  distancia INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ciclos_turno_idx ON public.ciclos (turno_id);

CREATE TABLE public.eventos_alerta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turno_id UUID REFERENCES public.turnos(id) ON DELETE CASCADE,
  alerta_clave TEXT NOT NULL,
  estado TEXT NOT NULL,
  detalle TEXT,
  autor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX eventos_alerta_clave_idx ON public.eventos_alerta (alerta_clave);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.turnos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ciclos TO anon, authenticated;
GRANT SELECT, INSERT ON public.eventos_alerta TO anon, authenticated;
GRANT ALL ON public.turnos TO service_role;
GRANT ALL ON public.ciclos TO service_role;
GRANT ALL ON public.eventos_alerta TO service_role;

ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_alerta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prototipo: turnos abiertos" ON public.turnos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Prototipo: ciclos abiertos" ON public.ciclos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Prototipo: eventos visibles" ON public.eventos_alerta FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Prototipo: eventos registrables" ON public.eventos_alerta FOR INSERT TO anon, authenticated WITH CHECK (true);