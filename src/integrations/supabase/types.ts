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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contact: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      observation: {
        Row: {
          created_at: string
          description: string | null
          id: string
          resolved: boolean | null
          severity: Database["public"]["Enums"]["observation_severity"]
          space_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          resolved?: boolean | null
          severity?: Database["public"]["Enums"]["observation_severity"]
          space_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          resolved?: boolean | null
          severity?: Database["public"]["Enums"]["observation_severity"]
          space_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "observation_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "space"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room: {
        Row: {
          created_at: string
          id: string
          name: string
          room_number: number | null
          room_type: string | null
          space_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          room_number?: number | null
          room_type?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          room_number?: number | null
          room_type?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "space"
            referencedColumns: ["id"]
          },
        ]
      }
      space: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          space_type: Database["public"]["Enums"]["space_type"]
          status: Database["public"]["Enums"]["space_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          space_type?: Database["public"]["Enums"]["space_type"]
          status?: Database["public"]["Enums"]["space_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          space_type?: Database["public"]["Enums"]["space_type"]
          status?: Database["public"]["Enums"]["space_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      space_3d_model: {
        Row: {
          created_at: string
          display_order: number | null
          file_name: string | null
          file_size: number | null
          id: string
          is_primary: boolean | null
          space_id: string
          storage_path: string | null
          storage_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          space_id: string
          storage_path?: string | null
          storage_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          space_id?: string
          storage_path?: string | null
          storage_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_3d_model_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "space"
            referencedColumns: ["id"]
          },
        ]
      }
      space_amenity: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          image_url: string | null
          name: string
          required: boolean | null
          room_number: number | null
          room_type: string | null
          space_id: string
          status: Database["public"]["Enums"]["amenity_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          name: string
          required?: boolean | null
          room_number?: number | null
          room_type?: string | null
          space_id: string
          status?: Database["public"]["Enums"]["amenity_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          name?: string
          required?: boolean | null
          room_number?: number | null
          room_type?: string | null
          space_id?: string
          status?: Database["public"]["Enums"]["amenity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_amenity_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "space"
            referencedColumns: ["id"]
          },
        ]
      }
      space_document: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          is_floorplan_related_doc: boolean | null
          metadata: Json | null
          mime_type: string | null
          processing_status: Database["public"]["Enums"]["processing_status"]
          space_id: string
          storage_path: string
          storage_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_floorplan_related_doc?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          space_id: string
          storage_path: string
          storage_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_floorplan_related_doc?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          processing_status?: Database["public"]["Enums"]["processing_status"]
          space_id?: string
          storage_path?: string
          storage_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_document_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "space"
            referencedColumns: ["id"]
          },
        ]
      }
      space_image: {
        Row: {
          created_at: string
          display_order: number | null
          file_name: string | null
          id: string
          is_primary: boolean | null
          space_id: string
          storage_path: string | null
          storage_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          file_name?: string | null
          id?: string
          is_primary?: boolean | null
          space_id: string
          storage_path?: string | null
          storage_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          file_name?: string | null
          id?: string
          is_primary?: boolean | null
          space_id?: string
          storage_path?: string | null
          storage_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_image_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "space"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      amenity_status:
        | "pending"
        | "verified"
        | "missing"
        | "not_applicable"
        | "provided"
        | "not_provided"
        | "unknown"
      observation_severity: "info" | "warning" | "critical"
      processing_status: "pending" | "processing" | "completed" | "failed"
      space_status: "draft" | "processing" | "ready" | "published" | "active"
      space_type: "property" | "event_space"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      amenity_status: [
        "pending",
        "verified",
        "missing",
        "not_applicable",
        "provided",
        "not_provided",
        "unknown",
      ],
      observation_severity: ["info", "warning", "critical"],
      processing_status: ["pending", "processing", "completed", "failed"],
      space_status: ["draft", "processing", "ready", "published", "active"],
      space_type: ["property", "event_space"],
    },
  },
} as const
