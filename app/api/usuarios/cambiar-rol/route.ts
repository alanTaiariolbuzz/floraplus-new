import { NextRequest, NextResponse } from 'next/server';
import { cambiarRolSchema } from './schemas';
import { cambiarRolUsuario } from './service';
import { logError, logInfo } from '@/utils/error/logger';

/**
 * @swagger
 * /api/usuarios/cambiar-rol:
 *   put:
 *     summary: Cambia el rol de un usuario
 *     description: Actualiza el rol de un usuario existente identificado por ID o email
 *     tags:
 *       - Usuarios
 *     parameters:
 *       - name: id
 *         in: query
 *         required: false
 *         description: ID del usuario (opcional si se proporciona email)
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: email
 *         in: query
 *         required: false
 *         description: Email del usuario (opcional si se proporciona ID)
 *         schema:
 *           type: string
 *           format: email
 *       - name: rol_id
 *         in: query
 *         required: true
 *         description: ID del nuevo rol a asignar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rol actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rol actualizado correctamente para usuario@ejemplo.com"
 *                 usuario:
 *                   type: object
 *       400:
 *         description: Datos de solicitud inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Debe proporcionar el ID o el email del usuario"
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Usuario no encontrado"
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error inesperado al cambiar el rol"
 */

export async function PUT(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const email = url.searchParams.get('email');
    const rol_id_str = url.searchParams.get('rol_id');
    
    if (!id && !email) {
      return NextResponse.json({ error: 'Debe proporcionar el ID o el email del usuario' }, { status: 400 });
    }

    if (!rol_id_str) {
      return NextResponse.json({ error: 'El ID de rol es requerido' }, { status: 400 });
    }

    const rol_id = parseInt(rol_id_str);
    
    if (isNaN(rol_id)) {
      return NextResponse.json({ error: 'El ID de rol debe ser un número válido' }, { status: 400 });
    }

    // Validar datos con el esquema
    try {
      cambiarRolSchema.parse({
        id: id || undefined,
        email: email || undefined,
        rol_id
      });
    } catch (validationError: any) {
      logError(validationError, {
        service: 'usuarios',
        method: 'PUT cambiar-rol',
        validationError: validationError.errors
      });
      return NextResponse.json({ error: validationError.errors }, { status: 400 });
    }

    // Procesar solicitud
    const resultado = await cambiarRolUsuario({ 
      id: id || undefined, 
      email: email || undefined, 
      rol_id 
    });

    if (!resultado.success) {
      // Determinar el código de estado según el error
      const status = resultado.error?.includes('no encontrado') ? 404 : 500;
      return NextResponse.json({ error: resultado.error }, { status });
    }

    // Éxito
    logInfo('Rol de usuario actualizado exitosamente', {
      service: 'usuarios',
      method: 'PUT cambiar-rol',
      id,
      email,
      rol_id
    });
    
    return NextResponse.json(resultado);
    
  } catch (e: any) {
    logError(e, {
      service: 'usuarios',
      method: 'PUT cambiar-rol',
      unexpectedError: true,
      errorMessage: e.message
    });
    return NextResponse.json(
      { error: 'Error inesperado al procesar la solicitud' },
      { status: 500 }
    );
  }
}
