    import { createAdminClient } from '@/utils/supabase/admin';
import { logError, logInfo } from '@/utils/error/logger';


export async function updatePago({
  stripe_session_id,
  customerId,
  status,
  externalStatus,
  clientReferenceId,
}: {
  stripe_session_id: string;
  customerId?: string | null;
  status: string;
  externalStatus?: string | null;
  clientReferenceId?: string | null;
}) {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('pagos')
    .update({
      customer_id: customerId ?? null,
      status,
      external_status: externalStatus ?? null,
      client_reference_id: clientReferenceId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_session_id', stripe_session_id)
    .select();

  if (error) {
    logError('Error updating pago', { error });
    throw error;
  }

  logInfo('Pago updated successfully', { stripe_session_id, data });
  return data;
}