/**
 * Script para sembrar un usuario ADMIN inicial en Supabase.
 * Uso:
 *   npx tsx utils/scripts/seedSuperAdmin_withpass.ts ejemplo@mail.com
 */
import "dotenv/config";
import { createAdminUserWithPassword } from "../auth/invite";

const email = process.argv[2];
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const password = "prueba1234"; // Contraseña de prueba

if (!email) {
  console.error("  Error: Falta el correo electrónico como argumento.");
  process.exit(1);
}
if (!siteUrl) {
  console.error("  Error: Falta la variable de entorno NEXT_PUBLIC_SITE_URL.");
  process.exit(1);
}

(async () => {
  try {
    await createAdminUserWithPassword({ email, password });
  } catch (err: any) {
    console.error(" Error durante el proceso de creación del usuario ADMIN:");
    console.error(
      err.message || JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    );
    process.exit(1);
  }
})();
