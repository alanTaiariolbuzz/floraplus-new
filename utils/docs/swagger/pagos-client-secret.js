/**
 * @swagger
 * /api/pagos/{pagoId}/client-secret:
 *   get:
 *     summary: Recupera el client_secret de Stripe para un pago
 *     description: Permite al frontend recuperar un nuevo client_secret desde Stripe cuando lo ha perdido, sin exponer la clave secreta de API
 *     tags:
 *       - Pagos
 *       - Stripe
 *     parameters:
 *       - in: path
 *         name: pagoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del pago para el cual se requiere el client_secret
 *     responses:
 *       200:
 *         description: Client secret recuperado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                   description: Client secret del Payment Intent asociado al pago
 *       400:
 *         description: El pago ya está cerrado o en un estado que no permite recuperar el client_secret
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: El pago ya está cerrado
 *       404:
 *         description: Pago no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Pago no encontrado
 *       500:
 *         description: Error del servidor al procesar la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error al recuperar client_secret: message
 *     security:
 *       - supabaseJWT: []
 */
