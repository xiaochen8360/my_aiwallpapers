// 从 Supabase 客户端模块导入 createClient 函数，用于创建 Supabase 客户端实例
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// 声明一个全局的 Supabase 客户端变量
let supabase: SupabaseClient;

// 获取 Supabase 客户端的函数，使用单例模式确保只创建一个客户端实例
export function getDb() {
  // 如果客户端还未创建
  if (!supabase) {
    // 直接使用 Supabase 项目 URL 和 anon key
    const supabaseUrl = 'https://swyxedncvebpgaogmazi.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.POSTGRES_URL?.split(':')[2]?.split('@')[0];

    if (!supabaseKey) {
      throw new Error('Missing Supabase anon key');
    }

    console.log('Connecting to Supabase:', supabaseUrl);
    
    // 创建新的 Supabase 客户端实例
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
  }

  // 返回客户端实例
  return supabase;
}