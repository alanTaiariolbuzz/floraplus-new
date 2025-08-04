import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { logError, logInfo } from "../../../utils/error/logger";
import {
  getAgenciasFiltradas,
  createNuevaAgencia,
  actualizarAgencia,
  desactivarAgencia,
} from "./controllers/agenciaController";
import { FiltrosAgencia } from "./types";
// No necesitamos uuid por ahora, ya que no estamos creando usuarios
// La funcionalidad de envío de email de bienvenida se agregará cuando implementemos la creación del usuario administrador

/**
 * @swagger
 * /api/agencias:
 *   get:
 *     tags:
 *       - Agencias
 *     summary: Obtener lista de agencias
 *     description: Obtiene una lista de agencias o una agencia específica por ID. Se pueden aplicar filtros por estado activo/inactivo.
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID de la agencia (opcional)
 *         schema:
 *           type: integer
 *       - name: activa
 *         in: query
 *         description: Filtrar por agencias activas o inactivas (opcional)
 *         schema:
 *           type: boolean
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
 *                   example: 'Agencias obtenidas exitosamente'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       email_contacto:
 *                         type: string
 *                       telefono:
 *                         type: string
 *                       direccion:
 *                         type: string
 *                       termino_cond:
 *                         type: string
 *                       moneda:
 *                         type: string
 *                       activa:
 *                         type: boolean
 *                       cedula:
 *                         type: integer
 *                       web:
 *                         type: string
 *                       pais:
 *                         type: string
 *                       nombre_comercial:
 *                         type: string
 *                       fee:
 *                         type: string
 *                       tax:
 *                         type: integer
 *                       convenience_fee_fijo:
 *                         type: boolean
 *                       convenience_fee_fijo_valor:
 *                         type: integer
 *                       convenience_fee_variable:
 *                         type: boolean
 *                       convenience_fee_variable_valor:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Parámetros de solicitud inválidos
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
 *                   example: 'ID de agencia inválido, debe ser un número entero'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 'Error al obtener agencias'
 */

// GET: Obtener agencias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const activaParam = searchParams.get("activa");

    // Usar el tipo correcto en lugar de any
    const filtros: FiltrosAgencia = {};

    // Validar y convertir parámetros si están presentes
    if (idParam) {
      const id = parseInt(idParam);

      // Validar que el ID sea un número válido
      if (Number.isNaN(id)) {
        return NextResponse.json(
          {
            code: 400,
            message: "ID de agencia inválido, debe ser un número entero",
          },
          { status: 400 }
        );
      }

      filtros.id = id;
    }

    // Validar parámetro 'activa' más estrictamente
    if (activaParam !== null) {
      if (activaParam === "true") {
        filtros.activa = true;
      } else if (activaParam === "false") {
        filtros.activa = false;
      } else {
        return NextResponse.json(
          {
            code: 400,
            message: 'El parámetro "activa" debe ser "true" o "false"',
          },
          { status: 400 }
        );
      }
    }

    // Utilizar el controlador para obtener las agencias filtradas
    const resultado = await getAgenciasFiltradas(filtros);

    logInfo(`Agencias obtenidas exitosamente`, {
      endpoint: "/api/agencias/GET",
    });
    return NextResponse.json(resultado);
  } catch (err) {
    // Usar el sistema centralizado de logging
    logError(err, {
      endpoint: "/api/agencias/GET",
      context: "Error al obtener agencias",
    });

    // Manejar errores con verificación de tipo para err
    const statusCode =
      err &&
      typeof err === "object" &&
      "code" in err &&
      typeof err.code === "number"
        ? err.code
        : 500;
    const message =
      err && typeof err === "object" && "message" in err
        ? String(err.message)
        : "Error al obtener agencias";

    return NextResponse.json(
      {
        code: statusCode,
        message: message,
      },
      { status: statusCode }
    );
  }
}

