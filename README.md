# Flora Plus

## 🎯 Descripción del Proyecto

**Flora Plus** es una plataforma completa de gestión de reservas turísticas que permite a agencias de viajes y operadores turísticos gestionar sus actividades, reservas, pagos y clientes desde una interfaz unificada.

### ✨ Características Principales

- **🎫 Gestión de Reservas**: Sistema completo de reservas con calendario integrado
- **💳 Procesamiento de Pagos**: Integración con Stripe para pagos seguros
- **📊 Dashboard Administrativo**: Métricas en tiempo real y reportes detallados
- **🏢 Gestión Multi-Agencia**: Soporte para múltiples agencias con roles diferenciados
- **📧 Sistema de Notificaciones**: Emails automáticos con Resend
- **🌍 Multiidioma**: Soporte para español e inglés
- **📱 Interfaz Responsiva**: Diseño adaptativo para todos los dispositivos

## 🏗️ Arquitectura del Sistema

### Frontend

- **Next.js 14** con App Router
- **React 19** con TypeScript
- **Material-UI (MUI)** para componentes
- **Tailwind CSS** para estilos
- **Zustand** para gestión de estado

### Backend

- **Supabase** como base de datos y autenticación
- **Stripe** para procesamiento de pagos
- **Resend** para envío de emails
- **API Routes** de Next.js

### Base de Datos

- **PostgreSQL** (Supabase)
- Tablas principales: `agencias`, `actividades`, `reservas`, `pagos`, `usuarios`

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** (v18 o superior)
- **npm** o **yarn**
- **Cuenta de Supabase**
- **Cuenta de Stripe** (para pagos)
- **Cuenta de Resend** (para emails)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/noriadigital/nextjs-with-supabase.git
cd nextjs-with-supabase
```

### 2. Instalar Dependencias

```bash
npm install --legacy-peer-deps
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Resend (Email)
RESEND_API_KEY=your-resend-api-key

# Otros
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Configurar Base de Datos

Ejecuta las migraciones de Supabase:

```bash
# Desde el dashboard de Supabase o usando la CLI
# Las migraciones están en /db/migrations/
```

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`

## 📋 Estructura del Proyecto

```
├── app/                    # Next.js App Router
│   ├── (auth-pages)/      # Páginas de autenticación
│   ├── (protected)/       # Páginas protegidas
│   │   ├── admin/         # Panel administrativo
│   │   ├── dashboard/     # Dashboard de agencia
│   │   ├── productos/     # Gestión de productos
│   │   └── reservas/      # Gestión de reservas
│   └── api/               # API Routes
├── components/            # Componentes reutilizables
├── utils/                # Utilidades y servicios
├── types/                # Definiciones de TypeScript
└── docs/                 # Documentación
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run dev:sessions     # Dev con herramientas de sesión

# Construcción
npm run build            # Construir para producción
npm run start            # Iniciar servidor de producción

# Testing
npm run test             # Ejecutar tests
npm run test:watch       # Tests en modo watch

# Utilidades
npm run build:openapi    # Generar documentación OpenAPI
npm run configure-payouts # Configurar pagos de Stripe
```

## 🎨 Características Destacadas

### Dashboard Administrativo

- **Métricas en Tiempo Real**: Ingresos, ventas, promedio de reservas
- **Gestión de Agencias**: Panel para administrar múltiples agencias
- **Reportes Detallados**: Análisis de ventas y rendimiento

### Sistema de Reservas

- **Calendario Integrado**: Visualización de disponibilidad
- **Proceso de Reserva**: Flujo completo desde selección hasta pago
- **Gestión de Turnos**: Horarios y disponibilidad
- **Sistema de Precios**: Tarifas dinámicas y descuentos

### Procesamiento de Pagos

- **Stripe Connect**: Integración completa con Stripe
- **Pagos Embebidos**: Experiencia de pago integrada
- **Manejo de Comisiones**: Sistema automático de comisiones
- **Reembolsos**: Gestión de reembolsos y cancelaciones

### Sistema de Emails

- **Templates Automáticos**: Confirmaciones, recordatorios, cancelaciones
- **Multiidioma**: Emails en español e inglés
- **Resend Integration**: Envío confiable de emails

## 🔐 Roles y Permisos

### Administrador

- Acceso completo a todas las funcionalidades
- Gestión de agencias y usuarios
- Métricas globales de la plataforma

### Agencia

- Gestión de sus propias actividades
- Dashboard de reservas y ventas
- Configuración de pagos y comisiones

### Usuario de Agencia

- Gestión de reservas específicas
- Atención al cliente
- Reportes básicos

## 📊 Métricas y Reportes

### Dashboard Principal

- **Ingresos del día**: Comisiones generadas
- **Total transaccionado**: Monto total de ventas
- **Cantidad de ventas**: Número de reservas confirmadas
- **Promedio de reserva**: Valor promedio por reserva

### Reportes Disponibles

- Reportes de ventas por período
- Análisis de actividades más populares
- Métricas de conversión
- Reportes de cancelaciones

## 🔄 Flujo de Trabajo

### 1. Configuración Inicial

1. Crear cuenta de agencia
2. Configurar Stripe Connect
3. Configurar productos y actividades
4. Definir horarios y tarifas

### 2. Gestión Diaria

1. Revisar dashboard de reservas
2. Gestionar reservas pendientes
3. Procesar pagos y confirmaciones
4. Enviar notificaciones automáticas

### 3. Reportes y Análisis

1. Revisar métricas diarias
2. Analizar reportes de ventas
3. Optimizar productos y precios
4. Gestionar reembolsos si es necesario

## 🛠️ Desarrollo

### Estructura de Base de Datos

Las siguientes tablas son críticas para el funcionamiento del sistema:

- `agencias` - Información de agencias
- `actividades` - Productos turísticos
- `reservas` - Reservas de clientes
- `pagos` - Transacciones de Stripe
- `usuarios` - Usuarios del sistema
- `horarios` - Disponibilidad de actividades
- `tarifas` - Precios y comisiones

### Consideraciones Importantes

Si modificas alguna de estas tablas, actualiza los stored procedures en Supabase:

- `actividades`
- `horarios`
- `tarifas`
- `adicionales`
- `transportes`
- `descuentos`
- `actividad_descuento` (tabla pivote)
- `actividad_transporte` (tabla pivote)
- `actividad_adicionales` (tabla pivote)

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de conexión a Supabase**
   - Verificar variables de entorno
   - Comprobar configuración de Supabase

2. **Problemas con Stripe**
   - Verificar claves de API
   - Comprobar configuración de webhooks

3. **Emails no se envían**
   - Verificar configuración de Resend
   - Comprobar templates de email

---

**Flora Plus** - Plataforma completa de gestión turística
