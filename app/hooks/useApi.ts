import { useState } from "react";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface ApiHookResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiHookResponse<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = async (url: string) => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await fetch(url);
      const result: ApiResponse<T> = await response.json();

      if (result.code >= 400) {
        throw new Error(result.message);
      }

      setState({ data: result.data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  return {
    ...state,
    fetchData,
  };
}
