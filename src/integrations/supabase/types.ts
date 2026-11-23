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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          city_id: string
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          city_id: string
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          city_id?: string
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          region: string
          slug: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          region: string
          slug: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          region?: string
          slug?: string
          status?: string
        }
        Relationships: []
      }
      city_settings: {
        Row: {
          city_id: string
          go_live: boolean
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          city_id: string
          go_live?: boolean
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          city_id?: string
          go_live?: boolean
          settings?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_settings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          city_id: string
          client_alias: string
          consent_verified: boolean
          created_at: string
          doc_type: string
          expires_on: string | null
          id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          city_id?: string
          client_alias: string
          consent_verified?: boolean
          created_at?: string
          doc_type: string
          expires_on?: string | null
          id?: string
          storage_path: string
          uploaded_by?: string
        }
        Update: {
          city_id?: string
          client_alias?: string
          consent_verified?: boolean
          created_at?: string
          doc_type?: string
          expires_on?: string | null
          id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      diversion_fund: {
        Row: {
          active: boolean
          balance: number
          city_id: string
          created_at: string
          id: string
          name: string
          total_amount: number
        }
        Insert: {
          active?: boolean
          balance: number
          city_id?: string
          created_at?: string
          id?: string
          name: string
          total_amount: number
        }
        Update: {
          active?: boolean
          balance?: number
          city_id?: string
          created_at?: string
          id?: string
          name?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "diversion_fund_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      diversion_requests: {
        Row: {
          amount_requested: number
          assigned_worker_id: string | null
          barrier_type: string
          city_id: string
          contact_info: Json
          created_at: string
          id: string
          living_situation: string
          status: string
          tracking_code: string
        }
        Insert: {
          amount_requested: number
          assigned_worker_id?: string | null
          barrier_type: string
          city_id?: string
          contact_info?: Json
          created_at?: string
          id?: string
          living_situation: string
          status?: string
          tracking_code: string
        }
        Update: {
          amount_requested?: number
          assigned_worker_id?: string | null
          barrier_type?: string
          city_id?: string
          contact_info?: Json
          created_at?: string
          id?: string
          living_situation?: string
          status?: string
          tracking_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "diversion_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      field_encounters: {
        Row: {
          city_id: string
          client_ref: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          private_clinical_note: string | null
          service_chips: string[]
          synced_from_offline: boolean
          worker_id: string
        }
        Insert: {
          city_id?: string
          client_ref?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          private_clinical_note?: string | null
          service_chips?: string[]
          synced_from_offline?: boolean
          worker_id?: string
        }
        Update: {
          city_id?: string
          client_ref?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          private_clinical_note?: string | null
          service_chips?: string[]
          synced_from_offline?: boolean
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_encounters_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_grants: {
        Row: {
          amount: number
          approved_by: string | null
          city_id: string
          created_at: string
          id: string
          payee_name: string
          payment_method: string
          request_id: string
          requested_by: string
          status: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          city_id?: string
          created_at?: string
          id?: string
          payee_name: string
          payment_method: string
          request_id: string
          requested_by: string
          status?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          city_id?: string
          created_at?: string
          id?: string
          payee_name?: string
          payment_method?: string
          request_id?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_grants_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "micro_grants_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "diversion_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city_id: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          team_zone: string | null
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          team_zone?: string | null
        }
        Update: {
          city_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          team_zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_dispatches: {
        Row: {
          city_id: string
          created_at: string
          destination: string
          dispatched_by: string
          id: string
          pickup_lat: number | null
          pickup_lng: number | null
          ride_type: string
          wellness_check_id: string | null
        }
        Insert: {
          city_id?: string
          created_at?: string
          destination: string
          dispatched_by?: string
          id?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          ride_type: string
          wellness_check_id?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string
          destination?: string
          dispatched_by?: string
          id?: string
          pickup_lat?: number | null
          pickup_lng?: number | null
          ride_type?: string
          wellness_check_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_dispatches_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_dispatches_wellness_check_id_fkey"
            columns: ["wellness_check_id"]
            isOneToOne: false
            referencedRelation: "wellness_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          city_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          city_id: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          city_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_checks: {
        Row: {
          assigned_worker_id: string | null
          city_id: string
          created_at: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          location_text: string
          photo_path: string | null
          status: string
          tracking_code: string
          urgency_tags: string[]
        }
        Insert: {
          assigned_worker_id?: string | null
          city_id?: string
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_text: string
          photo_path?: string | null
          status?: string
          tracking_code: string
          urgency_tags?: string[]
        }
        Update: {
          assigned_worker_id?: string | null
          city_id?: string
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_text?: string
          photo_path?: string | null
          status?: string
          tracking_code?: string
          urgency_tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "wellness_checks_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      city_grant_limit: {
        Args: { _city: string; _default: number; _key: string }
        Returns: number
      }
      current_city_id: { Args: never; Returns: string }
      decide_micro_grant: {
        Args: { _approve: boolean; _grant_id: string }
        Returns: {
          amount: number
          approved_by: string | null
          city_id: string
          created_at: string
          id: string
          payee_name: string
          payment_method: string
          request_id: string
          requested_by: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "micro_grants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_staff: { Args: { _uid: string }; Returns: boolean }
      provision_city: {
        Args: {
          _full_name: string
          _fund_total: number
          _name: string
          _region: string
          _slug: string
          _user_id: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          region: string
          slug: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "cities"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      public_city_config: { Args: { _slug: string }; Returns: Json }
      public_request_status: {
        Args: { _code: string; _slug: string }
        Returns: Json
      }
      purge_all_cities: { Args: never; Returns: undefined }
      purge_city_records: { Args: { _city: string }; Returns: Json }
      purge_my_city_records: { Args: never; Returns: Json }
      staff_role: { Args: { _uid: string }; Returns: string }
      submit_micro_grant: {
        Args: {
          _amount: number
          _method: string
          _payee: string
          _request_id: string
        }
        Returns: {
          amount: number
          approved_by: string | null
          city_id: string
          created_at: string
          id: string
          payee_name: string
          payment_method: string
          request_id: string
          requested_by: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "micro_grants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_city_settings: {
        Args: { _go_live: boolean; _settings: Json }
        Returns: {
          city_id: string
          go_live: boolean
          settings: Json
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "city_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "outreach" | "supervisor"
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
    Enums: {
      app_role: ["outreach", "supervisor"],
    },
  },
} as const