/**
 * @swagger
 * /api/agencias:
 *   post:
 *     tags:
 *       - Agencias
 *     summary: Crear una nueva agencia
 *     description: Crea una nueva agencia con los datos proporcionados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre de la agencia
 *               email_contacto:
 *                 type: string
 *                 description: Email de contacto de la agencia
 *               telefono:
 *                 type: string
 *                 description: Teléfono de la agencia
 *               direccion:
 *                 type: string
 *                 description: Dirección de la agencia
 *               termino_cond:
 *                 type: string
 *                 description: Términos y condiciones de la agencia
 *               moneda:
 *                 type: string
 *                 description: Moneda de la agencia
 *               activa:
 *                 type: boolean
 *                 description: Si la agencia está activa o no
 *               cedula:
 *                 type: integer
 *                 description: Cédula de la agencia
 *               web:
 *                 type: string
 *                 description: Sitio web de la agencia
 *               pais:
 *                 type: string
 *                 description: País de la agencia
 *               nombre_comercial:
 *                 type: string
 *                 description: Nombre comercial de la agencia
 *               fee:
 *                 type: string
 *                 description: Comisión de la agencia
 *               tax:
 *                 type: integer
 *                 description: Impuesto de la agencia
 *               convenience_fee_fijo:
 *                 type: boolean
 *                 description: Si la agencia tiene comisión fija
 *               convenience_fee_fijo_valor:
 *                 type: integer
 *                 description: Valor de la comisión fija
 *               convenience_fee_variable:
 *                 type: boolean
 *                 description: Si la agencia tiene comisión variable
 *               convenience_fee_variable_valor:
 *                 type: string
 *                 description: Valor de la comisión variable
 *             required:
 *               - nombre
 *               - email_contacto
 *     responses:
 *       201:
 *         description: Agencia creada exitosamente
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
 *                   example: 'Agencia creada exitosamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     email_contacto:
 *                       type: string
 *                     telefono:
 *                       type: string
 *                     direccion:
 *                       type: string
 *                     termino_cond:
 *                       type: string
 *                     moneda:
 *                       type: string
 *                     activa:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Datos de entrada inválidos
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
 *                   example: 'Datos de agencia inválidos'
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       409:
 *         description: Conflicto - La agencia ya existe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 409
 *                 message:
 *                   type: string
 *                   example: 'Ya existe una agencia con esta información'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 'Error interno del servidor'
 */
// Esquema de validación para crear una agencia
const agenciaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  email_contacto: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  termino_cond: z.string().optional(),
  moneda: z.string().optional(),
  activa: z.boolean().optional().default(false),
  cedula: z.number().optional(),
  web: z.string().optional(),
  pais: z.string().optional(),
  nombre_comercial: z.string().optional(),
  fee: z.string().optional(),
  tax: z.number().optional(),
  convenience_fee_fijo: z.boolean().optional().default(false),
  convenience_fee_fijo_valor: z.number().optional(),
  convenience_fee_variable: z.boolean().optional().default(false),
  convenience_fee_variable_valor: z.number().optional(),
  nombre_representante: z.string().optional(), // Nuevo campo opcional
  nombre_departamento_reservas: z.string().optional(),
  email_departamento_reservas: z.string().email("Email inválido").optional(),
  telefono_departamento_reservas: z.string().optional(),
});

// POST: Crear una agencia
export async function POST(request: NextRequest) {
  try {
    // Validar datos de entrada usando Zod
    const body = await request.json();
    const data = agenciaSchema.parse(body);

    // Delegar al controlador
    const resultado = await createNuevaAgencia(data);

    return NextResponse.json(resultado, {
      status: resultado.code,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      // Errores de validación de datos de entrada
      logError(err, {
        endpoint: "/api/agencias/POST",
        errorType: "validationError",
        details: err.errors, // Incluir detalles específicos de validación
      });

      return NextResponse.json(
        {
          code: 400,
          message: "Datos de agencia inválidos",
          errors: err.errors,
        },
        { status: 400 }
      );
    }

    // Usar el sistema centralizado de logging
    logError(err, {
      endpoint: "/api/agencias/POST",
      context: "Error general al crear agencia",
    });

    // Para otros errores, usar códigos específicos cuando existan
    const statusCode =
      err &&
      typeof err === "object" &&
      "code" in err &&
      typeof err.code === "number"
        ? err.code
        : 500;
    const message =
      err && typeof err === "object" && "message" in err
        ? String(err.message)
        : "Error interno del servidor";

    // Personalizar mensajes para códigos comunes
    let responseMessage = message;
    if (statusCode === 409) {
      responseMessage = "Ya existe una agencia con esta información";
    }

    return NextResponse.json(
      {
        code: statusCode,
        message: responseMessage,
      },
      { status: statusCode }
    );
  }
}

/**
 * @swagger
 * /api/agencias:
 *   put:
 *     tags:
 *       - Agencias
 *     summary: Actualizar una agencia
 *     description: Actualiza una agencia existente con los datos proporcionados
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID de la agencia a actualizar
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre de la agencia
 *               email_contacto:
 *                 type: string
 *                 description: Email de contacto de la agencia
 *               telefono:
 *                 type: string
 *                 description: Teléfono de la agencia
 *               direccion:
 *                 type: string
 *                 description: Dirección de la agencia
 *               termino_cond:
 *                 type: string
 *                 description: Términos y condiciones de la agencia
 *               moneda:
 *                 type: string
 *                 description: Moneda de la agencia
 *               activa:
 *                 type: boolean
 *                 description: Si la agencia está activa o no
 *               cedula:
 *                 type: integer
 *                 description: Cédula de la agencia
 *               web:
 *                 type: string
 *                 description: Sitio web de la agencia
 *               pais:
 *                 type: string
 *                 description: País de la agencia
 *               nombre_comercial:
 *                 type: string
 *                 description: Nombre comercial de la agencia
 *               fee:
 *                 type: string
 *                 description: Comisión de la agencia
 *               tax:
 *                 type: integer
 *                 description: Impuesto de la agencia
 *               convenience_fee_fijo:
 *                 type: boolean
 *                 description: Si la agencia tiene comisión fija
 *               convenience_fee_fijo_valor:
 *                 type: integer
 *                 description: Valor de la comisión fija
 *               convenience_fee_variable:
 *                 type: boolean
 *                 description: Si la agencia tiene comisión variable
 *               convenience_fee_variable_valor:
 *                 type: string
 *                 description: Valor de la comisión variable
 *     responses:
 *       200:
 *         description: Agencia actualizada exitosamente
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
 *                   example: 'Agencia actualizada exitosamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     email_contacto:
 *                       type: string
 *                     telefono:
 *                       type: string
 *                     direccion:
 *                       type: string
 *                     termino_cond:
 *                       type: string
 *                     moneda:
 *                       type: string
 *                     activa:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Datos de entrada inválidos o parámetro ID no proporcionado
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
 *                   example: 'Datos de agencia inválidos'
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Agencia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: 'Agencia no encontrada'
 *       409:
 *         description: Conflicto - Email ya en uso por otra agencia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 409
 *                 message:
 *                   type: string
 *                   example: 'El email ya está en uso por otra agencia'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 'Error interno del servidor'
 */
// Esquema de validación para actualizar una agencia
const agenciaUpdateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").optional(),
  email_contacto: z.string().email("Email inválido").optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  termino_cond: z.string().optional(),
  moneda: z.string().optional(),
  activa: z.boolean().optional(),
  cedula: z.number().optional(),
  web: z.string().optional(),
  pais: z.string().optional(),
  nombre_comercial: z.string().optional(),
  fee: z.string().optional(),
  tax: z.number().nullable().optional(),
  convenience_fee_fijo: z.boolean().optional(),
  convenience_fee_fijo_valor: z.number().nullable().optional(),
  convenience_fee_variable: z.boolean().optional(),
  convenience_fee_variable_valor: z.number().nullable().optional(),
  nombre_representante: z.string().optional(), // Nuevo campo opcional
  nombre_departamento_reservas: z.string().optional(),
  email_departamento_reservas: z.string().email("Email inválido").optional(),
  telefono_departamento_reservas: z.string().optional(),
});

