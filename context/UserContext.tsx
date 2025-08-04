// src/context/UserContext.tsx
"use client"; // Agrega esta línea al principio del archivo

import React, { createContext, useState, useEffect, useContext } from "react";
import { createClient } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables.");
}

interface CustomUser {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  agencia_id: number;
  rol_id: number;
}

interface Agency {
  id: number;
  nombre: string;
  email_contacto: string;
  telefono: string;
  direccion: string | null;
  termino_cond: string;
  moneda: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
  cedula: number;
  web: string;
  pais: string;
  nombre_comercial: string;
  nombre_representante: string | null;
  fee: string;
  tax: string | null;
  convenience_fee_fijo: boolean;
  convenience_fee_fijo_valor: number;
  convenience_fee_variable: string | null;
  convenience_fee_variable_valor: number | null;
  stripe_account_id: string;
  nombre_departamento_reservas: string | null;
  email_departamento_reservas: string | null;
  telefono_departamento_reservas: string | null;
}

interface UserContextType {
  user: User | null;
  customUser: CustomUser | null;
  agency: Agency | null;
  isLoading: boolean;
  refreshAgency: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  customUser: null,
  agency: null,
  isLoading: true,
  refreshAgency: async () => {},
});

export const UserProvider = ({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [customUser, setCustomUser] = useState<CustomUser | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialUser) {
      fetchUser();
    } else {
      setUser(initialUser);
      setIsLoading(false);
    }
  }, [initialUser]);

  useEffect(() => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        // Fetch custom user data
        const { data: customUserData, error } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching custom user data:", error);
          return;
        }

        setCustomUser(customUserData);
      } catch (error) {
        console.error("Error in fetchUserData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  // Fetch agency data when we have the agencia_id
  useEffect(() => {
    const fetchAgencyData = async () => {
      if (!customUser?.agencia_id) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/agencias?id=${customUser.agencia_id}`
        );
        const result = await response.json();

        if (result.code === 200 && result.data?.[0]) {
          setAgency(result.data[0]);
        }
      } catch (error) {
        console.error("Error fetching agency data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgencyData();
  }, [customUser?.agencia_id]);

  const refreshAgency = async () => {
    if (!customUser?.agencia_id) return;

    try {
      const response = await fetch(
        `/api/agencias?id=${customUser.agencia_id}`
      );
      const result = await response.json();

      if (result.code === 200 && result.data?.[0]) {
        setAgency(result.data[0]);
      }
    } catch (error) {
      console.error("Error refreshing agency data:", error);
    }
  };

  return (
    <UserContext.Provider value={{ user, customUser, agency, isLoading, refreshAgency }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};
