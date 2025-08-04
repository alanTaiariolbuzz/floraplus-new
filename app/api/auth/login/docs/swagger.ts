/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logs in a user
 *     description: Authenticates a user with email and password. This endpoint is intended for testing purposes only and is only available when NODE_ENV is 'test'.
 *     tags: [Auth]
 *     security: []  
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address.
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password.
 *     responses:
 *       '200':
 *         description: Authentication successful. Returns session tokens and user information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: The access token for the session.
 *                 refresh_token:
 *                   type: string
 *                   description: The refresh token for the session.
 *                 expires_in:
 *                   type: integer
 *                   description: The duration in seconds until the access token expires.
 *                 token_type:
 *                   type: string
 *                   description: The type of token (e.g., "bearer").
 *                 user:
 *                   type: object
 *                   description: Information about the authenticated user.
 *       '401':
 *         description: Authentication failed. Invalid credentials or other error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message detailing the authentication failure.
 *       '404':
 *         description: Not Found. This endpoint is not available in the current environment (e.g., production/development).
 */