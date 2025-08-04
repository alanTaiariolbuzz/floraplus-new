import swaggerJSDoc, { type OAS3Options } from 'swagger-jsdoc';
/**
 * Utilidades para Swagger y documentación de la API
 * Este archivo centraliza funcionalidades comunes para la generación y
 * configuración de Swagger/OpenAPI.
 */

/**
 * Función auxiliar para definir parámetros comunes en rutas Swagger
 */
export const defineCommonParameters = () => {
  return [
    {
      name: 'Authorization',
      in: 'header',
      description: 'Token JWT para autenticación',
      required: true,
      schema: {
        type: 'string',
        format: 'JWT',
      }
    }
  ];
};

/**
 * Esquemas comunes para reutilizar en la documentación
 */
export const commonSchemas = {
  ErrorResponse: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Mensaje de error'
      },
      code: {
        type: 'integer',
        description: 'Código HTTP del error'
      },
      errors: {
        type: 'array',
        items: {
          type: 'object'
        },
        description: 'Detalles adicionales del error (opcional)'
      }
    }
  }
};

/**
 * Respuestas comunes para reutilizar en la documentación
 */
export const commonResponses = {
  UnauthorizedError: {
    description: 'No autorizado - Token inválido o expirado',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ErrorResponse'
        },
        example: {
          message: 'No autorizado',
          code: 401
        }
      }
    }
  },
  ServerError: {
    description: 'Error interno del servidor',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ErrorResponse'
        },
        example: {
          message: 'Error interno del servidor',
          code: 500
        }
      }
    }
  }
};
const swaggerConfig = {
  openapi: '3.0.3',
  info: {
    title: 'API Flora Plus',
    version: '1.0.0',
    description: 'Documentación de la API de Flora Plus',
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' ? 'Producción' : 'Desarrollo',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const swaggerJsDocOptions = {
  apis: [
    './app/api/**/*.ts',
  ],
};

export function generateOpenApiSpec() {
  try {
    const options: OAS3Options = {
      definition: swaggerConfig,
      ...swaggerJsDocOptions,
    };

    return swaggerJSDoc(options);
  } catch (error) {
    console.error('Error al generar la documentación OpenAPI:', error);
    throw new Error('Error al generar la documentación de la API');
  }
}
