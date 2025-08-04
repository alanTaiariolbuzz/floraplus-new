import { Session } from "@supabase/supabase-js";

interface UseSessionReturn {
  session: Session | null;
  loading: boolean;
}

declare const useSession: () => UseSessionReturn;

export default useSession;
