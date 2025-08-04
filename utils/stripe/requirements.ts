import { logError } from '../error/logger';

/**
 * Obtiene los campos requeridos para completar la cuenta Stripe basados en el país
 * @param stripeAccountId ID de la cuenta Stripe
 * @returns Array de campos requeridos
 */
export async function getRequiredFieldsByCountry(stripeAccountId: string): Promise<string[]> {
  try {
    // La implementación real obtendría campos basados en el país y estado de la cuenta
    // Por ahora, devolvemos un conjunto básico de campos requeridos comunes
    const basicRequiredFields = [
      'legal_entity.address',
      'legal_entity.business_name',
      'legal_entity.business_tax_id',
      'legal_entity.type',
      'bank_account',
      'tos_acceptance'
    ];

    return basicRequiredFields;
  } catch (error) {
    logError(error, {
      context: 'stripe:getRequiredFieldsByCountry',
      stripeAccountId,
      message: 'Error al determinar campos requeridos por país'
    });
    return [];
  }
}
