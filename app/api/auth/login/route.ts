import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import './docs/swagger'; // Import Swagger documentation

const enableTestLogin = process.env.ENABLE_TEST_LOGIN_ENDPOINT === 'true';

export async function POST(req: NextRequest) {

  if (!enableTestLogin) return NextResponse.json({ message: 'Not Found' }, { status: 404 });

  const supabase = await createClient();

  const { email, password } = await req.json();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 401 });
  }

  // Opcional: set-cookie para navegar en el browser
  // NextResponse.next().cookies.set('sb-access-token...', data.session.access_token)
  return NextResponse.json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in:    data.session.expires_in,
    token_type:    data.session.token_type,
    user:          data.user,
  });
}
