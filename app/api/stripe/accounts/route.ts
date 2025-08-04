import { NextRequest, NextResponse } from 'next/server';
import { getStripeAccountStatus, syncStripeAccount } from '@/utils/stripe/sync';
import { createClient } from '@/utils/supabase/server';
import { logError, logInfo } from '@/utils/error/logger';


/// TODO Viejo, posiblemente eliminar
/**
 * GET /api/stripe/accounts/:id - Obtiene el estado de una cuenta Stripe
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el ID de la cuenta Stripe de los parámetros
    const urlParts = request.nextUrl.pathname.split('/');
    const stripeAccountId = urlParts[urlParts.length - 1];

    if (!stripeAccountId || !stripeAccountId.startsWith('acct_')) {
      return NextResponse.json({ error: 'ID de cuenta Stripe inválido' }, { status: 400 });
    }

    // Verificar permisos (el usuario debe estar asociado a la agencia o ser admin)
    const { data: userAgency } = await supabase
      .from('usuarios')
      .select('rol_id, agencia_id')
      .eq('id', user.id)
      .single();

    const isAdmin = userAgency?.rol_id === 1; // Asumiendo que rol_id=1 es admin

    if (!isAdmin) {
      // Verificar que el stripeAccountId pertenece a la agencia del usuario
      const { data: agency } = await supabase
        .from('agencias')
        .select('id')
        .eq('stripe_account_id', stripeAccountId)
        .eq('id', userAgency?.agencia_id)
        .single();

      if (!agency) {
        return NextResponse.json({ error: 'No autorizado para acceder a esta cuenta' }, { status: 403 });
      }
    }

    // Obtener el estado de la cuenta Stripe
    const result = await getStripeAccountStatus(stripeAccountId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    const err = error as any;
    logError({
      message: err.message,
      stack: err.stack,
      name: err.name,
      raw: err,
      context: 'api-stripe-accounts',
      path: request.nextUrl.pathname
    });
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

/**
 * POST /api/stripe/accounts/:id/sync - Sincroniza una cuenta Stripe con la base de datos
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si el usuario es admin
    const { data: userData } = await supabase
      .from('usuarios')
      .select('rol_id')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.rol_id === 1; // Asumiendo que rol_id=1 es admin

    if (!isAdmin) {
      return NextResponse.json({ error: 'Solo administradores pueden sincronizar cuentas' }, { status: 403 });
    }

    // Obtener el ID de la cuenta Stripe de los parámetros
    const urlParts = request.nextUrl.pathname.split('/');
    // El formato es /api/stripe/accounts/:id/sync
    const stripeAccountId = urlParts[urlParts.length - 2];

    if (!stripeAccountId || !stripeAccountId.startsWith('acct_')) {
      return NextResponse.json({ error: 'ID de cuenta Stripe inválido' }, { status: 400 });
    }

    // Obtener la agencia asociada a esta cuenta Stripe
    const { data: agency, error: agencyError } = await supabase
      .from('agencias')
      .select('id')
      .eq('stripe_account_id', stripeAccountId)
      .single();

    if (agencyError || !agency) {
      return NextResponse.json({ error: 'Agencia no encontrada para esta cuenta Stripe' }, { status: 404 });
    }

    // Sincronizar la cuenta
    const result = await syncStripeAccount(stripeAccountId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Cuenta sincronizada exitosamente', data: result.data });
  } catch (error) {
    const err = error as any;
    logError({
      message: err.message,
      stack: err.stack,
      name: err.name,
      raw: err,
      context: 'api-stripe-accounts-sync',
      path: request.nextUrl.pathname
    });
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
