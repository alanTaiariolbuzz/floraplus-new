import { z } from 'zod';

// Esquema de validación para horario
export const horarioSchema = z.object({
  id           : z.number().int().positive().optional(),          // ➊  NUEVO 26/6/2025
  actividad_id : z.number().int().positive().optional(),      // ➊  NUEVO  26/6/2025
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  dias: z.array(z.number().int('Cada día debe ser un número entero').min(0, 'Los días deben estar entre 0 y 6 según ISO (0: Domingo, 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes, 6: Sábado)').max(6, 'Los días deben estar entre 0 y 6 según ISO (0: Domingo, 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes, 6: Sábado)')),
  dia_completo: z.boolean().optional().default(false),
  hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, 'Formato de hora inválido (HH:MM[:SS])').optional().nullable(),
  hora_fin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, 'Formato de hora inválido (HH:MM[:SS])').optional().nullable(),
  cupo: z.number().int('El cupo debe ser un número entero').nonnegative('El cupo no puede ser negativo').optional().default(0),
  habilitada: z.boolean().optional().default(true)
}).superRefine((data, ctx) => {
  
  // Validar que los días estén en el rango ISO (0-6)
  if (data.dias && data.dias.length > 0) {
    const diasValidos = [0, 1, 2, 3, 4, 5, 6];
    const nombresDias = [
      "Domingo (0)", 
      "Lunes (1)", 
      "Martes (2)", 
      "Miércoles (3)", 
      "Jueves (4)", 
      "Viernes (5)", 
      "Sábado (6)"
    ];
    
    const diasInvalidos = data.dias.filter(dia => !diasValidos.includes(dia));
    
    if (diasInvalidos.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: `Días inválidos detectados: ${diasInvalidos.join(', ')}. Los días deben estar entre 0 y 6 según el estándar ISO: ${nombresDias.join(', ')}`,
        path: ['dias']
      });
    }
  }
  
  // Si no es día completo, validar que se proporcionen hora de inicio y fin
  if (data.dia_completo === false) {
    if (!data.hora_inicio) {
      ctx.addIssue({
        code: 'custom',
        message: 'La hora de inicio es requerida cuando no es día completo',
        path: ['hora_inicio']
      });
    }
    
    if (!data.hora_fin) {
      ctx.addIssue({
        code: 'custom',
        message: 'La hora de fin es requerida cuando no es día completo',
        path: ['hora_fin']
      });
    }
    
    // Validar que la hora de fin sea posterior a la de inicio
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
  }
});

// Tipo para Horario
export type Horario = z.infer<typeof horarioSchema>;
