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
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversation_message: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          space_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          space_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_message_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "space"
            referencedColumns: ["id"]
          },
        ]
      }
      observation: {
        Row: {
          category: string | null
          created_at: string | null
          details: string
          id: string
          label: string
          metadata: Json | null
          room_id: string | null
          severity: string | null
          space_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          details: string
          id?: string
          label: string
          metadata?: Json | null
          room_id?: string | null
          severity?: string | null
          space_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          details?: string
          id?: string
          label?: string
          metadata?: Json | null
          room_id?: string | null
          severity?: string | null
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observation_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room"
            referencedColumns: ["id"]
          },
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
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
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
          area_sqm: number | null
          capacity: number | null
          created_at: string | null
          floor_number: number | null
          id: string
          metadata: Json | null
          name: string
          room_type: string | null
          space_id: string
          updated_at: string | null
        }
        Insert: {
          area_sqm?: number | null
          capacity?: number | null
          created_at?: string | null
          floor_number?: number | null
          id?: string
          metadata?: Json | null
          name: string
          room_type?: string | null
          space_id: string
          updated_at?: string | null
        }
        Update: {
          area_sqm?: number | null
          capacity?: number | null
          created_at?: string | null
          floor_number?: number | null
          id?: string
          metadata?: Json | null
          name?: string
          room_type?: string | null
          space_id?: string
          updated_at?: string | null
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
          contact_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          space_type: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          space_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          space_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact"
            referencedColumns: ["id"]
          },
        ]
      }
      space_3d_model: {
        Row: {
          created_at: string | null
          display_order: number | null
          file_name: string
          file_size: number | null
          id: string
          is_primary: boolean | null
          space_id: string
          storage_path: string | null
          storage_url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          file_name: string
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          space_id: string
          storage_path?: string | null
          storage_url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          file_name?: string
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          space_id?: string
          storage_path?: string | null
          storage_url?: string
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
          created_at: string | null
          id: string
          image_path: string | null
          image_url: string | null
          name: string
          required: boolean
          room_number: number
          room_type: string
          space_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          name: string
          required?: boolean
          room_number?: number
          room_type: string
          space_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          name?: string
          required?: boolean
          room_number?: number
          room_type?: string
          space_id?: string
          status?: string
          updated_at?: string | null
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
          created_at: string | null
          extracted_data: Json | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          is_floorplan_related_doc: boolean | null
          metadata: Json | null
          mime_type: string | null
          processing_status: string | null
          room_id: string | null
          space_id: string
          storage_path: string | null
          storage_url: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string | null
          extracted_data?: Json | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          is_floorplan_related_doc?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          processing_status?: string | null
          room_id?: string | null
          space_id: string
          storage_path?: string | null
          storage_url: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_floorplan_related_doc?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          processing_status?: string | null
          room_id?: string | null
          space_id?: string
          storage_path?: string | null
          storage_url?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_document_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room"
            referencedColumns: ["id"]
          },
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
          created_at: string | null
          display_order: number | null
          file_name: string | null
          id: string
          is_primary: boolean | null
          space_id: string
          storage_path: string | null
          storage_url: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          file_name?: string | null
          id?: string
          is_primary?: boolean | null
          space_id: string
          storage_path?: string | null
          storage_url: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          file_name?: string | null
          id?: string
          is_primary?: boolean | null
          space_id?: string
          storage_path?: string | null
          storage_url?: string
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
    Enums: {},
  },
} as const
