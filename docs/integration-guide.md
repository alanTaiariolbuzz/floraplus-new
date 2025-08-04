# Guía de Integración Flora+ para Agencias de Turismo

## 📋 Resumen

Esta guía te ayudará a integrar Flora+ en tu sitio web de agencia de turismo. Flora+ es una plataforma de reservas que permite a tus clientes reservar actividades directamente desde tu sitio web.

## 🚀 Opciones de Integración

### 1. Integración Básica (Recomendada)

La forma más sencilla es usar botones o enlaces que abran nuestras páginas de reserva en una nueva pestaña.

#### Para una Actividad Específica

```html
<button
  onclick="window.open('https://stg.getfloraplus.com/reservation/es?actividad_id=123', '_blank')"
  style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;"
>
  Reservar Actividad
</button>
```

#### Para el Menú de Todas las Actividades

```html
<button
  onclick="window.open('https://stg.getfloraplus.com/reservation/menu/es?agency_id=456', '_blank')"
  style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;"
>
  Ver Todas las Actividades
</button>
```

### 2. Integración con Script Avanzado

Para más funcionalidades, incluye nuestro script JavaScript:

```html
<script src="https://stg.getfloraplus.com/flora-integration.js"></script>
```

Luego usa las funciones disponibles:

```javascript
// Abrir actividad específica
Flora.openActivity(123, "es");

// Abrir menú de actividades
Flora.openMenu(456, "es");

// Crear botón dinámicamente
const button = Flora.createActivityButton(123, "es");
document.body.appendChild(button);
```

### 3. Botones Automáticos

Con el script incluido, puedes usar atributos HTML para crear botones automáticamente:

```html
<button data-flora="activity" data-activity-id="123" data-language="es">
  Reservar Actividad
</button>

<button data-flora="menu" data-agency-id="456" data-language="es">
  Ver Todas las Actividades
</button>
```

## 🌐 URLs Disponibles

### Actividades Individuales

- **Español**: `https://stg.getfloraplus.com/reservation/es?actividad_id={ID}`
- **Inglés**: `https://stg.getfloraplus.com/reservation/en?actividad_id={ID}`

### Menú de Actividades

- **Español**: `https://stg.getfloraplus.com/reservation/menu/es?agency_id={ID}`
- **Inglés**: `https://stg.getfloraplus.com/reservation/menu/en?agency_id={ID}`

## 🎨 Personalización

### Colores

- **Color principal**: `#F47920` (naranja Flora+)
- **Color de texto**: `white` para botones, `#F47920` para enlaces

### Estilos CSS

```css
.flora-button {
  background-color: #f47920;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  display: inline-block;
}

.flora-button:hover {
  background-color: #e06a1a;
}
```

## 📱 Ejemplos por Plataforma

### WordPress

#### Usando Shortcodes

```php
// En functions.php
function flora_reservation_button_shortcode($atts) {
    $atts = shortcode_atts(array(
        'activity_id' => '',
        'agency_id' => '',
        'language' => 'es',
        'text' => 'Reservar Ahora'
    ), $atts);

    if (!empty($atts['activity_id'])) {
        $url = "https://stg.getfloraplus.com/reservation/{$atts['language']}?actividad_id={$atts['activity_id']}";
    } else {
        $url = "https://stg.getfloraplus.com/reservation/menu/{$atts['language']}?agency_id={$atts['agency_id']}";
    }

    return '<button onclick="window.open(\'' . $url . '\', \'_blank\')" style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">' . $atts['text'] . '</button>';
}
add_shortcode('flora_button', 'flora_reservation_button_shortcode');
```

#### Uso en páginas/posts:

```
[flora_button activity_id="123" text="Reservar Tour"]
[flora_button agency_id="456" text="Ver Actividades"]
```

### HTML Puro

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Mi Agencia de Turismo</title>
    <script src="https://stg.getfloraplus.com/flora-integration.js"></script>
  </head>
  <body>
    <h1>Nuestros Tours</h1>

    <div class="tour-card">
      <h2>Tour por la Ciudad</h2>
      <p>Descubre los mejores lugares de la ciudad...</p>
      <button data-flora="activity" data-activity-id="123" data-language="es">
        Reservar Tour
      </button>
    </div>

    <div class="footer">
      <button data-flora="menu" data-agency-id="456" data-language="es">
        Ver Todas las Actividades
      </button>
    </div>
  </body>
