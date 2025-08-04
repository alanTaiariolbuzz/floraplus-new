import { NextRequest, NextResponse } from 'next/server';
import { getLastErrorLogs, getLastInfoLogs } from '../../../utils/error/logger';

/**
 * @swagger
 * /api/logs:
 *   get:
 *     tags:
 *       - Sistema
 *     summary: Obtener logs del sistema
 *     description: Retorna los últimos logs de error o información
 *     parameters:
 *       - name: type
 *         in: query
 *         description: Tipo de logs a obtener (error o info)
 *         schema:
 *           type: string
 *           enum: [error, info]
 *           default: error
 *       - name: count
 *         in: query
 *         description: Número de logs a retornar
 *         schema:
 *           type: integer
 *           default: 20
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
 *                 type:
 *                   type: string
 *                   example: "error"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'error';
    const countParam = searchParams.get('count');
    const count = countParam ? parseInt(countParam, 10) : 20;
    
    let logs: string[] = [];
    
    if (type === 'error') {
      logs = getLastErrorLogs(count);
    } else if (type === 'info') {
      logs = getLastInfoLogs(count);
    } else {
      return NextResponse.json({
        code: 400,
        message: 'Tipo de log inválido. Debe ser "error" o "info".'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      code: 200,
      type,
      data: logs
    }, { status: 200 });
  } catch (err) {
    console.error('Error al obtener logs:', err);
    return NextResponse.json({
      code: 500,
      message: 'Error al obtener logs'
    }, { status: 500 });
  }
}
