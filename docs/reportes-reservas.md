# Reportes de Reservas

## Descripción

Esta funcionalidad permite a los usuarios descargar reportes de reservas en formato Excel (.xlsx) o CSV (.csv) con diferentes rangos de fechas.

## Características

### Campos Incluidos en el Reporte

El reporte incluye los siguientes campos:

- **Cliente**: Nombre completo del cliente
- **Nro. Reserva**: Código de la reserva o ID
- **Actividad**: Título de la actividad reservada
- **Estado**: Estado de la reserva (Pendiente, Confirmado, Expirado, Cancelado, No Show, Check In)
- **Precio Total**: Monto total de la reserva en USD
- **Fecha de Compra**: Fecha cuando se realizó la reserva
- **Fecha del Tour**: Fecha programada del tour
- **Hora del Tour**: Hora programada del tour
- **Personas**: Número total de personas en la reserva
- **Email**: Email del cliente
- **Teléfono**: Teléfono del cliente

### Rangos de Fechas Disponibles

- **Último mes**: Listado de reservas e ingresos del mes actual (desde el inicio del mes hasta hoy)
- **Últimos 3 meses**: Listado de reservas e ingresos de los últimos 3 meses
- **Últimos 6 meses**: Listado de reservas e ingresos de los últimos 6 meses
- **Histórico completo**: Listado de reservas e ingresos históricamente

### Formatos de Descarga

- **Excel (.xlsx)**: Archivo Excel con formato optimizado y columnas auto-ajustadas
- **CSV (.csv)**: Archivo CSV compatible con cualquier editor de hojas de cálculo

## Implementación Técnica

### Endpoint API

**URL**: `/api/reportes/reservas`

**Método**: GET

**Parámetros de consulta**:

- `dateRange`: Rango de fechas (last_month, last_3_months, last_6_months, all_time)
- `format`: Formato de archivo (xlsx, csv)

**Ejemplo de uso**:

```
GET /api/reportes/reservas?dateRange=last_month&format=xlsx
```

### Autenticación y Autorización

- El endpoint requiere autenticación de usuario
- Solo muestra reservas de la agencia del usuario autenticado
- Verifica que el usuario tenga una agencia asignada

### Filtros Aplicados

- **Por agencia**: Solo reservas de la agencia del usuario
- **Por fecha**: Filtro opcional según el rango seleccionado
- **Ordenamiento**: Por fecha de creación (más recientes primero)

### Normalización de Estados

Los estados de las reservas se normalizan para mostrar etiquetas en español:

- `hold` → "Pendiente"
- `confirmed` → "Confirmado"
- `expired` → "Expirado"
- `cancelled` → "Cancelado"
- `refunded` → "Cancelado"
- `no-show` → "No Show"
- `check-in` → "Check In"

## Interfaz de Usuario

### Página de Reportes

La página `/reportes` incluye:

1. **Sección de información**: Mensaje sobre reportes avanzados futuros
2. **Lista de reportes**: 4 opciones con diferentes rangos de fechas
3. **Botón de descarga**: Menú desplegable con opciones de formato
4. **Estados de carga**: Indicador de progreso durante la descarga
5. **Notificaciones**: Mensajes de éxito o error

### Funcionalidades de la UI

- **Menú desplegable**: Permite elegir entre Excel y CSV
- **Estados de carga**: Muestra spinner durante la descarga
- **Notificaciones**: Snackbar con mensajes de éxito/error
- **Descarga automática**: El archivo se descarga automáticamente al navegador

## Archivos Implementados

### Backend

- `app/api/reportes/reservas/route.ts`: Endpoint principal para generar reportes

### Frontend

- `app/(protected)/reportes/page.tsx`: Página de reportes con interfaz de usuario

### Dependencias

- `xlsx`: Para generar archivos Excel
- `date-fns`: Para manipulación de fechas

## Consideraciones de Seguridad

1. **Autenticación**: Verifica que el usuario esté autenticado
2. **Autorización**: Solo muestra reservas de la agencia del usuario
3. **Validación**: Valida los parámetros de entrada
4. **Manejo de errores**: Captura y maneja errores apropiadamente

## Limitaciones Actuales

1. **Tamaño de archivo**: No hay límite explícito en el número de registros
2. **Memoria**: Los archivos grandes podrían consumir mucha memoria
3. **Tiempo de respuesta**: Archivos muy grandes podrían tardar en generarse

## Mejoras Futuras

1. **Filtros adicionales**: Por actividad, estado, cliente, etc.
2. **Reportes personalizados**: Campos seleccionables por el usuario
3. **Programación**: Generación automática de reportes
4. **Compresión**: Para archivos muy grandes
5. **Paginación**: Para manejar grandes volúmenes de datos
6. **Templates**: Diferentes formatos de reporte
7. **Gráficos**: Incluir gráficos en reportes Excel

## Uso

1. Navegar a la página de reportes
2. Seleccionar el tipo de reporte deseado
3. Hacer clic en "DESCARGAR"
4. Elegir el formato (Excel o CSV)
5. El archivo se descargará automáticamente
6. Revisar las notificaciones para confirmar el éxito
