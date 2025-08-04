/**
 * @swagger
 * /api/agencias/onboarding/invitar:
 *   post:
 *     tags:
 *       - Agencias
 *     summary: Invitar y crear una nueva agencia
 *     description: Crea una nueva agencia con estado inactivo y envía invitación al email de contacto como administrador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agencia
 *               - condiciones_comerciales
 *               - usuario_administrador
 *             properties:
 *               agencia:
 *                 type: object
 *                 required:
 *                   - nombre_sociedad
 *                   - nombre_comercial
 *                   - cedula_juridica
 *                   - pais
 *                 properties:
 *                   nombre_sociedad:
 *                     type: string
 *                     description: Nombre legal de la agencia
 *                     minLength: 1
 *                   nombre_comercial:
 *                     type: string
 *                     description: Nombre comercial de la agencia
 *                     minLength: 1
 *                   cedula_juridica:
 *                     type: string
 *                     description: Número de identificación fiscal
 *                   pais:
 *                     type: string
 *                     description: País donde opera la agencia
 *                     minLength: 2
 *                   sitio_web:
 *                     type: string
 *                     format: uri
 *                     description: Sitio web de la agencia (opcional)
 *                   direccion:
 *                     type: string
 *                     description: Dirección física de la agencia
 *               condiciones_comerciales:
 *                 type: object
 *                 required:
 *                   - comision
 *                   - terminos_condiciones
 *                 properties:
 *                   comision:
 *                     type: number
 *                     description: Porcentaje de comisión (0-100)
 *                     minimum: 0
 *                     maximum: 100
 *                   terminos_condiciones:
 *                     type: string
 *                     description: Términos y condiciones de la agencia
 *                     minLength: 1
 *               configuracion_fees:
 *                 type: object
 *                 description: Configuración de impuestos y fees (opcional)
 *                 properties:
 *                   tax:
 *                     type: number
 *                     description: Porcentaje de impuesto aplicable (0-100)
 *                     minimum: 0
 *                     maximum: 100
 *                   convenience_fee_fijo:
 *                     type: boolean
 *                     description: Indica si el convenience fee es fijo
 *                   convenience_fee_fijo_valor:
 *                     type: number
 *                     description: Valor fijo del convenience fee
 *                     minimum: 0
 *                   convenience_fee_variable:
 *                     type: boolean
 *                     description: Indica si el convenience fee es variable
 *                   convenience_fee_variable_valor:
 *                     type: number
 *                     description: Porcentaje variable del convenience fee
 *                     minimum: 0
 *               usuario_administrador:
 *                 type: object
 *                 required:
 *                   - nombre
 *                   - mail
 *                   - telefono
 *                 properties:
 *                   nombre:
 *                     type: string
 *                     description: Nombre del administrador
 *                     minLength: 1
 *                   mail:
 *                     type: string
 *                     format: email
 *                     description: Email del administrador
 *                   telefono:
 *                     type: string
 *                     description: Número de teléfono del administrador
 *                     minLength: 5
 *                   direccion:
 *                     type: string
 *                     description: Dirección del administrador
 *     responses:
 *       200:
 *         description: Agencia creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID de la agencia creada
 *                 nombre:
 *                   type: string
 *                   description: Nombre de la agencia
 *                 email_contacto:
 *                   type: string
 *                   description: Email del administrador
 *                 activa:
 *                   type: boolean
 *                   description: Estado de la agencia (inicialmente false)
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   description: Fecha de creación
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
