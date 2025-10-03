import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente con service role key para operaciones de backend (Storage upload)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Bucket name para imágenes de trades
export const TRADES_BUCKET = 'trade-images';

/**
 * Sube una imagen a Supabase Storage
 * @param file Buffer o File de la imagen
 * @param userId ID del usuario (para organizar carpetas)
 * @param filename Nombre del archivo
 * @returns URL pública de la imagen
 */
export async function uploadTradeImage(
  file: Buffer | File,
  userId: string,
  filename: string
): Promise<string> {
  const filePath = `${userId}/${Date.now()}-${filename}`;

  const { data, error } = await supabaseAdmin.storage
    .from(TRADES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg' // Ajustar según el tipo de archivo
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Obtener URL pública
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(TRADES_BUCKET)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Elimina una imagen de Supabase Storage
 * @param imageUrl URL completa de la imagen
 */
export async function deleteTradeImage(imageUrl: string): Promise<void> {
  // Extraer el path del archivo desde la URL
  const urlParts = imageUrl.split(`/${TRADES_BUCKET}/`);
  if (urlParts.length !== 2) {
    throw new Error('Invalid image URL format');
  }

  const filePath = urlParts[1];

  const { error } = await supabaseAdmin.storage
    .from(TRADES_BUCKET)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Actualiza una imagen (elimina la anterior y sube la nueva)
 * @param oldImageUrl URL de la imagen anterior (opcional)
 * @param newFile Nueva imagen
 * @param userId ID del usuario
 * @param filename Nombre del archivo
 * @returns URL pública de la nueva imagen
 */
export async function updateTradeImage(
  oldImageUrl: string | null,
  newFile: Buffer | File,
  userId: string,
  filename: string
): Promise<string> {
  // Eliminar imagen anterior si existe
  if (oldImageUrl) {
    try {
      await deleteTradeImage(oldImageUrl);
    } catch (error) {
      console.error('Failed to delete old image:', error);
      // Continuar con el upload aunque falle el delete
    }
  }

  // Subir nueva imagen
  return uploadTradeImage(newFile, userId, filename);
}
