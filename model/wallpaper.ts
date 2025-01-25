import { Wallpaper } from "@/types/wallpaper";
import { getDb } from "./db";

export async function insertWallpaper(wallpaper: Wallpaper) {
  const supabase = getDb();
  const { data, error } = await supabase
    .from('wallpapers')
    .insert({
      user_email: wallpaper.user_email || 'anonymous@aiwallpaper.com',
      img_description: wallpaper.img_description,
      img_size: wallpaper.img_size,
      img_url: wallpaper.img_url,
      llm_name: wallpaper.llm_name,
      llm_params: wallpaper.llm_params,
      created_at: wallpaper.created_at || new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getWallpapers(userEmail?: string) {
  const supabase = getDb();
  const query = supabase
    .from('wallpapers')
    .select('*')
    .order('created_at', { ascending: false });

  if (userEmail) {
    query.eq('user_email', userEmail);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

export async function getWallpaperById(id: number) {
  const supabase = getDb();
  const { data, error } = await supabase
    .from('wallpapers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}