# Dashboard Metrics - Panel de Administración

## Descripción

Este módulo implementa las métricas financieras del panel de administración de nivel plataforma, calculando datos de todas las connected accounts de Stripe para el día actual.

## Métricas Calculadas

### 1. **US$ Ingresos de hoy**

- **Descripción**: Monto total de comisiones que ganó Flora Plus hoy
- **Cálculo**: Suma de comisiones (10% por defecto) sobre cada venta exitosa del día
- **Fuente**: PaymentIntents y Charges de Stripe con status 'succeeded'

### 2. **US$ Total transaccionado**

- **Descripción**: Suma bruta de todas las reservas pagadas hoy por los clientes
- **Cálculo**: Suma de todos los montos de PaymentIntents y Charges exitosos del día
- **Incluye**: Parte del operador + comisión de Flora + tarifas de Stripe

### 3. **Cantidad de ventas hoy**

- **Descripción**: Número total de reservas confirmadas o transacciones exitosas realizadas hoy
- **Cálculo**: Conteo de PaymentIntents y Charges únicos con status 'succeeded'

### 4. **USD promedio de reserva hoy**

- **Descripción**: Promedio del total transaccionado dividido por la cantidad de ventas del día
- **Fórmula**: `total_transaccionado / cantidad_ventas_hoy`

## Arquitectura

### Archivos Principales

1. **`/app/api/admin/dashboard-metrics/route.ts`**

   - API endpoint que calcula las métricas
   - Obtiene todas las connected accounts activas desde la BD
   - Hace consultas paralelas a Stripe para cada cuenta
   - Agrega y devuelve los totales

2. **`/app/hooks/useDashboardMetrics.ts`**

   - Hook personalizado para consumir la API
   - Maneja estados de loading, error y datos
   - Proporciona función de refetch

3. **`/app/(protected)/admin/panel/page.tsx`**

   - Componente principal del dashboard
   - Usa el hook para obtener métricas
   - Renderiza las métricas usando MetricCard

4. **`/app/(protected)/admin/panel/components/MetricCard.tsx`**

   - Componente reutilizable para mostrar cada métrica
   - Maneja estados de loading y error
   - Formatea valores de moneda

5. **`/types/dashboard.ts`**
   - Tipos TypeScript compartidos
   - Interfaces para métricas del dashboard y cuentas individuales

### Flujo de Datos

```
Dashboard Component
       ↓
useDashboardMetrics Hook
       ↓
GET /api/admin/dashboard-metrics
       ↓
1. Obtener connected accounts desde BD
2. Consultar métricas de cada cuenta en Stripe
3. Agregar resultados
4. Devolver métricas finales
```

## Configuración

### Porcentaje de Comisión

Actualmente el porcentaje de comisión está hardcodeado en 10% en la función `getAccountMetrics`. Para hacerlo configurable:

1. Crear tabla de configuración de agencias
2. Obtener el porcentaje desde la configuración de cada agencia
3. Aplicar el porcentaje específico por cuenta

### Filtros de Fecha

Las métricas se calculan para el día actual (00:00:00 a 23:59:59). Para cambiar el período:

1. Modificar los timestamps en `getAccountMetrics`
2. Agregar parámetros de fecha a la API
3. Actualizar el hook para aceptar fechas

## Consideraciones de Performance

### Rate Limiting

- Stripe tiene límites de requests por minuto
- Las consultas se hacen en paralelo para optimizar tiempo
- Considerar implementar cache si hay muchas cuentas

### Paginación

- Stripe limita a 100 resultados por página
- Para cuentas con muchas transacciones, implementar paginación
- Actualmente solo procesa las primeras 100 transacciones del día

### Error Handling

- Si una cuenta falla, no afecta las otras
- Se registran errores en logs para debugging
- Se retornan valores en 0 para cuentas con error

## Seguridad

### Autenticación

- Solo usuarios autenticados pueden acceder a la API
- Verificación de rol de administrador (rol_id = 1)
- Validación de permisos en cada request

### Datos Sensibles

- No se exponen datos de transacciones individuales
- Solo se devuelven agregados
- Logs no incluyen información sensible

## Monitoreo

### Logs

- Se registran métricas calculadas para auditoría
- Errores se logean con contexto detallado
- Información de performance (número de cuentas procesadas)

### Métricas de Performance

- Tiempo de respuesta de la API
- Número de cuentas procesadas
- Errores por cuenta

## Próximas Mejoras

1. **Cache**: Implementar cache de 5-10 minutos para evitar sobrecargar Stripe
2. **Configuración Dinámica**: Hacer el porcentaje de comisión configurable por agencia
3. **Paginación**: Manejar cuentas con más de 100 transacciones diarias
4. **Métricas Históricas**: Agregar métricas por período (semana, mes, año)
5. **Alertas**: Notificaciones cuando las métricas estén por debajo de umbrales
6. **Gráficos**: Visualización de tendencias en el dashboard
