# Sistema de Carritos Abandonados

## Descripción

Este sistema maneja automáticamente las reservas que quedan en estado "hold" por más de 7 minutos, moviéndolas a una tabla separada llamada `abandoned_cart` para mantener limpia la tabla principal de reservas.

## Arquitectura

### Tablas

1. **`reservas`** - Tabla principal de reservas activas y confirmadas
2. **`abandoned_cart`** - Tabla para reservas abandonadas (misma estructura que `reservas` + campo `abandoned_at`)

### Componentes

1. **Cron Job** (`/api/cron/move-abandoned-reservations`)
   - Se ejecuta cada 2 minutos
   - Busca reservas en "hold" con más de 7 minutos
   - Las mueve a `abandoned_cart`

2. **Servicio** (`utils/services/abandonedCartService.ts`)
   - Lógica para mover reservas abandonadas
   - Función para recuperar reservas desde `abandoned_cart`

3. **Webhook de Pago**
   - Modificado para buscar en `abandoned_cart` si no encuentra la reserva en `reservas`
   - Recupera automáticamente reservas abandonadas cuando se completa el pago

## Flujo de Datos

### 1. Creación de Reserva

```
Cliente crea reserva → Estado: "hold" → Tabla: reservas
```

### 2. Pago Completado (Normal)

```
Webhook Stripe → Busca en reservas → Actualiza a "confirmed"
```

### 3. Pago Completado (Tardío)

```
Webhook Stripe → No encuentra en reservas → Busca en abandoned_cart → Recupera y confirma
```

### 4. Reserva Abandonada

```
Cron Job (cada 2 min) → Busca reservas "hold" > 7 min → Libera cupo → Mueve a abandoned_cart
```

## Manejo del Cupo

### Liberación de Cupo
Cuando una reserva se mueve a `abandoned_cart`:
1. Se calculan las personas a liberar (solo tarifas cuentan como personas)
2. Se llama a la función RPC `liberar_cupo_turno()`
3. Se actualiza `cupo_disponible` en la tabla `turnos`
4. Se registra la operación en los logs

### Ocupación de Cupo
Cuando una reserva se recupera desde `abandoned_cart`:
1. Se calculan las personas a ocupar (solo tarifas cuentan como personas)
2. Se verifica que hay cupo disponible
3. Se llama a la función RPC `ocupar_cupo_turno()`
4. Se actualiza `cupo_disponible` en la tabla `turnos`
5. Se registra la operación en los logs

### Funciones RPC
- **`liberar_cupo_turno(p_turno_id, p_personas_a_liberar)`**: Libera cupo en un turno
- **`ocupar_cupo_turno(p_turno_id, p_personas_a_ocupar)`**: Ocupa cupo en un turno (con validación)

## Configuración

### Variables de Entorno

```env
CRON_SECRET_TOKEN=tu_token_secreto  # Opcional, para seguridad
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Vercel Cron Job

El archivo `vercel.json` configura el cron job:

```json
{
  "crons": [
    {
      "path": "/api/cron/move-abandoned-reservations",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

## Monitoreo

### Logs Importantes

1. **Cron Job**: Busca logs con "Starting abandoned reservations cleanup job"
2. **Recuperación**: Busca logs con "Reserva recuperada desde abandoned_cart"
3. **Errores**: Busca logs con "Error" en el contexto del servicio

### Métricas

- Reservas movidas por ejecución
- Errores de procesamiento
- Tiempo de ejecución del cron job

## Mantenimiento

### Verificar Estado del Sistema

```bash
# Llamar manualmente el endpoint para testing
curl -X GET https://tu-dominio.vercel.app/api/cron/move-abandoned-reservations
```

### Consultas Útiles

```sql
-- Ver reservas abandonadas
SELECT * FROM abandoned_cart ORDER BY abandoned_at DESC;

-- Contar reservas por estado
SELECT estado, COUNT(*) FROM reservas GROUP BY estado;

-- Ver reservas en hold (deberían ser pocas o ninguna)
SELECT * FROM reservas WHERE estado = 'hold';
```

## Troubleshooting

### Problema: Reservas no se mueven

1. Verificar que el cron job se ejecute
2. Revisar logs del endpoint
3. Verificar permisos de Supabase

### Problema: Pagos no se procesan

1. Verificar que la reserva existe en `abandoned_cart`
2. Revisar logs del webhook
3. Verificar estructura de datos

### Problema: Duplicados

1. Verificar que el DELETE de `abandoned_cart` funcione
2. Revisar transacciones de base de datos

## Consideraciones de Seguridad

1. **Autenticación**: El endpoint acepta un token opcional para mayor seguridad
2. **Logs**: Todas las operaciones se registran para auditoría
3. **Transacciones**: Las operaciones críticas deberían usar transacciones de base de datos

## Próximas Mejoras

1. **Métricas**: Dashboard para monitorear el sistema
2. **Notificaciones**: Alertas cuando hay errores
3. **Retención**: Política de limpieza de `abandoned_cart` antigua
4. **Analytics**: Análisis de patrones de abandono
