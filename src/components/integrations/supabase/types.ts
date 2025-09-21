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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cash_boxes: {
        Row: {
          closed_amount: number | null
          closed_at: string | null
          id: number
          initial_amount: number | null
          opened_at: string | null
          opened_by: string | null
          starting_amount: number | null
        }
        Insert: {
          closed_amount?: number | null
          closed_at?: string | null
          id?: number
          initial_amount?: number | null
          opened_at?: string | null
          opened_by?: string | null
          starting_amount?: number | null
        }
        Update: {
          closed_amount?: number | null
          closed_at?: string | null
          id?: number
          initial_amount?: number | null
          opened_at?: string | null
          opened_by?: string | null
          starting_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_boxes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          cash_box_id: number | null
          category: string | null
          created_at: string | null
          description: string | null
          id: number
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          cash_box_id?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          cash_box_id?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_box_id_fkey"
            columns: ["cash_box_id"]
            isOneToOne: false
            referencedRelation: "cash_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          due_date: string | null
          id: number
          paid: boolean | null
          paid_at: string | null
          supplier_id: number | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          paid?: boolean | null
          paid_at?: string | null
          supplier_id?: number | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          paid?: boolean | null
          paid_at?: string | null
          supplier_id?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: number
          order_id: number | null
          product_id: number | null
          quantity: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          id?: number
          order_id?: number | null
          product_id?: number | null
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          id?: number
          order_id?: number | null
          product_id?: number | null
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_id: string | null
          id: number
          notes: string | null
          status: string | null
          table_number: string | null
          total: number | null
          type: string
          payment_method: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_id?: string | null
          id?: number
          notes?: string | null
          status?: string | null
          table_number?: string | null
          total?: number | null
          type: string
          payment_method?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_id?: string | null
          id?: number
          notes?: string | null
          status?: string | null
          table_number?: string | null
          total?: number | null
          type?: string
          payment_method?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_complements: {
        Row: {
          id: number
          name: string
          price: number | null
          product_id: number | null
        }
        Insert: {
          id?: number
          name: string
          price?: number | null
          product_id?: number | null
        }
        Update: {
          id?: number
          name?: string
          price?: number | null
          product_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_complements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category_id: number | null
          cost_price: number | null
          created_at: string | null
          id: number
          name: string
          price: number
          sku: string | null
          stock: number | null
        }
        Insert: {
          active?: boolean | null
          category_id?: number | null
          cost_price?: number | null
          created_at?: string | null
          id?: number
          name: string
          price: number
          sku?: string | null
          stock?: number | null
        }
        Update: {
          active?: boolean | null
          category_id?: number | null
          cost_price?: number | null
          created_at?: string | null
          id?: number
          name?: string
          price?: number
          sku?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact: string | null
          id: number
          name: string
        }
        Insert: {
          contact?: string | null
          id?: number
          name: string
        }
        Update: {
          contact?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      fixed_costs: {
        Row: {
          id: string
          name: string
          amount: number
          frequency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          amount: number
          frequency: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          amount?: number
          frequency?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      variable_costs: {
        Row: {
          id: string
          name: string
          amount: number
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          amount: number
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          amount?: number
          date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_expenses: {
        Row: {
          id: string
          user_id: string
          supplier_id: string
          description: string
          amount: number
          issue_date: string
          due_date: string | null
          payment_date: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          supplier_id: string
          description: string
          amount: number
          issue_date?: string
          due_date?: string | null
          payment_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          supplier_id?: string
          description?: string
          amount?: number
          issue_date?: string
          due_date?: string | null
          payment_date?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_goals: {
        Row: {
          id: string
          monthly_revenue: number
          monthly_expenses: number
          profit_margin: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          monthly_revenue: number
          monthly_expenses: number
          profit_margin: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          monthly_revenue?: number
          monthly_expenses?: number
          profit_margin?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      balance_sheet_manual_entries: {
        Row: {
          id: string
          equipment: number
          loans: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          equipment: number
          loans: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          equipment?: number
          loans?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          credit_balance: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          credit_balance?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          credit_balance?: number | null
          created_at?: string | null
          updated_at?: string | null
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
