import { ActividadCompleta } from "../schemas/actividadSchema";

export type RespuestaCreacion = {
  code: number;
  message: string;
  data?: {
    id: number;
    titulo: string;
    estado: string;
    cronograma: ActividadCompleta["cronograma"];
    tarifas: ActividadCompleta["tarifas"];
    adicionales: ActividadCompleta["adicionales"];
    transportes: ActividadCompleta["transporte"];
    descuentos: ActividadCompleta["descuentos"];
    detalles: ActividadCompleta["detalles"];
  };
  errors?: any;
  isValidationError?: boolean;
};

// ActividadResumen representa la forma simplificada que devuelve getAllActivities
export type ActividadResumen = {
  id: number;
  titulo: string;
  titulo_en?: string;
  imagen?: string;
  iframe_code?: string;
  estado: string;
};

// ActividadBasica representa el retorno mínimo garantizado de createActivity
export type ActividadBasica = {
  id: number;
  titulo: string;
  estado: string;
};

export type RespuestaConsulta = {
  code: number;
  message: string;
  data?: ActividadCompleta | ActividadResumen[];
};

export type ActualizacionActividad = {
  // Campos básicos
  titulo?: string;
  titulo_en?: string;
  descripcion?: string;
  descripcion_en?: string;
  es_privada?: boolean;
  imagen?: string;
  estado?: "borrador" | "publicado";
  iframe_code?: string | null;

  // Ubicación
  ubicacion?: {
    lat: number;
    lng: number;
    direccion?: string;
  } | null;

  // Detalles de reserva
  detalles?: {
    minimo_reserva?: number;
    limite_reserva_minutos?: number | null;
    umbral_limite_personas?: number | null;
    umbral_limite_minutos?: number | null;
    umbral_limite_tipo?: string | null;
  };

  // Relaciones
  cronograma?: any[];
  tarifas?: any[];
  adicionales?: number[];
  transportes?: number[];
  descuentos?: number[];
};

export type RespuestaActualizacion = {
  code: number;
  message: string;
  data?: any;
  isValidationError?: boolean;
  errors?: any; // Para errores de validación detallados
};
