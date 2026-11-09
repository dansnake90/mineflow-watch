import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Rol } from "./mineflow-data";
import { usuariosDemo } from "./mineflow-data";

export type Sesion = { rol: Rol; nombre: string; correo: string };

type AuthValue = {
  sesion: Sesion | null;
  listo: boolean;
  iniciarSesion: (rol: Rol) => void;
  cerrarSesion: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);
const CLAVE = "mineflow-sesion";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const guardada = window.localStorage.getItem(CLAVE);
      if (guardada) setSesion(JSON.parse(guardada) as Sesion);
    } catch {
      /* sin sesión guardada */
    }
    setListo(true);
  }, []);

  const iniciarSesion = useCallback((rol: Rol) => {
    const usuario = usuariosDemo.find((u) => u.rol === rol);
    const base = usuario ?? { rol, nombre: "Usuario demo", correo: "demo@mineflow.cl" };
    const nueva: Sesion = { rol: base.rol, nombre: base.nombre, correo: base.correo };

    setSesion(nueva);
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(nueva));
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  const cerrarSesion = useCallback(() => {
    setSesion(null);
    try {
      window.localStorage.removeItem(CLAVE);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  const valor = useMemo(
    () => ({ sesion, listo, iniciarSesion, cerrarSesion }),
    [sesion, listo, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
