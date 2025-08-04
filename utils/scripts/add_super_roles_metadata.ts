/**
 * Script para setear user_metadata.role y app_metadata.role a un usuario en Supabase.
 * Uso:
 *   npx tsx scripts/add_super_roles_metadata.ts USER_ID ROLE_NAME
 */

import "dotenv/config";

import { createAdminClient } from "@/utils/supabase/admin";

async function main() {
  const [, , userId, roleName] = process.argv;

  if (!userId || !roleName) {
    console.error(
      "Usage: npx tsx scripts/add_super_roles_metadata.ts USER_ID ROLE_NAME"
    );
    process.exit(1);
  }

  const supabase = await createAdminClient();

  // Update user_metadata
  const { error: userMetadataError } = await supabase.auth.admin.updateUserById(
    userId,
    {
      user_metadata: { role: roleName },
    }
  );
  if (userMetadataError) throw userMetadataError;

  // Update app_metadata
  const { error: appMetadataError } = await supabase.auth.admin.updateUserById(
    userId,
    {
      app_metadata: { role: roleName },
    }
  );
  if (appMetadataError) throw appMetadataError;
}

main().catch((e) => {
  console.error("Failed to update roles:", e);
  process.exit(1);
});
