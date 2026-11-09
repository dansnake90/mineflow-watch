export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ciclos: {
        Row: {
          camion: string
          capacidad: number | null
          created_at: string
          distancia: number | null
          es_mineral: boolean | null
          espera_cola: number | null
          grupo_material: string | null
          id: string
          lugar_carga: string | null
          material: string | null
          ociosidad_camion: number | null
          ociosidad_pala: number | null
          operador_camion: string | null
          operador_pala: string | null
          pala: string | null
          tiempo_aculatamiento: number | null
          tiempo_carguio: number | null
          toneladas: number | null
          ts_asignacion: string | null
          ts_carguio: string | null
          ts_llegada: string | null
          ts_lleno: string | null
          turno_id: string
          unidad_carga: string | null
          viaje_vacio: number | null
          viaje_vacio_esperado: number | null
        }
        Insert: {
          camion: string
          capacidad?: number | null
          created_at?: string
          distancia?: number | null
          es_mineral?: boolean | null
          espera_cola?: number | null
          grupo_material?: string | null
          id?: string
          lugar_carga?: string | null
          material?: string | null
          ociosidad_camion?: number | null
          ociosidad_pala?: number | null
          operador_camion?: string | null
          operador_pala?: string | null
          pala?: string | null
          tiempo_aculatamiento?: number | null
          tiempo_carguio?: number | null
          toneladas?: number | null
          ts_asignacion?: string | null
          ts_carguio?: string | null
          ts_llegada?: string | null
          ts_lleno?: string | null
          turno_id: string
          unidad_carga?: string | null
          viaje_vacio?: number | null
          viaje_vacio_esperado?: number | null
        }
        Update: {
          camion?: string
          capacidad?: number | null
          created_at?: string
          distancia?: number | null
          es_mineral?: boolean | null
          espera_cola?: number | null
          grupo_material?: string | null
          id?: string
          lugar_carga?: string | null
          material?: string | null
          ociosidad_camion?: number | null
          ociosidad_pala?: number | null
          operador_camion?: string | null
          operador_pala?: string | null
          pala?: string | null
          tiempo_aculatamiento?: number | null
          tiempo_carguio?: number | null
          toneladas?: number | null
          ts_asignacion?: string | null
          ts_carguio?: string | null
          ts_llegada?: string | null
          ts_lleno?: string | null
          turno_id?: string
          unidad_carga?: string | null
          viaje_vacio?: number | null
          viaje_vacio_esperado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ciclos_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_alerta: {
        Row: {
          alerta_clave: string
          autor: string | null
          created_at: string
          detalle: string | null
          estado: string
          id: string
          turno_id: string | null
        }
        Insert: {
          alerta_clave: string
          autor?: string | null
          created_at?: string
          detalle?: string | null
          estado: string
          id?: string
          turno_id?: string | null
        }
        Update: {
          alerta_clave?: string
          autor?: string | null
          created_at?: string
          detalle?: string | null
          estado?: string
          id?: string
          turno_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_alerta_turno_id_fkey"
            columns: ["turno_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          activo: boolean
          archivo: string
          created_at: string
          filas: number
          fin: string | null
          grupo: string | null
          id: string
          inicio: string | null
          nombre_turno: string
          shift_id: string | null
        }
        Insert: {
          activo?: boolean
          archivo: string
          created_at?: string
          filas?: number
          fin?: string | null
          grupo?: string | null
          id?: string
          inicio?: string | null
          nombre_turno: string
          shift_id?: string | null
        }
        Update: {
          activo?: boolean
          archivo?: string
          created_at?: string
          filas?: number
          fin?: string | null
          grupo?: string | null
          id?: string
          inicio?: string | null
          nombre_turno?: string
          shift_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
