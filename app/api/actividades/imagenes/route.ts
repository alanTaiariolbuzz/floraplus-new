import { NextRequest, NextResponse } from 'next/server';
import { logError } from '../../../../utils/error/logger';
import { guardarImagen, eliminarImagen, obtenerImagenUrl, actualizarImagen } from './controllers/imagenController';
import { createClient } from '@/utils/supabase/server';

/**
 * @swagger
 * /api/actividades/imagenes:
 *   post:
 *     tags:
 *       - Imagenes
 *     summary: Guardar imagen
 *     description: Guarda una imagen en el bucket de actividades asociada a una agencia
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen a subir
 *     responses:
 *       201:
 *         description: Imagen guardada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Imagen guardada exitosamente
 *                 data:
 *                   type: object
 *                   properties:
 *                     signed_url:
 *                       type: string
 *                       format: uri
 *                       example: https://example.com/signed-url
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: Datos de imagen inválidos
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'No autorizado o sesión no disponible' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const respuesta = await guardarImagen(formData, user);

    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    logError(err, { endpoint: '/api/actividades/imagenes/POST' });
    return NextResponse.json(
      {
        code: 500,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/actividades/imagenes:
 *   get:
 *     tags:
 *       - Imagenes
 *     summary: Obtener URL de una imagen
 *     description: Obtiene la URL firmada de una imagen asociada a una actividad
 *     parameters:
 *       - in: query
 *         name: actividadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la actividad
 *     responses:
 *       200:
 *         description: URL obtenida exitosamente
 *       404:
 *         description: Imagen no encontrada
 *       500:
 *         description: Error interno del servidor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actividadId = parseInt(searchParams.get('actividadId') || '', 10);

    if (isNaN(actividadId)) {
      return NextResponse.json(
        {
          code: 400,
          message: 'El parámetro actividadId es requerido y debe ser un número',
        },
        { status: 400 }
      );
    }

    const respuesta = await obtenerImagenUrl(actividadId);
    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    logError(err, { endpoint: '/api/actividades/imagenes/GET' });
    return NextResponse.json(
      {
        code: 500,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/actividades/imagenes:
 *   put:
 *     tags:
 *       - Imagenes
 *     summary: Actualizar una imagen
 *     description: Actualiza una imagen asociada a una actividad
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - actividadId
 *               - image
 *             properties:
 *               actividadId:
 *                 type: integer
 *                 description: ID de la actividad
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen a subir
 *     responses:
 *       200:
 *         description: Imagen actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'No autorizado o sesión no disponible' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const actividadId = parseInt(formData.get('actividadId') as string, 10);

    if (isNaN(actividadId)) {
      return NextResponse.json(
        {
          code: 400,
          message: 'El parámetro actividadId es requerido y debe ser un número',
        },
        { status: 400 }
      );
    }

    const respuesta = await actualizarImagen(actividadId, formData, user);
    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    logError(err, { endpoint: '/api/actividades/imagenes/PUT' });
    return NextResponse.json(
      {
        code: 500,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/actividades/imagenes:
 *   delete:
 *     tags:
 *       - Imagenes
 *     summary: Eliminar una imagen
 *     description: Elimina una imagen asociada a una actividad
 *     parameters:
 *       - in: query
 *         name: actividadId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la actividad
 *     responses:
 *       200:
 *         description: Imagen eliminada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actividadId = parseInt(searchParams.get('actividadId') || '', 10);

    if (!actividadId || isNaN(actividadId)) {
      return NextResponse.json(
        {
          code: 400,
          message: 'El parámetro actividadId es requerido y debe ser un número',
        },
        { status: 400 }
      );
    }

    const respuesta = await eliminarImagen(actividadId);
    return NextResponse.json(respuesta, { status: respuesta.code });
  } catch (err: any) {
    logError(err, { endpoint: '/api/actividades/imagenes/DELETE' });
    return NextResponse.json(
      {
        code: 500,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}