import { createClient } from '@supabase/supabase-js'

// .env.local に書いたURLとキーを読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabaseとつなぐケーブルを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
