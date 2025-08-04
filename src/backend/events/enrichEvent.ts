export interface EnrichedPayload {
  _meta: {
    id: string;
    origen: string;
    tipo: string;
    categoria: string;
    recibido_en?: string;
  };
  [key: string]: any;
}

export function enrichEventPayload(ev: any): EnrichedPayload {
  const category = (ev.tipo ?? '').split('.')[0];

  return {
    ...ev.payload,
    _meta: {
      id: ev.id,
      origen: ev.origen,
      tipo: ev.tipo,
      categoria: category,
      recibido_en: ev.recibido_en,
    },
  };
}