</html>
```

### React/Next.js

```jsx
import React from "react";

const FloraButton = ({
  activityId,
  agencyId,
  language = "es",
  children,
  ...props
}) => {
  const handleClick = () => {
    let url;
    if (activityId) {
      url = `https://stg.getfloraplus.com/reservation/${language}?actividad_id=${activityId}`;
    } else {
      url = `https://stg.getfloraplus.com/reservation/menu/${language}?agency_id=${agencyId}`;
    }
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: "#F47920",
        color: "white",
        padding: "12px 24px",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "500",
        ...props.style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// Uso:
// <FloraButton activityId="123">Reservar Tour</FloraButton>
// <FloraButton agencyId="456">Ver Actividades</FloraButton>
```

### Shopify

```liquid
{% comment %} En product.liquid {% endcomment %}
<div class="product-info">
  <h1>{{ product.title }}</h1>
  <p>{{ product.description }}</p>

  {% if product.metafields.flora.activity_id %}
    <button
      onclick="window.open('https://stg.getfloraplus.com/reservation/es?actividad_id={{ product.metafields.flora.activity_id }}', '_blank')"
      style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;"
    >
      Reservar Actividad
    </button>
  {% endif %}
</div>

{% comment %} En footer.liquid {% endcomment %}
<div class="footer">
  <button
    onclick="window.open('https://stg.getfloraplus.com/reservation/menu/es?agency_id={{ shop.metafields.flora.agency_id }}', '_blank')"
    style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;"
  >
    Ver Todas las Actividades
  </button>
</div>
```

## 🔧 API del Script

### Funciones Principales

#### `Flora.openActivity(activityId, language, options)`

Abre una actividad específica en popup o nueva pestaña.

#### `Flora.openMenu(agencyId, language, options)`

Abre el menú de actividades de una agencia.

#### `Flora.createActivityButton(activityId, language, options)`

Crea un botón HTML para una actividad específica.

#### `Flora.createMenuButton(agencyId, language, options)`

Crea un botón HTML para el menú de actividades.

#### `Flora.createActivityIframe(activityId, language, options)`

Crea un iframe para una actividad específica.

#### `Flora.createMenuIframe(agencyId, language, options)`

Crea un iframe para el menú de actividades.

### Opciones Disponibles

```javascript
const options = {
  width: 800, // Ancho del popup
  height: 600, // Alto del popup
  features: "...", // Características del popup
  style: {
    // Estilos CSS personalizados
    backgroundColor: "#F47920",
    color: "white",
    // ... más estilos
  },
};
```

## 📊 Parámetros de URL

### Para Actividades Individuales

- `actividad_id`: ID único de la actividad (requerido)
- `language`: Idioma ('es' o 'en', opcional, por defecto 'es')

### Para Menú de Actividades

- `agency_id`: ID único de la agencia (requerido)
- `language`: Idioma ('es' o 'en', opcional, por defecto 'es')

## 🛠️ Solución de Problemas

### Popups Bloqueados

Si los popups están bloqueados, el script automáticamente abrirá en una nueva pestaña.

### Errores de CORS

Nuestras URLs están configuradas para permitir integración desde cualquier dominio.

### Problemas de Estilo

Asegúrate de que los estilos CSS no entren en conflicto con los de tu sitio.

## 📞 Soporte

Si necesitas ayuda con la integración:

- **Email**: soporte@getfloraplus.com
- **Documentación**: https://stg.getfloraplus.com/integration-docs
- **Panel de administración**: https://stg.getfloraplus.com

## 🔄 Actualizaciones

Este script se actualiza automáticamente. No necesitas descargar nuevas versiones.

## 📝 Notas Importantes

1. **IDs Únicos**: Cada actividad y agencia tiene un ID único que debes obtener del panel de administración.
2. **Idiomas**: Soporte completo para español e inglés.
3. **Responsive**: Los botones y iframes se adaptan automáticamente a dispositivos móviles.
4. **Seguridad**: Todas las URLs usan HTTPS y están protegidas contra ataques comunes.
5. **Rendimiento**: El script es ligero y no afecta el rendimiento de tu sitio.

---

**Flora+** - Simplificando las reservas de turismo
