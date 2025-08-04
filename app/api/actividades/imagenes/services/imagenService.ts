import { createAdminClient } from "../../../../../utils/supabase/admin";
import { logError, logInfo } from "../../../../../utils/error/logger";

// Obtener el cliente de Supabase centralizado
const getSupabase = async () => await createAdminClient();

// Nombre del bucket existente en Supabase donde se almacenarán las imágenes
const BUCKET_NAME = "actividades.imagenes";

/**
 * Verifica si un bucket existe listando todos los buckets
 * @param BUCKET_NAME nombre del bucket
 * @returns true si el bucket existe, false en caso contrario
 */
export async function VerificarBucket(BUCKET_NAME: string) {
  const supabase = await getSupabase();

  // Listar todos los buckets
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    logError(error, {
      message: "Error al listar los buckets",
      code: 500,
    });
    return false;
  }

  // Verificar si el bucket existe
  const bucketExists = buckets.some((bucket) => bucket.name === BUCKET_NAME);

  if (!bucketExists) {
    logError(null, {
      message: "Bucket no encontrado",
      bucketName: BUCKET_NAME,
      code: 404,
    });
    return false;
  }

  return true;
}

/**
 * Guarda una imagen en el bucket de Supabase
 * @param file Imagen a guardar
 * @returns URL Pública de la imagen o null si hay error
 */
export async function saveImage(formData: FormData, user: any) {
  const supabase = await getSupabase();

  //Obtener agencia_id desde el usuario proporcionado
  let agenciaId = user?.user_metadata?.agencia_id; // TODO: Migrate to customUser.agencia_id
  if (!agenciaId) {
    agenciaId = 0;
  }

  // Obtener la imagen del FormData
  const file = formData.get("image") as File;
  if (!file) {
    return { error: "No file provided" };
  }


  // Verificar si el bucket existe
  const bucketExists = await VerificarBucket(BUCKET_NAME);
  if (!bucketExists) return { error: "Bucket no encontrado" };

  // Generar un NanoId utilizando la librería nanoid
  const { nanoid } = await import("nanoid");
  const fileName = `${agenciaId}-${nanoid()}`;

  // Guarda la imagen
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error || !data) {
    logError(error, {
      service: "imagenService",
      method: "saveImage",
      fileName: file.name,
      details: error.message,
      code: 500,
    });
    return { error: error.message };
  }

  //Devuelve la URL pública de la imagen
  const { data: dataPublicUrl, error: errorPublicUrl } =
    await getURLfromPath(fileName);
  if (errorPublicUrl || !dataPublicUrl) {
    logError(errorPublicUrl, {
      service: "imagenService",
      method: "saveImage",
      fileName: file.name,
      details: errorPublicUrl,
      code: 500,
    });
    return { error: errorPublicUrl };
  }

  logInfo("Imagen subida exitósamente", { fileName: file.name });
  return { url: dataPublicUrl };
}

/**
 * Obtiene la URL firmada de una imagen asociada a una actividad
 * @param actividadId ID de la actividad
 * @returns URL firmada de la imagen o null si hay error
 */
export async function getImageUrl(actividadId: number) {
  const supabase = await getSupabase();

  // Obtener la url de la imagen desde la base de datos
  const { data, error } = await supabase
    .from("actividades")
    .select("imagen")
    .eq("id", actividadId)
    .is("deleted_at", null)
    .single();

  if (error || !data || !data.imagen) {
    logError(error || new Error("Imagen no encontrada"), {
      service: "imagenService",
      method: "getImageUrl",
      actividadId,
    });
    return null;
  }
  return data.imagen;
}

/**
 * Actualiza la imagen asociada a una actividad
 * @param actividadId ID de la actividad
 * @param formData FormData con la nueva imagen
 * @returns true si se actualizó correctamente, false en caso contrario
 */
