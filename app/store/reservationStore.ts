import { create } from "zustand";
import { Reserva } from "../types/reservation";

interface ReservationStore {
  reservas: Reserva[];
  addReservation: (reserva: Reserva) => void;
  removeReservation: (id: number) => void;
  updateReservation: (id: number, reserva: Partial<Reserva>) => void;
}

export const useReservationStore = create<ReservationStore>((set) => ({
  reservas: [],
  addReservation: (reserva) =>
    set((state) => ({
      reservas: [...state.reservas, reserva],
    })),
  removeReservation: (id) =>
    set((state) => ({
      reservas: state.reservas.filter((r) => r.id !== id),
    })),
  updateReservation: (id, reserva) =>
    set((state) => ({
      reservas: state.reservas.map((r) =>
        r.id === id ? { ...r, ...reserva } : r
      ),
    })),
}));
