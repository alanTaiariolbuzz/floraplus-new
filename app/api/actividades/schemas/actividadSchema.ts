import { z } from "zod";

export const actividadInputSchema = z.object({
  actividad: z.object({
    agencia_id: z.number(),
    titulo: z.string(),
    titulo_en: z.string().optional(),
    descripcion: z.string(),
    descripcion_en: z.string().optional(),
    es_privada: z.boolean(),
    imagen: z.string(),
    estado: z.enum(["borrador", "publicado"]),
    ubicacion: z
      .object({
        lat: z.number(),
        lng: z.number(),
        direccion: z.string().optional(),
      })
      .nullable()
      .optional(),
    minimo_reserva: z.number().optional(),
    limite_reserva_minutos: z.number().nullable().optional(),
    umbral_limite_personas: z.number().nullable().optional(),
    umbral_limite_minutos: z.number().nullable().optional(),
    umbral_limite_tipo: z.string().nullable().optional(),
  }),
  cronograma: z
    .array(
      z.object({
        fecha_inicio: z.string(), // "YYYY‑MM‑DD"
        dias: z.array(z.number()).optional(),
        dia_completo: z.boolean().optional(),
        hora_inicio: z.string().optional(), // "HH:MM"
        hora_fin: z.string().optional(),
        cupo: z.number().optional(),
      })
    )
    .optional(),
  tarifas: z
    .array(
      z.object({
        nombre: z.string(),
        precio: z.number(),
        nombre_en: z.string().optional(),
        moneda: z.string().optional().default("USD"),
      })
    )
    .optional(),
  relaciones: z
    .object({
      adicionales: z.array(z.number()).optional(),
      transportes: z.array(z.number()).optional(),
      descuentos: z.array(z.number()).optional(),
    })
    .optional(),
});
export type ActividadInput = z.infer<typeof actividadInputSchema>;

// Esquema de la actividad
export const actividadSchema = z.preprocess((raw) => {
  // ya es "nuevo" si existe la clave actividad
  if (raw && typeof raw === "object" && "actividad" in (raw as object)) {
    return raw; // se validará directo con actividadInputSchema
  }

  // ---- Adaptación desde el formato antiguo ----
  const old = raw as any;

  return {
    actividad: {
      // Usar un valor válido para agencia_id (el valor 1 suele existir como default)
      agencia_id: old.agencia_id ?? 1,
      titulo: old.titulo || "",
      titulo_en: old.titulo_en || null,
      descripcion: old.descripcion || "",
      descripcion_en: old.descripcion_en || null,
      es_privada: old.es_privada || false,
      imagen: old.imagen || "",
      estado: old.estado || "borrador",
      ubicacion: old.ubicacion ?? null,
      minimo_reserva: old.detalles?.minimo_reserva || 1,
      limite_reserva_minutos: old.detalles?.limite_reserva_minutos ?? null,
      umbral_limite_personas: old.detalles?.umbral_limite_personas ?? null,
      umbral_limite_minutos: old.detalles?.umbral_limite_minutos ?? null,
      umbral_limite_tipo: old.detalles?.umbral_limite_tipo ?? null,
    },
    cronograma: old.cronograma || [],
    tarifas: old.tarifas || [],
    relaciones: {
      adicionales: limpiar(old.adicionales),
      transportes: limpiar(old.transporte),
      descuentos: limpiar(old.descuentos),
    },
  };
}, actividadInputSchema);

// 3️⃣  Helper para normalizar arrays
const limpiar = (arr?: number[]) =>
  !arr || (arr.length === 1 && arr[0] === 0) ? [] : arr;
// Inferir tipos automáticamente desde los esquemas Zod
export type ActividadData = z.infer<typeof actividadSchema>;

export interface ActividadCompleta {
  titulo: string;
  titulo_en?: string;
  descripcion: string;
  descripcion_en?: string;
  es_privada: boolean;
  imagen: string;
  estado: string;
  iframe_code?: string;
  stripe_account_id?: string;
  convenience_fee_fijo_valor?: number;
  agencia_id?: number;
  ubicacion?: {
    lat: number;
    lng: number;
    direccion?: string;
  };
  cronograma: any[];
  detalles: {
    minimo_reserva: number;
    limite_reserva_minutos?: number | null;
    umbral_limite_personas?: number | null;
    umbral_limite_minutos?: number | null;
    umbral_limite_tipo?: string | null;
  };
  tarifas: any[];
  adicionales: Adicional[];
  transporte: Transporte[];
  descuentos: Descuento[];
  id: number;
  creado_en?: string;
  actualizado_en?: string;
}

// Interfaces para los tipos de datos
export interface Adicional {
  id?: number;
  titulo?: string;
  titulo_en?: string;
  descripcion: string;
  descripcion_en?: string;
  precio: number;
  moneda: string;
}

export interface Transporte {
  id?: number;
  descripcion: string;
  precio: number;
  moneda: string;
  salida: string;
  llegada: string;
  cupo: number;
  ubicacion?: {
    lat: number;
    lng: number;
    direccion?: string;
  };
}

export interface Descuento {
  id?: number;
  descripcion: string;
  precio: number;
  moneda: string;
  aplica_a_todas: boolean;
  actividad_ids: number[];
}

// Esquema para el cronograma
const cronogramaSchema = z.object({
  id: z.number().optional(), // ID opcional para actualización
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dias: z.array(z.number().min(1).max(7)).default([]),
  dia_completo: z.boolean().default(false),
  hora_inicio: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  hora_fin: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  cupo: z.number().optional(),
});

// Esquema para tarifas
const tarifaSchema = z.object({
  id: z.number().optional(), // ID opcional para actualización
  nombre: z.string(),
  nombre_en: z.string().optional(),
  precio: z.number(),
  moneda: z.string().default("USD"),
});

// Esquema para los detalles de reserva
const detallesReservaSchema = z
  .object({
    minimo_reserva: z
      .number()
      .min(1, "El mínimo debe ser al menos 1")
      .optional(),
    limite_reserva_minutos: z.number().nullable().optional(),
    umbral_limite_personas: z.number().nullable().optional(),
    umbral_limite_minutos: z.number().nullable().optional(),
    umbral_limite_tipo: z.string().nullable().optional(),
  })
  .partial();

// Esquema de validación para la actualización de actividades
export const actualizacionActividadSchema = z
  .object({
    // Campos básicos
    titulo: z.string().optional(),
    titulo_en: z.string().optional(),
    descripcion: z.string().optional(),
    descripcion_en: z.string().optional(),
    es_privada: z.boolean().optional(),
    imagen: z.string().optional(),
    estado: z.enum(["borrador", "publicado"]).optional(),
    iframe_code: z.string().nullable().optional(),

    // Ubicación
    ubicacion: z
      .object({
        lat: z.number(),
        lng: z.number(),
        direccion: z.string().optional(),
      })
      .optional()
      .nullable(),

    // Detalles de reserva
    detalles: detallesReservaSchema.optional(),

    // Relaciones
    cronograma: z.array(cronogramaSchema).optional(),
    tarifas: z.array(tarifaSchema).optional(),
    adicionales: z.array(z.number()).optional(),
    transportes: z.array(z.number()).optional(),
    descuentos: z.array(z.number()).optional(),
  })
  .partial();