export async function updateImage(
  actividadId: number,
  formData: FormData,
  user: any
) {
  const supabase = await getSupabase();

  // Obtener el path de la imagen actual desde la base de datos
  const { data: actividad, error: actividadError } = await supabase
    .from("actividades")
    .select("imagen")
    .eq("id", actividadId)
    .is("deleted_at", null)
    .single();

  if (actividadError || !actividad) {
    logError(actividadError || new Error("Actividad no encontrada"), {
      service: "imagenService",
      method: "updateImage",
      actividadId,
    });
    return false;
  }

  const oldFilePath = actividad.imagen;

  // Verificar si el archivo existe en el bucket
  if (oldFilePath) {
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([oldFilePath]);

    if (deleteError) {
      logError(deleteError, {
        service: "imagenService",
        method: "updateImage",
        actividadId,
        oldFilePath,
      });
      return false;
    }
  }

  // Obtener la nueva imagen del FormData
  const file = formData.get("image") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  // Obtener agencia_id desde el usuario proporcionado
      const agenciaId = user?.user_metadata?.agencia_id; // TODO: Migrate to customUser.agencia_id
  if (!agenciaId) {
    return {
      error:
        "No se pudo obtener el ID de la agencia desde la sesión del usuario",
    };
  }

  // Cambiar el nombre del archivo
  const { nanoid } = await import("nanoid");
  const newFilePath = `${agenciaId}-${nanoid()}`;

  // Guardar la imagen
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(newFilePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    logError(uploadError, {
      service: "imagenService",
      method: "updateImage",
      actividadId,
      newFilePath,
    });
    return false;
  }

  // Actualizar la url de la imagen en la base de datos
  const { data } = await getURLfromPath(newFilePath);
  if (!data) {
    logError(new Error("Failed to get public URL"), {
      service: "imagenService",
      method: "updateImage",
      actividadId,
      newFilePath,
    });
  }

  const { error: updateError } = await supabase
    .from("actividades")
    .update({ imagen: data })
    .eq("id", actividadId);

  if (updateError) {
    logError(updateError, {
      service: "imagenService",
      method: "updateImage",
      actividadId,
      newFilePath,
    });
    return false;
  }

  logInfo("Imagen actualizada exitosamente", { actividadId, newFilePath });
  return true;
}

/**
 * Elimina la imagen asociada a una actividad
 * @param actividadId ID de la actividad
 * @returns true si se eliminó correctamente, false en caso contrario
 */
export async function deleteImage(actividadId: number) {
  const supabase = await getSupabase();

  // Obtener la url de la imagen desde la base de datos
  const { data: actividad, error: actividadError } = await supabase
    .from("actividades")
    .select("imagen")
    .eq("id", actividadId)
    .is("deleted_at", null)
    .single();

  if (actividadError || !actividad) {
    logError(actividadError || new Error("Actividad no encontrada"), {
      service: "imagenService",
      method: "deleteImage",
      actividadId,
    });
    return false;
  }

  const filePath = actividad.imagen.substring(
    actividad.imagen.lastIndexOf("/") + 1
  );

  // Eliminar la imagen del bucket
  if (filePath) {
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (deleteError) {
      logError(deleteError, {
        service: "imagenService",
        method: "deleteImage",
        actividadId,
        filePath,
      });
      return false;
    }
  }

  // Actualizar la columna `imagen` a null en la base de datos
  const { error: updateError } = await supabase
    .from("actividades")
    .update({ imagen: null })
    .eq("id", actividadId);

  if (updateError) {
    logError(updateError, {
      service: "imagenService",
      method: "deleteImage",
      actividadId,
    });
    return false;
  }

  logInfo("Imagen eliminada exitosamente", { actividadId });
  return true;
}

/**
 * Obtiene la URL pública de una imagen a partir de su ruta
 * @param filePath Ruta del archivo en el bucket
 * @returns URL pública de la imagen o error si no se pudo obtener
 */
export async function getURLfromPath(filePath: string) {
  const supabase = await getSupabase();

  const { data } = await supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  if (!data || !data.publicUrl) {
    logError(new Error("Failed to get public URL"), {
      service: "imagenService",
      method: "getURLfromPath",
      filePath,
    });
    return { error: "Failed to get public URL" };
  }

  logInfo("URL de imagen obtenida exitosamente", { filePath });
  return { data: data.publicUrl };
}
