/**
 * @swagger
 * /api/reservas:
 *   get:
 *     summary: Obtiene reservas con filtros obligatorios
 *     description: Recupera las reservas según los criterios de filtrado especificados. Requiere al menos un parámetro de filtrado.
 *     tags: [Reservas]
 *     parameters:
 *       - name: id
 *         in: query
 *         description: ID de la reserva específica
 *         schema:
 *           type: integer
 *       - name: turno_id
 *         in: query
 *         description: ID del turno asociado
 *         schema:
 *           type: integer
 *       - name: actividad_id
 *         in: query
 *         description: ID de la actividad asociada
 *         schema:
 *           type: integer
 *       - name: agencia_id
 *         in: query
 *         description: ID de la agencia asociada
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de reservas que coinciden con los criterios
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
 *                   example: "Reservas recuperadas exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       turno_id:
 *                         type: integer
 *                         example: 5
 *                       actividad_id:
 *                         type: integer
 *                         example: 2
 *                       agencia_id:
 *                         type: integer
 *                         example: 1
 *                       cliente_id:
 *                         type: integer
 *                         example: 8
 *                       estado:
 *                         type: string
 *                         example: "hold"
 *                       monto_total:
 *                         type: number
 *                         example: 125.50
 *                       payment_intent_id:
 *                         type: string
 *                         example: "pi_3NKMbH2eZvKYlo2C1gUc32tj"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-23T22:30:00Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-23T22:35:00Z"
 *                       expires_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-04-23T23:00:00Z"
 *                       reserva_items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 7
 *                             item_type:
 *                               type: string
 *                               enum: [tarifa, adicional, transporte]
 *                               example: "tarifa"
 *                             item_id:
 *                               type: integer
 *                               example: 3
 *                             descripcion:
 *                               type: string
 *                               example: "Entrada Adulto"
 *                             cantidad:
 *                               type: integer
 *                               example: 2
 *                             precio_unitario:
 *                               type: number
 *                               example: 42.50
 *                             total:
 *                               type: number
 *                               example: 85.00
 *       400:
 *         description: Error en la solicitud - No se proporcionó ningún parámetro de filtrado
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
 *                   example: "Debe enviar id, actividad_id o turno_id"
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
 *                   example: "Error interno del servidor"
 *   post:
 *     summary: Crea un hold de reserva
 *     description: Crea un hold temporal para una reserva, bloqueando el cupo y generando un client secret para pago
 *     tags: [Reservas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - turno_id
 *               - items
 *             properties:
 *               turno_id:
 *                 type: integer
 *                 description: ID del turno para el cual se realiza la reserva
 *                 example: 5
 *               items:
 *                 type: array
 *                 description: Lista de ítems incluidos en la reserva (tarifas, adicionales, transportes)
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - item_type
 *                     - item_id
 *                     - cantidad
 *                   properties:
 *                     item_type:
 *                       type: string
 *                       enum: [tarifa, adicional, transporte]
 *                       description: Tipo de ítem reservado
 *                       example: "tarifa"
 *                     item_id:
 *                       type: integer
 *                       description: ID del ítem según su tipo
 *                       example: 3
 *                     cantidad:
 *                       type: integer
 *                       description: Número de unidades reservadas
 *                       minimum: 1
 *                       example: 2
 *     responses:
 *       200:
 *         description: Hold de reserva creado exitosamente
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
 *                   example: "Hold de reserva creado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reservaId:
 *                       type: integer
 *                       example: 123
 *                     clientSecret:
 *                       type: string
 *                       example: "cs_test_a1b2c3d4e5f6g7h8i9j0"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-04-23T22:45:00Z"
 *       400:
 *         description: Datos inválidos o error de validación
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
 *                   example: "Datos inválidos"
 *                 errors:
 *                   type: object
 *                   example: {
 *                     "turno_id": ["El turno no existe"],
 *                     "items[0].cantidad": ["Debe ser un número positivo"]
 *                   }
 *                 isValidationError:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Recurso no encontrado
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
 *                   example: "El turno especificado no existe"
 *       409:
 *         description: Conflicto (por ejemplo, cupo insuficiente)
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
 *                   example: "No hay cupo disponible para este turno"
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
 *                   example: "Error interno"
 */
