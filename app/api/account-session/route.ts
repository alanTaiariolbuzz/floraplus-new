import { NextResponse } from 'next/server';
import { logError, logInfo } from '@/utils/error/logger';
import stripeClient from '@/utils/stripe/client';
import { updateStripeAccountInDB } from '@/utils/stripe/db';

export async function POST(request: Request) {
  try {
    const { account } = await request.json();
    if (!account) {
      return NextResponse.json(
        { error: "Falta el ID de cuenta de Stripe" },
        { status: 400 }
      );
    }

    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      return NextResponse.json({ error: stripeResult.error }, { status: 500 });
    }
    const stripe = stripeResult.data;

    // Create an Account Session enabling the account onboarding component
    const accountSession = await stripe.accountSessions.create({
      account: account,
      components: { account_onboarding: { enabled: true } },
    });

    return NextResponse.json({ clientSecret: accountSession.client_secret });
  } catch (err: any) {
    logError('Error al crear AccountSession:', err.message);
    return NextResponse.json(
      { error: 'Error al crear la sesión de cuenta de Stripe' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const account = searchParams.get('account');
    if (!account) {
      return NextResponse.json({ error: 'Falta el ID de cuenta de Stripe' }, { status: 400 });
    }

    const stripeResult = stripeClient();
    if (!stripeResult.success) {
      return NextResponse.json({ error: stripeResult.error }, { status: 500 });
    }
    const stripe = stripeResult.data;

    // Consultar el estado de la cuenta
    const stripeAccount = await stripe.accounts.retrieve(account);

    if (!stripeAccount) {
      return NextResponse.json({ error: 'Cuenta de Stripe no encontrada' }, { status: 404 });
      logError(`Cuenta de Stripe no encontrada: ${account}`);
    }

    const updateResult = await updateStripeAccountInDB(stripeAccount);
    if (updateResult.error) {
      logError(
        `Error al actualizar stripe_accounts para la cuenta ${account}: ${updateResult.error?.message || updateResult.error}`
      );
      logInfo(
        `ADVERTENCIA: No se pudo sincronizar la cuenta Stripe en la base de datos. Se recomienda ejecutar manualmente la ruta /api/stripe/accounts/${account}/sync para forzar la sincronización.`
      );
    }

    return NextResponse.json({
      account,
      details_submitted: stripeAccount.details_submitted,
      charges_enabled: stripeAccount.charges_enabled,
      payouts_enabled: stripeAccount.payouts_enabled,
      capabilities: stripeAccount.capabilities,
      eventually_due: stripeAccount.requirements?.eventually_due,
      currently_due: stripeAccount.requirements?.currently_due,
    });
  } catch (err: any) {
    console.error('Error al consultar estado de cuenta:', err.message);
    return NextResponse.json(
      { error: 'Error al consultar el estado de la cuenta de Stripe' },
      { status: 500 }
    );
  }
}