// PUT: Actualizar una agencia
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        {
          code: 400,
          message: "Se requiere el parámetro ID",
        },
        { status: 400 }
      );
    }

    const id = Number(idParam);
    const body = await request.json();
    const data = agenciaUpdateSchema.parse(body);

    // Delegar al controlador
    const resultado = await actualizarAgencia(id, data);

    return NextResponse.json(resultado, {
      status: resultado.code,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      logError(err, {
        endpoint: "/api/agencias/PUT",
        errorType: "validationError",
      });
      return NextResponse.json(
        {
          code: 400,
          message: "Datos de agencia inválidos",
          errors: err.errors,
        },
        { status: 400 }
      );
    }

    // Para otros errores, usa el código y mensaje del error
    const statusCode =
      err &&
      typeof err === "object" &&
      "code" in err &&
      typeof err.code === "number"
        ? err.code
        : 500;
    const message =
      err && typeof err === "object" && "message" in err
        ? String(err.message)
        : "Error interno del servidor";

    return NextResponse.json(
      {
        code: statusCode,
        message: message,
      },
      { status: statusCode }
    );
  }
}

/**
 * @swagger
 * /api/agencias:
 *   delete:
 *     tags:
 *       - Agencias
 *     summary: Desactivar una agencia
 *     description: Desactiva una agencia existente (eliminación lógica/soft delete). Marca la agencia como inactiva (activa=false).
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID de la agencia a desactivar
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Agencia desactivada exitosamente
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
 *                   example: 'Agencia desactivada exitosamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     activa:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Parámetro ID no proporcionado o inválido
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
 *                   example: 'Se requiere el parámetro ID'
 *       404:
 *         description: Agencia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: 'Agencia no encontrada'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: 'Error interno del servidor'
 */
// DELETE: Desactivar una agencia (eliminación lógica)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        {
          code: 400,
          message: "Se requiere el parámetro ID",
        },
        { status: 400 }
      );
    }

    const id = Number(idParam);

    // Delegar al controlador
    const resultado = await desactivarAgencia(id);

    return NextResponse.json(resultado);
  } catch (err) {
    // Para errores, usa el código y mensaje del error
    const statusCode =
      err &&
      typeof err === "object" &&
      "code" in err &&
      typeof err.code === "number"
        ? err.code
        : 500;
    const message =
      err && typeof err === "object" && "message" in err
        ? String(err.message)
        : "Error interno del servidor";

    return NextResponse.json(
      {
        code: statusCode,
        message: message,
      },
      { status: statusCode }
    );
  }
}
