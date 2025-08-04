import { ZodError } from 'zod';
import { logError, logInfo } from '../../../../../utils/error/logger';
import { deleteImage, getImageUrl, updateImage, saveImage } from '../services/imagenService';

/**
 * Guarda la imagen
 */
export async function guardarImagen(formData: FormData, user: any) {
  try {
    // Guardar imagen
    const resultado = await saveImage(formData, user);

    if (resultado && resultado.error) {
      return {
        code: 400,
        message: resultado.error,
      };
    }

    return {
      code: 201,
      message: 'Imagen guardada exitósamente',
      data: resultado.url,
    };
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, { controller: 'imagenController', method: 'guardarImagen', errorType: 'validationError' });
      throw {
        code: 400,
        message: 'Datos de imagen inválidos',
        errors: err.errors,
      };
    }

    logError(err, { controller: 'imagenController', method: 'guardarImagen' });
    throw {
      code: 500,
      message: 'Error interno al guardar la imagen',
    };
  }
}

/**
 * Elimina una imagen asociada a una actividad
 */
export async function eliminarImagen(actividadId: number) {
  try {
    const resultado = await deleteImage(actividadId);

    if (!resultado) {
      return {
        code: 400,
        message: 'No se pudo eliminar la imagen',
      };
    }

    return {
      code: 200,
      message: 'Imagen eliminada exitosamente',
    };
  } catch (err) {
    logError(err, { controller: 'imagenController', method: 'eliminarImagen' });
    throw {
      code: 500,
      message: 'Error interno al eliminar la imagen',
    };
  }
}

/**
 * Obtiene la URL firmada de una imagen asociada a una actividad
 */
export async function obtenerImagenUrl(actividadId: number) {
  try {
    const url = await getImageUrl(actividadId);

    if (!url) {
      return {
        code: 404,
        message: 'Imagen no encontrada',
      };
    }

    return {
      code: 200,
      message: 'URL de imagen obtenida exitosamente',
      data: { url },
    };
  } catch (err) {
    logError(err, { controller: 'imagenController', method: 'obtenerImagenUrl' });
    throw {
      code: 500,
      message: 'Error interno al obtener la URL de la imagen',
    };
  }
}

/**
 * Actualiza una imagen asociada a una actividad
 */
export async function actualizarImagen(actividadId: number, formData: FormData, user: any) {
  try {
    const resultado = await updateImage(actividadId, formData, user);

    if (!resultado) {
      return {
        code: 400,
        message: 'No se pudo actualizar la imagen',
      };
    }

    return {
      code: 200,
      message: 'Imagen actualizada exitosamente',
    };
  } catch (err) {
    logError(err, { controller: 'imagenController', method: 'actualizarImagen' });
    throw {
      code: 500,
      message: 'Error interno al actualizar la imagen',
    };
  }
}