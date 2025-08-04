/**
 * Script para sembrar un usuario ADMIN inicial en Supabase.
 * Uso:
 *   npx tsx scripts/seedSuperAdmin.ts ejemplo@mail.com
 */
import "dotenv/config";
import { inviteAdminUser } from "../auth/invite";

const email = process.argv[2];
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

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
    // Llamar a la utilidad centralizada para invitar y registrar al usuario ADMIN
    await inviteAdminUser({ email });
  } catch (err: any) {
    console.error(" Error durante el proceso de siembra del usuario ADMIN:");
    // inviteAdminUser ya utiliza logError para un registro detallado.
    // Aquí mostramos un mensaje más directo para la consola.
    console.error(
      err.message || JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
    );
    process.exit(1);
  }
})();
