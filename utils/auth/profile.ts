import { createClient } from '@/utils/supabase/client';

export type UserProfile = {
  id: string;
  email: string;
  agencia_id: number | null;
  rol_id: number;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('usuarios')
    .select(`
      id,
      email,
      agencia_id,
      rol_id
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error al obtener perfil de usuario:', error);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    agencia_id: data.agencia_id,
    rol_id: data.rol_id
  };
}
