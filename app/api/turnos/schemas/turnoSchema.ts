import { z } from 'zod';

// Esquema de validación para turno (creación)
export const turnoSchema = z.object({
  horario_id: z.number().int('El ID de horario debe ser un número entero'),
  actividad_id: z.number().int('El ID de actividad debe ser un número entero'),
  agencia_id: z.number().int('El ID de agencia debe ser un número entero'),
  cupo_disponible: z.number().int('El cupo disponible debe ser un número entero').min(0, 'El cupo disponible no puede ser negativo').optional().nullable(),
  fecha: z.string(),
  hora_inicio: z.string().nullable(),
  hora_fin: z.string().optional().nullable(),
  bloquear: z.boolean().optional().default(false),
  cupo_total: z.number().int('El cupo total debe ser un número entero').min(0, 'El cupo total no puede ser negativo'),
}).superRefine((data, ctx) => {
  // Validar que al menos uno de los ID (horario o actividad) esté definido
  if (data.horario_id === null && data.actividad_id === null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Se debe proporcionar al menos un ID de horario o actividad',
      path: ['horario_id']
    });
  }
  
  // Si se proporciona fecha y hora de inicio/fin, validar coherencia
  if (data.hora_inicio && data.hora_fin) {
    const [horaInicioHH, horaInicioMM] = data.hora_inicio.split(':').map(Number);
    const [horaFinHH, horaFinMM] = data.hora_fin.split(':').map(Number);
    
    const minutosTotalesInicio = horaInicioHH * 60 + horaInicioMM;
    const minutosTotalesFin = horaFinHH * 60 + horaFinMM;
    
    if (minutosTotalesInicio >= minutosTotalesFin) {
      ctx.addIssue({
        code: 'custom',
        message: 'La hora de fin debe ser posterior a la hora de inicio',
        path: ['hora_fin']
      });
    }
  }
  
  // Validar relación entre cupo total y disponible si ambos están presentes
  if (data.cupo_total !== null && data.cupo_disponible !== null && 
      data.cupo_total !== undefined && data.cupo_disponible !== undefined) {
    if (data.cupo_disponible > data.cupo_total) {
      ctx.addIssue({
        code: 'custom',
        message: 'El cupo disponible no puede ser mayor que el cupo total',
        path: ['cupo_disponible']
      });
    }
  }
});

// Esquema de validación para actualizaciones (campos opcionales)
export const turnoUpdateSchema = z.object({
  horario_id: z.number().int('El ID de horario debe ser un número entero').optional(),
  actividad_id: z.number().int('El ID de actividad debe ser un número entero').optional(),
  agencia_id: z.number().int('El ID de agencia debe ser un número entero').optional(),
  cupo_disponible: z.number().int('El cupo disponible debe ser un número entero').min(0, 'El cupo disponible no puede ser negativo').optional().nullable(),
  fecha: z.string().optional(),
  hora_inicio: z.string().optional().nullable(),
  hora_fin: z.string().optional().nullable(),
  bloquear: z.boolean().optional(),
  cupo_total: z.number().int('El cupo total debe ser un número entero').min(0, 'El cupo total no puede ser negativo').optional(),
}).superRefine((data, ctx) => {
  // Si se proporciona fecha y hora de inicio/fin, validar coherencia
  if (data.hora_inicio && data.hora_fin) {
    const [horaInicioHH, horaInicioMM] = data.hora_inicio.split(':').map(Number);
    const [horaFinHH, horaFinMM] = data.hora_fin.split(':').map(Number);
    
    const minutosTotalesInicio = horaInicioHH * 60 + horaInicioMM;
    const minutosTotalesFin = horaFinHH * 60 + horaFinMM;
    
    if (minutosTotalesInicio >= minutosTotalesFin) {
      ctx.addIssue({
        code: 'custom',
        message: 'La hora de fin debe ser posterior a la hora de inicio',
        path: ['hora_fin']
      });
    }
  }
  
  // Validar relación entre cupo total y disponible si ambos están presentes
  if (data.cupo_total !== null && data.cupo_disponible !== null && 
      data.cupo_total !== undefined && data.cupo_disponible !== undefined) {
    if (data.cupo_disponible > data.cupo_total) {
      ctx.addIssue({
        code: 'custom',
        message: 'El cupo disponible no puede ser mayor que el cupo total',
        path: ['cupo_disponible']
      });
    }
  }
});
