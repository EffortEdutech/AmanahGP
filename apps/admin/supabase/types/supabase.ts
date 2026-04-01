export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AnyRow = Record<string, any>;

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: AnyRow;
        Insert: AnyRow;
        Update: AnyRow;
        Relationships: [];
      };
    };
    Views: {
      [key: string]: {
        Row: AnyRow;
        Relationships?: [];
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, any>;
        Returns: any;
      };
    };
    Enums: {
      [key: string]: string;
    };
    CompositeTypes: {
      [key: string]: never;
    };
  };
}