import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/utils/error/logger';
import { createNuevaAgencia } from './controller';
import { createNuevaAgenciaSchema } from './schema';
import './docs/swagger';


export const POST = async (request: NextRequest) => {
    try {
        const body = await request.json();
        console.log("body en post route invite");
        console.log(body);
        
        const parsed_body = createNuevaAgenciaSchema.safeParse(body);
        console.log( parsed_body);
        
        if (!parsed_body.success) {
        return NextResponse.json({ error: parsed_body.error.format() }, { status: 400 });
        }
        const data = parsed_body.data;
        
        // Delegar al controlador
        console.log('Entrando a createNuevaAgencia...');

        const resultado =  await createNuevaAgencia(data);
        console.log('Cuenta creada:', data);
        if (resultado instanceof Error) {
            return NextResponse.json({ error: resultado.message }, { status: 500 });
        }
        
        return NextResponse.json(resultado);
    } catch (error) {
        logError(error, { endpoint: '/api/agencias/onboarding/invitar', fase: 'controlador' });
        return NextResponse.json({ error: 'Error inesperado al crear la agencia' }, { status: 500 });
    }
};
