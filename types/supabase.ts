export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Catalogue: {
        Row: {
          Availability: string | null
          Category: string | null
          Category_CH: string | null
          CatelogueID: number
          Country_of_origin: string | null
          Country_of_origin_CH: string | null
          Item_code: string | null
          Product_description: string | null
          Product_description_CH: string | null
          UOM: string | null
          Variation: string | null
          Variation_CH: string | null
          Weight: string | null
        }
        Insert: {
          Availability?: string | null
          Category?: string | null
          Category_CH?: string | null
          CatelogueID: number
          Country_of_origin?: string | null
          Country_of_origin_CH?: string | null
          Item_code?: string | null
          Product_description?: string | null
          Product_description_CH?: string | null
          UOM?: string | null
          Variation?: string | null
          Variation_CH?: string | null
          Weight?: string | null
        }
        Update: {
          Availability?: string | null
          Category?: string | null
          Category_CH?: string | null
          CatelogueID?: number
          Country_of_origin?: string | null
          Country_of_origin_CH?: string | null
          Item_code?: string | null
          Product_description?: string | null
          Product_description_CH?: string | null
          UOM?: string | null
          Variation?: string | null
          Variation_CH?: string | null
          Weight?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: number
          imageUrl: string
          name: string
          name_ch: string | null
          products: string[] | null
        }
        Insert: {
          created_at?: string
          id?: number
          imageUrl: string
          name: string
          name_ch?: string | null
          products?: string[] | null
        }
        Update: {
          created_at?: string
          id?: number
          imageUrl?: string
          name?: string
          name_ch?: string | null
          products?: string[] | null
        }
        Relationships: []
      }
      categories_bk: {
        Row: {
          created_at: string
          id: number
          imageurl: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          imageurl: string
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          imageurl?: string
          name?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          chineseName: string | null
          country: string
          id: number
          is_active: boolean | null
        }
        Insert: {
          chineseName?: string | null
          country: string
          id?: number
          is_active?: boolean | null
        }
        Update: {
          chineseName?: string | null
          country?: string
          id?: number
          is_active?: boolean | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: number
          Category: string | null
          Category_CH: string | null
          "Item Code": string | null
          Product: string | null
          Product_CH: string | null
          Variation: string | null
          Variation_CH: string | null
          Weight: string | null
          UOM: string | null
          Country: string | null
          Country_CH: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          Category?: string | null
          Category_CH?: string | null
          "Item Code"?: string | null
          Product?: string | null
          Product_CH?: string | null
          Variation?: string | null
          Variation_CH?: string | null
          Weight?: string | null
          UOM?: string | null
          Country?: string | null
          Country_CH?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          Category?: string | null
          Category_CH?: string | null
          "Item Code"?: string | null
          Product?: string | null
          Product_CH?: string | null
          Variation?: string | null
          Variation_CH?: string | null
          Weight?: string | null
          UOM?: string | null
          Country?: string | null
          Country_CH?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_duplicate_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products_duplicate: {
        Row: {
          availability: boolean
          category: number
          created_at: string
          heroImage: string
          id: number
          imagesUrl: string
          leadTime: number | null
          maxQuantity: number
          moq: number | null
          origin: string | null
          price: number
          slug: string
          title: string
        }
        Insert: {
          availability: boolean
          category: number
          created_at?: string
          heroImage: string
          id?: number
          imagesUrl: string
          leadTime?: number | null
          maxQuantity: number
          moq?: number | null
          origin?: string | null
          price: number
          slug: string
          title: string
        }
        Update: {
          availability?: boolean
          category?: number
          created_at?: string
          heroImage?: string
          id?: number
          imagesUrl?: string
          leadTime?: number | null
          maxQuantity?: number
          moq?: number | null
          origin?: string | null
          price?: number
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_duplicate_category_fkey1"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      SalesOrders: {
        Row: {
          Account_no: string | null
          "Company Name": string | null
          Date: string | null
          Invoice: number | null
          "Item Code": string | null
          "Item Description": string | null
          Qty: number | null
          SalesOrdersID: number
          Subtotal: number | null
          "Unit Price": number | null
          UOM: string | null
        }
        Insert: {
          Account_no?: string | null
          "Company Name"?: string | null
          Date?: string | null
          Invoice?: number | null
          "Item Code"?: string | null
          "Item Description"?: string | null
          Qty?: number | null
          SalesOrdersID: number
          Subtotal?: number | null
          "Unit Price"?: number | null
          UOM?: string | null
        }
        Update: {
          Account_no?: string | null
          "Company Name"?: string | null
          Date?: string | null
          Invoice?: number | null
          "Item Code"?: string | null
          "Item Description"?: string | null
          Qty?: number | null
          SalesOrdersID?: number
          Subtotal?: number | null
          "Unit Price"?: number | null
          UOM?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string
          created_at: string | null
          email: string
          id: string
          role: string | null
        }
        Insert: {
          avatar_url: string
          created_at?: string | null
          email: string
          id: string
          role?: string | null
        }
        Update: {
          avatar_url?: string
          created_at?: string | null
          email?: string
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: number
          name: string
          email: string
          status: boolean
          user_id: string
          created_at: string
          address: string | null
          phone: string | null
        }
        Insert: {
          name: string
          email: string
          status?: boolean
          user_id: string
          created_at?: string
          address?: string | null
          phone?: string | null
        }
        Update: {
          name?: string
          email?: string
          status?: boolean
          user_id?: string
          created_at?: string
          address?: string | null
          phone?: string | null
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
