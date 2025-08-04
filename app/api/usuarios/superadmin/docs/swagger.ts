/**
 * @swagger
 * /api/usuarios/superadmin:
 *   post:
 *     summary: Invites a new Super Admin user.
 *     description: |
 *       Sends an invitation email to the specified email address to create a new Super Admin user.
 *       The invited user will be assigned the 'SUPER_ADMIN' role.
 *       This endpoint requires the calling user to have the 'ADMIN' role.
 *     tags:
 *       - Usuarios
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address of the user to invite as Super Admin.
 *                 example: superadmin@example.com
 *               nombre:
 *                 type: string
 *                 description: The first name of the user to invite as Super Admin.
 *                 example: John
 *               apellido:
 *                 type: string
 *                 description: The last name of the user to invite as Super Admin.
 *                 example: Doe
 *     responses:
 *       '201':
 *         description: Invitation sent successfully.
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
 *                   example: Invitation sent
 *       '400':
 *         description: Bad Request - Invalid input (e.g., malformed email).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized - User not authenticated or does not have the required 'ADMIN' role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Conflict - User already exists or has a pending invitation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal Server Error - Failed to send invitation or save user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
