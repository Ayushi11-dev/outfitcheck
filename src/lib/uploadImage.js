import { supabase } from "./supabase";

export async function uploadImage(file, userId) {
  // Create unique filename
  const fileName = `${userId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("wardrobe")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("wardrobe")
    .getPublicUrl(fileName);

  return urlData.publicUrl; // use this URL to save in Firestore
}