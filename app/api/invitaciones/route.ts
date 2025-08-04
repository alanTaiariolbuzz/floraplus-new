export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { logError } from '../../../utils/error/logger';
import { sendEmail } from '@/utils/email/service';


export async function POST(request: NextRequest) {
  let body: any = null;
  try {
    body = await request.json();
    await sendEmail({
      from: body.from,
      to: body.to,
      subject: body.subject,
      textBody: body.textBody,
      htmlBody: body.htmlBody,
    });
    return NextResponse.json({
      code: 200,
      message: 'Email enviado correctamente',
    });
  } catch (error) {
    const err = error as any;
    logError(err, {
      context: 'api-invitaciones-sendEmail',
      path: request.nextUrl?.pathname,
      requestBody: body ?? null,
      message: 'Error al enviar el email',
    });
    return NextResponse.json({
      code: 500,
      message: err.message || String(err),
    });
  }
}
