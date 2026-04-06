/**
 * Schema `learning` (EAD) — alinhado ao projeto Supabase via MCP.
 * Mesclado em `client.ts` com os tipos legados de `types.ts`.
 */
export type LearningSchema = {
  Tables: {
    categories: {
      Row: {
        id: string
        name: string
        slug: string
        created_at: string | null
      }
      Insert: {
        id?: string
        name: string
        slug: string
        created_at?: string | null
      }
      Update: {
        id?: string
        name?: string
        slug?: string
        created_at?: string | null
      }
      Relationships: []
    }
    course_categories: {
      Row: {
        course_id: string
        category_id: string
      }
      Insert: {
        course_id: string
        category_id: string
      }
      Update: {
        course_id?: string
        category_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "course_categories_category_id_fkey"
          columns: ["category_id"]
          isOneToOne: false
          referencedRelation: "categories"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "course_categories_course_id_fkey"
          columns: ["course_id"]
          isOneToOne: false
          referencedRelation: "courses"
          referencedColumns: ["id"]
        },
      ]
    }
    course_progress: {
      Row: {
        user_id: string
        course_id: string
        completed_lessons: number | null
        total_lessons: number | null
        percent: number | null
        updated_at: string | null
      }
      Insert: {
        user_id: string
        course_id: string
        completed_lessons?: number | null
        total_lessons?: number | null
        percent?: number | null
        updated_at?: string | null
      }
      Update: {
        user_id?: string
        course_id?: string
        completed_lessons?: number | null
        total_lessons?: number | null
        percent?: number | null
        updated_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "course_progress_course_id_fkey"
          columns: ["course_id"]
          isOneToOne: false
          referencedRelation: "courses"
          referencedColumns: ["id"]
        },
      ]
    }
    courses: {
      Row: {
        id: string
        title: string
        description: string | null
        thumbnail_url: string | null
        vimeo_folder_id: string | null
        published: boolean | null
        created_at: string | null
      }
      Insert: {
        id?: string
        title: string
        description?: string | null
        thumbnail_url?: string | null
        vimeo_folder_id?: string | null
        published?: boolean | null
        created_at?: string | null
      }
      Update: {
        id?: string
        title?: string
        description?: string | null
        thumbnail_url?: string | null
        vimeo_folder_id?: string | null
        published?: boolean | null
        created_at?: string | null
      }
      Relationships: []
    }
    lesson_progress: {
      Row: {
        id: string
        user_id: string
        lesson_id: string
        watched_seconds: number | null
        last_position_seconds: number | null
        completed: boolean | null
        completed_at: string | null
        updated_at: string | null
      }
      Insert: {
        id?: string
        user_id: string
        lesson_id: string
        watched_seconds?: number | null
        last_position_seconds?: number | null
        completed?: boolean | null
        completed_at?: string | null
        updated_at?: string | null
      }
      Update: {
        id?: string
        user_id?: string
        lesson_id?: string
        watched_seconds?: number | null
        last_position_seconds?: number | null
        completed?: boolean | null
        completed_at?: string | null
        updated_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "lesson_progress_lesson_id_fkey"
          columns: ["lesson_id"]
          isOneToOne: false
          referencedRelation: "lessons"
          referencedColumns: ["id"]
        },
      ]
    }
    lessons: {
      Row: {
        id: string
        module_id: string
        title: string
        description: string | null
        vimeo_video_id: string
        duration_seconds: number | null
        position: number
        is_preview: boolean | null
        created_at: string | null
      }
      Insert: {
        id?: string
        module_id: string
        title: string
        description?: string | null
        vimeo_video_id: string
        duration_seconds?: number | null
        position: number
        is_preview?: boolean | null
        created_at?: string | null
      }
      Update: {
        id?: string
        module_id?: string
        title?: string
        description?: string | null
        vimeo_video_id?: string
        duration_seconds?: number | null
        position?: number
        is_preview?: boolean | null
        created_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "lessons_module_id_fkey"
          columns: ["module_id"]
          isOneToOne: false
          referencedRelation: "modules"
          referencedColumns: ["id"]
        },
      ]
    }
    materials: {
      Row: {
        id: string
        course_id: string | null
        lesson_id: string | null
        title: string
        file_url: string
        type: string | null
        created_at: string | null
      }
      Insert: {
        id?: string
        course_id?: string | null
        lesson_id?: string | null
        title: string
        file_url: string
        type?: string | null
        created_at?: string | null
      }
      Update: {
        id?: string
        course_id?: string | null
        lesson_id?: string | null
        title?: string
        file_url?: string
        type?: string | null
        created_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "materials_course_id_fkey"
          columns: ["course_id"]
          isOneToOne: false
          referencedRelation: "courses"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "materials_lesson_id_fkey"
          columns: ["lesson_id"]
          isOneToOne: false
          referencedRelation: "lessons"
          referencedColumns: ["id"]
        },
      ]
    }
    modules: {
      Row: {
        id: string
        course_id: string
        title: string
        description: string | null
        position: number
        created_at: string | null
      }
      Insert: {
        id?: string
        course_id: string
        title: string
        description?: string | null
        position: number
        created_at?: string | null
      }
      Update: {
        id?: string
        course_id?: string
        title?: string
        description?: string | null
        position?: number
        created_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "modules_course_id_fkey"
          columns: ["course_id"]
          isOneToOne: false
          referencedRelation: "courses"
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
