import { NextRequest, NextResponse } from 'next/server';
import { logError } from '../../../../utils/error/logger';


export async function POST(request: NextRequest) {
  //test

  return NextResponse.json({
    code: 503,
    message: 'ruta para prueba'
  });
}
