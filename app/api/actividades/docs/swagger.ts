/**
 * @swagger
 * /api/actividades:
 *   post:
 *     tags:
 *       - Actividades
 *     summary: Crear una nueva actividad
 *     description: Crea una nueva actividad con todos sus detalles asociados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               es_privada:
 *                 type: boolean
 *               imagen:
 *                 type: string
 *                 format: url
 *               estado:
 *                 type: string
 *               cronograma:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dia_completo:
 *                       type: boolean
 *                     fecha_inicio:
 *                       type: string
 *                       format: date
 *                     dias:
 *                       type: array
 *                       items:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 7
 *                     hora_inicio:
 *                       type: string
 *                       format: HH:MM
 *                       example: "09:00"
 *                     hora_fin:
 *                       type: string
 *                       format: HH:MM
 *                       example: "18:00"
 *                     cupo:
 *                       type: integer
 *               detalles:
 *                 type: object
 *                 properties:
 *                   minimo_reserva:
 *                     type: integer
 *                   limite_reserva_minutos:
 *                     type: integer
 *                   umbral_limite_personas:
 *                     type: integer
 *                   umbral_limite_minutos:
 *                     type: integer
 *                   umbral_limite_tipo:
 *                     type: string
 *               tarifas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     descripcion:
 *                       type: string
 *                     precio:
 *                       type: number
 *                     moneda:
 *                       type: string
 *               adicionales:
 *                 type: array
 *                 description: Array de IDs de adicionales existentes
 *                 items:
 *                   type: integer
 *               transporte:
 *                 type: array
 *                 description: Array de IDs de transportes existentes
 *                 items:
 *                   type: integer
 *               descuentos:
 *                 type: array
 *                 description: Array de IDs de descuentos existentes
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Actividad creada
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
 *                   example: "Actividad creada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     titulo:
 *                       type: string
 *                     estado:
 *                       type: string
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorValidacion'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/actividades:
 *   delete:
 *     tags:
 *       - Actividades
 *     summary: Eliminar una actividad (soft delete)
 *     description: Realiza un soft delete de una actividad, marcándola como inactiva pero manteniendo el registro en la base de datos.
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID de la actividad a eliminar
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Actividad eliminada exitosamente
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
 *                   example: "Actividad eliminada exitosamente"
 *       400:
 *         description: ID de actividad no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Actividad no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/actividades:
 *   put:
 *     tags:
 *       - Actividades
 *     summary: Actualizar una actividad existente
 *     description: Actualiza una actividad existente con todos sus detalles asociados
 *     parameters:
 *       - name: id
 *         in: query
 *         required: true
 *         description: ID de la actividad a actualizar
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               titulo_en:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               descripcion_en:
 *                 type: string
 *               es_privada:
 *                 type: boolean
 *               imagen:
 *                 type: string
 *               estado:
 *                 type: string
 *               iframe_code:
 *                 type: string
 *               ubicacion:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *                   direccion:
 *                     type: string
 *               detalles:
 *                 type: object
 *                 properties:
 *                   minimo_reserva:
 *                     type: integer
 *                     minimum: 1
 *                     description: Mínimo de personas para la reserva
 *                   limite_reserva_minutos:
 *                     type: integer    
 *                   umbral_limite_personas:
 *                     type: integer
 *                   umbral_limite_minutos:
 *                     type: integer
 *                   umbral_limite_tipo:
 *                     type: string
 *               cronograma:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     fecha_inicio:
 *                       type: string
 *                       format: date
 *                     dias:
 *                       type: array
 *                       items:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 7
 *                     dia_completo:
 *                       type: boolean
 *                     hora_inicio:
 *                       type: string
 *                       format: HH:MM
 *                       example: "09:00"
 *                     hora_fin:
 *                       type: string
 *                       format: HH:MM
 *                       example: "18:00"
 *                     cupo:
 *                       type: integer
 *               tarifas:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     nombre_en:
 *                       type: string
 *                     precio:
 *                       type: number
 *                     moneda:
 *                       type: string
 *                       default: "USD"
 *               adicionales:
 *                 type: array
 *                 description: Array de IDs de adicionales existentes
 *                 items:
 *                   type: integer
 *               transportes:
 *                 type: array
 *                 description: Array de IDs de transportes existentes
 *                 items:
 *                   type: integer
 *               descuentos:
 *                 type: array
 *                 description: Array de IDs de descuentos existentes
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Actividad actualizada exitosamente
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
 *                   example: "Actividad actualizada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     titulo:
 *                       type: string
 *                     estado:
 *                       type: string
 *       400:
 *         description: Datos inválidos o ID no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorValidacion'
 *       404:
 *         description: Actividad no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/actividades/cambiar-estado:
 *   patch:
 *     tags:
 *       - Actividades
 *     summary: Cambiar el estado de una actividad
 *     description: Cambia el estado de una actividad entre 'borrador' y 'publicado'
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la actividad a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [borrador, publicado]
 *                 description: Nuevo estado de la actividad
 *     responses:
 *       200:
 *         description: Estado de la actividad actualizado exitosamente
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
 *                   example: "Estado de la actividad actualizado a 'publicado' exitosamente"
 *                 data:
 *                   type: object
 *                   description: Datos de la actividad actualizada
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
 *                   example: "Se requiere el campo 'estado' con valor 'borrador' o 'publicado'"
 *       404:
 *         description: Actividad no encontrada
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
 *                   example: "Actividad no encontrada"
 *       500:
 *         description: Error del servidor
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
 *                   example: "Error al cambiar el estado de la actividad"
 *                 errors:
 *                   type: string
 *                   example: "Mensaje de error detallado"
 * 
 * @swagger
 * /api/actividades:
 *   get:
 *     tags:
 *       - Actividades
 *     summary: Obtener actividades
 *     description: Obtiene una lista de actividades o una actividad específica por ID
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID de la actividad (opcional)
 *         schema:
 *           type: integer
 *       - name: agencia_id
 *         in: query
 *         description: ID de la agencia para filtrar actividades (opcional)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Operación exitosa
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     code:
 *                       type: integer
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: "Actividades obtenidas exitosamente"
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           titulo:
 *                             type: string
 *                           imagen:
 *                             type: string
 *                           iframe_code:
 *                             type: string
 *                           estado:
 *                             type: string
 *                 - type: object
 *                   properties:
 *                     code:
 *                       type: integer
 *                       example: 200
 *                     message:
 *                       type: string
 *                       example: "Actividad obtenida exitosamente"
 *                     data:
 *                       type: object
 *       404:
 *         description: Actividad no encontrada
 *       500:
 *         description: Error interno del servidor
 */
