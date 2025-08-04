import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { logError, logInfo } from "../../../utils/error/logger";
import {
  getCorreosFiltradas,
  getCorreoPorAgencia,
  crearNuevaConfiguracionCorreos,
  actualizarConfiguracionCorreos,
  eliminarConfiguracionCorreos,
} from "./controllers/correoController";

/**
 * @swagger
 * /api/correos:
 *   get:
 *     tags:
 *       - Correos
 *     summary: Obtener configuración de correos
 *     description: Obtiene la configuración de correos con filtros opcionales
 *     parameters:
 *       - name: agencia_id
 *         in: query
 *         description: ID de la agencia para filtrar (opcional)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 'Configuración de correos obtenida exitosamente'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       agencia_id:
 *                         type: integer
 *                       email_from:
 *                         type: string
 *                       email_reply_to:
 *                         type: string
 *                       logo_url:
 *                         type: string
 *                       logo_filename:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Error interno del servidor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agenciaId = searchParams.get("agencia_id");

    // Si se proporciona agencia_id, obtener configuración específica
    if (agenciaId) {
      const agenciaIdNum = parseInt(agenciaId, 10);
      if (isNaN(agenciaIdNum)) {
        return NextResponse.json(
          {
            code: 400,
            message: "ID de agencia inválido, debe ser un número entero",
          },
          { status: 400 }
        );
      }
      return await getCorreoPorAgencia(agenciaIdNum);
    }

    // Obtener todas las configuraciones con filtros opcionales
    const filtros: any = {};
    if (agenciaId) {
      filtros.agencia_id = parseInt(agenciaId, 10);
    }

    return await getCorreosFiltradas(filtros);
  } catch (error: any) {
    logError("Error en GET /api/correos", {
      context: "correos/route",
      error,
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/correos:
 *   post:
 *     tags:
 *       - Correos
 *     summary: Crear configuración de correos
 *     description: Crea una nueva configuración de correos para una agencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agencia_id:
 *                 type: integer
 *                 description: ID de la agencia
 *               email_from:
 *                 type: string
 *                 description: Email de origen
 *               email_reply_to:
 *                 type: string
 *                 description: Email de respuesta
 *               logo_url:
 *                 type: string
 *                 description: URL del logo (opcional)
 *               logo_filename:
 *                 type: string
 *                 description: Nombre del archivo del logo (opcional)
 *             required:
 *               - agencia_id
 *               - email_from
 *               - email_reply_to
 *     responses:
 *       201:
 *         description: Configuración creada exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       409:
 *         description: Ya existe una configuración para esta agencia
 *       500:
 *         description: Error interno del servidor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Esquema de validación
    const correoSchema = z.object({
      agencia_id: z
        .number()
        .int()
        .positive("El ID de agencia debe ser un número entero positivo"),
      email_from: z.string().min(1, "El nombre del remitente es requerido"), // Cambiado: solo requiere string no vacío
      email_reply_to: z.string().email("Email de respuesta inválido"),
      logo_url: z
        .string()
        .refine((val) => {
          if (!val) return true; // Campo opcional
          // Aceptar URLs absolutas o rutas relativas que empiecen con /
          return val.startsWith("http") || val.startsWith("/");
        }, "URL del logo debe ser una URL válida o una ruta relativa que empiece con /")
        .optional(),
      logo_filename: z.string().optional(),
    });

    const validatedData = correoSchema.parse(body);

    return await crearNuevaConfiguracionCorreos(validatedData);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          code: 400,
          message: "Datos de entrada inválidos",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    logError("Error en POST /api/correos", {
      context: "correos/route",
      error,
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/correos:
 *   put:
 *     tags:
 *       - Correos
 *     summary: Actualizar configuración de correos
 *     description: Actualiza la configuración de correos de una agencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agencia_id:
 *                 type: integer
 *                 description: ID de la agencia
 *               email_from:
 *                 type: string
 *                 description: Email de origen
 *               email_reply_to:
 *                 type: string
 *                 description: Email de respuesta
 *               logo_url:
 *                 type: string
 *                 description: URL del logo (opcional)
 *               logo_filename:
 *                 type: string
 *                 description: Nombre del archivo del logo (opcional)
 *             required:
 *               - agencia_id
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Configuración no encontrada
 *       500:
 *         description: Error interno del servidor
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Esquema de validación para actualización
    const correoUpdateSchema = z.object({
      agencia_id: z
        .number()
        .int()
        .positive("El ID de agencia debe ser un número entero positivo"),
      email_from: z
        .string()
        .min(1, "El nombre del remitente es requerido")
        .optional(), // Cambiado: solo requiere string no vacío
      email_reply_to: z
        .string()
        .email("Email de respuesta inválido")
        .optional(),
      logo_url: z
        .string()
        .refine((val) => {
          if (!val) return true; // Campo opcional
          // Aceptar URLs absolutas o rutas relativas que empiecen con /
          return val.startsWith("http") || val.startsWith("/");
        }, "URL del logo debe ser una URL válida o una ruta relativa que empiece con /")
        .optional(),
      logo_filename: z.string().optional(),
    });

    const validatedData = correoUpdateSchema.parse(body);
    const { agencia_id, ...updateData } = validatedData;

    return await actualizarConfiguracionCorreos(agencia_id, updateData);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          code: 400,
          message: "Datos de entrada inválidos",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    logError("Error en PUT /api/correos", {
      context: "correos/route",
      error,
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/correos:
 *   delete:
 *     tags:
 *       - Correos
 *     summary: Eliminar configuración de correos
 *     description: Elimina la configuración de correos de una agencia
 *     parameters:
 *       - name: agencia_id
 *         in: query
 *         description: ID de la agencia
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Configuración eliminada exitosamente
 *       400:
 *         description: ID de agencia requerido
 *       500:
 *         description: Error interno del servidor
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agenciaId = searchParams.get("agencia_id");

    if (!agenciaId) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de agencia requerido",
        },
        { status: 400 }
      );
    }

    const agenciaIdNum = parseInt(agenciaId, 10);
    if (isNaN(agenciaIdNum)) {
      return NextResponse.json(
        {
          code: 400,
          message: "ID de agencia inválido, debe ser un número entero",
        },
        { status: 400 }
      );
    }

    return await eliminarConfiguracionCorreos(agenciaIdNum);
  } catch (error: any) {
    logError("Error en DELETE /api/correos", {
      context: "correos/route",
      error,
    });

    return NextResponse.json(
      {
        code: 500,
        message: "Error interno del servidor",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
