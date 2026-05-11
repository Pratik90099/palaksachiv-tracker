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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_call_logs: {
        Row: {
          caller_email: string | null
          created_at: string
          error_code: string | null
          function_name: string
          id: string
          latency_ms: number | null
          provider: string
          status: number
        }
        Insert: {
          caller_email?: string | null
          created_at?: string
          error_code?: string | null
          function_name: string
          id?: string
          latency_ms?: number | null
          provider: string
          status: number
        }
        Update: {
          caller_email?: string | null
          created_at?: string
          error_code?: string | null
          function_name?: string
          id?: string
          latency_ms?: number | null
          provider?: string
          status?: number
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          generated_at: string
          generated_by: string | null
          id: string
          payload: Json
        }
        Insert: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          payload: Json
        }
        Update: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
          short_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          short_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          short_name?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          created_at: string
          division: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          division: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          division?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      document_uploads: {
        Row: {
          ai_result: Json | null
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          processing_mode: string
          storage_path: string | null
          uploaded_by: string | null
        }
        Insert: {
          ai_result?: Json | null
          created_at?: string
          file_name: string
          file_size?: number
          file_type: string
          id?: string
          processing_mode?: string
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Update: {
          ai_result?: Json | null
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          processing_mode?: string
          storage_path?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      external_identities: {
        Row: {
          created_at: string
          email: string | null
          external_uid: string
          id: string
          is_active: boolean
          last_login_at: string | null
          officer_id: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          external_uid: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          officer_id: string
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          external_uid?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          officer_id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_identities_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_identities_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_identities_officer_id_fkey"
            columns: ["officer_id"]
            isOneToOne: false
            referencedRelation: "officers_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_secretaries: {
        Row: {
          created_at: string
          designation: string | null
          district_id: string | null
          email: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          designation?: string | null
          district_id?: string | null
          email?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          designation?: string | null
          district_id?: string | null
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_secretaries_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          notes: string | null
          owner: string | null
          short_code: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          notes?: string | null
          owner?: string | null
          short_code?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          notes?: string | null
          owner?: string | null
          short_code?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          officer_id: string | null
          role: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          officer_id?: string | null
          role: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          officer_id?: string | null
          role?: string
        }
        Relationships: []
      }
      meeting_minutes: {
        Row: {
          action_items: string[] | null
          agenda: string | null
          attendees: string[] | null
          chaired_by: string | null
          created_at: string
          decisions: string[] | null
          id: string
          meeting_date: string
          minutes_text: string
          related_project_id: string | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          action_items?: string[] | null
          agenda?: string | null
          attendees?: string[] | null
          chaired_by?: string | null
          created_at?: string
          decisions?: string[] | null
          id?: string
          meeting_date?: string
          minutes_text: string
          related_project_id?: string | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          action_items?: string[] | null
          agenda?: string | null
          attendees?: string[] | null
          chaired_by?: string | null
          created_at?: string
          decisions?: string[] | null
          id?: string
          meeting_date?: string
          minutes_text?: string
          related_project_id?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          recipient_officer_id: string | null
          related_project_id: string | null
          related_task_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          recipient_officer_id?: string | null
          related_project_id?: string | null
          related_task_id?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          recipient_officer_id?: string | null
          related_project_id?: string | null
          related_task_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      officers: {
        Row: {
          created_at: string
          department_id: string | null
          designation: string | null
          district_id: string | null
          email: string | null
          id: string
          is_active: boolean
          is_cso_admin: boolean
          is_palak_sachiv: boolean
          name: string
          parichay_uid: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          designation?: string | null
          district_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_cso_admin?: boolean
          is_palak_sachiv?: boolean
          name: string
          parichay_uid?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          designation?: string | null
          district_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_cso_admin?: boolean
          is_palak_sachiv?: boolean
          name?: string
          parichay_uid?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "officers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officers_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      project_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_departments: {
        Row: {
          department_id: string
          id: string
          project_id: string
        }
        Insert: {
          department_id: string
          id?: string
          project_id: string
        }
        Update: {
          department_id?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_departments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_districts: {
        Row: {
          district_id: string
          id: string
          project_id: string
        }
        Insert: {
          district_id: string
          id?: string
          project_id: string
        }
        Update: {
          district_id?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_districts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_districts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tag_assignments: {
        Row: {
          id: string
          project_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          project_id: string
          tag_id: string
        }
        Update: {
          id?: string
          project_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tag_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "project_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_officer_id: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_critical: boolean
          is_goi_pending: boolean
          priority: string
          start_date: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_officer_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_critical?: boolean
          is_goi_pending?: boolean
          priority?: string
          start_date?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_officer_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_critical?: boolean
          is_goi_pending?: boolean
          priority?: string
          start_date?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "officers_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "officers_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      session_officer_map: {
        Row: {
          auth_uid: string
          created_at: string
          officer_id: string
        }
        Insert: {
          auth_uid: string
          created_at?: string
          officer_id: string
        }
        Update: {
          auth_uid?: string
          created_at?: string
          officer_id?: string
        }
        Relationships: []
      }
      task_departments: {
        Row: {
          department_id: string
          id: string
          task_id: string
        }
        Insert: {
          department_id: string
          id?: string
          task_id: string
        }
        Update: {
          department_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_departments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_districts: {
        Row: {
          district_id: string
          id: string
          task_id: string
        }
        Insert: {
          district_id: string
          id?: string
          task_id: string
        }
        Update: {
          district_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_districts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_districts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agency: string | null
          assigned_officer_id: string | null
          created_at: string
          description: string | null
          display_id: string | null
          id: string
          is_critical: boolean
          is_goi_pending: boolean
          priority: string
          project_id: string | null
          responsible_officer: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agency?: string | null
          assigned_officer_id?: string | null
          created_at?: string
          description?: string | null
          display_id?: string | null
          id?: string
          is_critical?: boolean
          is_goi_pending?: boolean
          priority?: string
          project_id?: string | null
          responsible_officer?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agency?: string | null
          assigned_officer_id?: string | null
          created_at?: string
          description?: string | null
          display_id?: string | null
          id?: string
          is_critical?: boolean
          is_goi_pending?: boolean
          priority?: string
          project_id?: string | null
          responsible_officer?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "officers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "officers_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_officer_id_fkey"
            columns: ["assigned_officer_id"]
            isOneToOne: false
            referencedRelation: "officers_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          created_at: string
          district_id: string
          gs_id: string | null
          id: string
          issues_logged: number
          observations: string | null
          quarter: string
          rating: string | null
          status: string
          visit_date: string | null
        }
        Insert: {
          created_at?: string
          district_id: string
          gs_id?: string | null
          id?: string
          issues_logged?: number
          observations?: string | null
          quarter: string
          rating?: string | null
          status?: string
          visit_date?: string | null
        }
        Update: {
          created_at?: string
          district_id?: string
          gs_id?: string | null
          id?: string
          issues_logged?: number
          observations?: string | null
          quarter?: string
          rating?: string | null
          status?: string
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_gs_id_fkey"
            columns: ["gs_id"]
            isOneToOne: false
            referencedRelation: "guardian_secretaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_gs_id_fkey"
            columns: ["gs_id"]
            isOneToOne: false
            referencedRelation: "guardian_secretaries_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      guardian_secretaries_public: {
        Row: {
          designation: string | null
          district_id: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          designation?: string | null
          district_id?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          designation?: string | null
          district_id?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardian_secretaries_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      officers_admin: {
        Row: {
          created_at: string | null
          department_id: string | null
          designation: string | null
          district_id: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          is_cso_admin: boolean | null
          is_palak_sachiv: boolean | null
          name: string | null
          parichay_uid: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          designation?: string | null
          district_id?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          is_cso_admin?: boolean | null
          is_palak_sachiv?: boolean | null
          name?: string | null
          parichay_uid?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          designation?: string | null
          district_id?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          is_cso_admin?: boolean | null
          is_palak_sachiv?: boolean | null
          name?: string | null
          parichay_uid?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officers_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      officers_directory: {
        Row: {
          department_id: string | null
          designation: string | null
          district_id: string | null
          id: string | null
          is_active: boolean | null
          is_cso_admin: boolean | null
          is_palak_sachiv: boolean | null
          name: string | null
          role: string | null
        }
        Insert: {
          department_id?: string | null
          designation?: string | null
          district_id?: string | null
          id?: string | null
          is_active?: boolean | null
          is_cso_admin?: boolean | null
          is_palak_sachiv?: boolean | null
          name?: string | null
          role?: string | null
        }
        Update: {
          department_id?: string | null
          designation?: string | null
          district_id?: string | null
          id?: string | null
          is_active?: boolean | null
          is_cso_admin?: boolean | null
          is_palak_sachiv?: boolean | null
          name?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "officers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officers_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      bind_session_officer: {
        Args: { _officer_id: string }
        Returns: undefined
      }
      consume_pending_otp_for_dispatch: {
        Args: { _otp_id: string }
        Returns: Json
      }
      current_officer_id: { Args: never; Returns: string }
      find_login_officer: {
        Args: { _email: string; _role: string }
        Returns: {
          created_at: string
          department_id: string | null
          designation: string | null
          district_id: string | null
          email: string | null
          id: string
          is_active: boolean
          is_cso_admin: boolean
          is_palak_sachiv: boolean
          name: string
          parichay_uid: string | null
          phone: string | null
          role: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "officers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      request_login_otp: {
        Args: { _email: string; _role: string }
        Returns: Json
      }
      verify_login_otp: {
        Args: { _code: string; _email: string; _role: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
