"use client";

import { useState } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  TextField,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Chip,
} from "@mui/material";
import {
  Code as CodeIcon,
  Language as LanguageIcon,
  Web as WebIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function IntegrationDocsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [agencyId, setAgencyId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"es" | "en">("es");

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const generateCode = (type: string, language: "es" | "en") => {
    const baseUrl = "https://stg.getfloraplus.com";

    if (type === "activity" && activityId) {
      const url = `${baseUrl}/reservation/${language}?actividad_id=${activityId}`;
      return `<button onclick="window.open('${url}', '_blank')" style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
  ${language === "es" ? "Reservar Actividad" : "Reserve Activity"}
</button>`;
    }

    if (type === "menu" && agencyId) {
      const url = `${baseUrl}/reservation/menu/${language}?agency_id=${agencyId}`;
      return `<button onclick="window.open('${url}', '_blank')" style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
  ${language === "es" ? "Ver Todas las Actividades" : "View All Activities"}
</button>`;
    }

    return "Ingresa un ID válido para generar el código";
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Código copiado al portapapeles");
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <Box className="text-center mb-8">
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            Documentación de Integración Flora+
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto" }}
          >
            Guía completa para integrar Flora+ en tu sitio web de agencia de
            turismo
          </Typography>
        </Box>

        {/* Main Content */}
        <Box sx={{ width: "100%" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="integration tabs"
            >
              <Tab label="Inicio Rápido" icon={<WebIcon />} />
              <Tab label="Métodos de Integración" icon={<CodeIcon />} />
              <Tab label="Script Avanzado" icon={<SettingsIcon />} />
              <Tab label="Ejemplos Prácticos" icon={<LanguageIcon />} />
            </Tabs>
          </Box>

          {/* Tab 1: Quick Start */}
          <TabPanel value={tabValue} index={0}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    🚀 Integración Básica
                  </Typography>
                  <Typography variant="body1" paragraph>
                    La forma más sencilla de integrar Flora+ en tu sitio web es
                    usando botones o enlaces que abran nuestras páginas de
                    reserva.
                  </Typography>

                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Requisitos:</strong> Solo necesitas tu ID de
                      agencia y los IDs de tus actividades.
                    </Typography>
                  </Alert>

                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Botones simples"
                        secondary="Copia y pega el código HTML en tu sitio"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Sin dependencias"
                        secondary="No necesitas instalar nada adicional"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Funciona en cualquier sitio"
                        secondary="WordPress, HTML puro, o cualquier CMS"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    📋 Información Necesaria
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Tu ID de Agencia
                    </Typography>
                    <TextField
                      fullWidth
                      label="ID de Agencia"
                      value={agencyId}
                      onChange={(e) => setAgencyId(e.target.value)}
                      placeholder="Ej: 123"
                      helperText="Encuentra tu ID en el panel de administración"
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      ID de Actividad (opcional)
                    </Typography>
                    <TextField
                      fullWidth
                      label="ID de Actividad"
                      value={activityId}
                      onChange={(e) => setActivityId(e.target.value)}
                      placeholder="Ej: 456"
                      helperText="Para botones de actividades específicas"
                    />
                  </Box>

                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Idioma
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Chip
                        label="Español"
                        color={
                          selectedLanguage === "es" ? "primary" : "default"
                        }
                        onClick={() => setSelectedLanguage("es")}
                        clickable
                      />
                      <Chip
                        label="English"
                        color={
                          selectedLanguage === "en" ? "primary" : "default"
                        }
                        onClick={() => setSelectedLanguage("en")}
                        clickable
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </div>
          </TabPanel>

          {/* Tab 2: Integration Methods */}
          <TabPanel value={tabValue} index={1}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    🎯 Botón de Actividad Específica
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Crea un botón que abra directamente la página de reserva de
                    una actividad específica.
                  </Typography>

                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={generateCode("activity", selectedLanguage)}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    onClick={() =>
                      copyToClipboard(
                        generateCode("activity", selectedLanguage)
                      )
                    }
                    disabled={!activityId}
                    sx={{ backgroundColor: "#F47920" }}
                  >
                    Copiar Código
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    📋 Botón del Menú de Actividades
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Crea un botón que abra el menú completo de todas las
                    actividades de tu agencia.
                  </Typography>

                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={generateCode("menu", selectedLanguage)}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    onClick={() =>
                      copyToClipboard(generateCode("menu", selectedLanguage))
                    }
                    disabled={!agencyId}
                    sx={{ backgroundColor: "#F47920" }}
                  >
                    Copiar Código
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    🔗 Enlaces Simples
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Alternativa más simple usando enlaces HTML básicos.
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Enlace de Actividad
                    </Typography>
                    <TextField
                      fullWidth
                      value={
                        activityId
                          ? `https://stg.getfloraplus.com/reservation/${selectedLanguage}?actividad_id=${activityId}`
                          : ""
                      }
                      variant="outlined"
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                  </Box>

                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Enlace del Menú
                    </Typography>
                    <TextField
                      fullWidth
                      value={
                        agencyId
                          ? `https://stg.getfloraplus.com/reservation/menu/${selectedLanguage}?agency_id=${agencyId}`
                          : ""
                      }
                      variant="outlined"
                      InputProps={{ readOnly: true }}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    🖼️ Iframe Embebido
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Integra Flora+ directamente en tu página usando iframes.
                  </Typography>

                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={
                      activityId
                        ? `<iframe src="https://stg.getfloraplus.com/reservation/${selectedLanguage}?actividad_id=${activityId}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`
                        : ""
                    }
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 2 }}
                  />

                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Nota:</strong> Los iframes pueden tener
                      limitaciones de seguridad en algunos navegadores.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabPanel>

          {/* Tab 3: Advanced Script */}
          <TabPanel value={tabValue} index={2}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  🛠️ Script de Integración Avanzada
                </Typography>
                <Typography variant="body1" paragraph>
                  Para una integración más avanzada, puedes usar nuestro script
                  JavaScript que proporciona funciones adicionales y mejor
                  control.
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Ventajas del script:</strong> Popups personalizados,
                    detección automática de idioma, funciones de utilidad y
                    mejor manejo de errores.
                  </Typography>
                </Alert>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    1. Incluir el Script
                  </Typography>
                  <TextField
                    multiline
                    rows={2}
                    fullWidth
                    value='<script src="https://stg.getfloraplus.com/flora-integration.js"></script>'
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    2. Usar las Funciones
                  </Typography>
                  <TextField
                    multiline
                    rows={6}
                    fullWidth
                    value={`// Abrir actividad específica
Flora.openActivity(${activityId || "ACTIVITY_ID"}, '${selectedLanguage}');

// Abrir menú de actividades
Flora.openMenu(${agencyId || "AGENCY_ID"}, '${selectedLanguage}');

// Crear botón dinámicamente
const button = Flora.createActivityButton(${activityId || "ACTIVITY_ID"}, '${selectedLanguage}');
document.body.appendChild(button);

// Crear iframe
const iframe = Flora.createActivityIframe(${activityId || "ACTIVITY_ID"}, '${selectedLanguage}');
document.getElementById('container').appendChild(iframe);`}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Box>

                <Box>
                  <Typography variant="h6" gutterBottom>
                    3. Botones Automáticos con Atributos
                  </Typography>
                  <TextField
                    multiline
                    rows={3}
                    fullWidth
                    value={`<button data-flora="activity" data-activity-id="${activityId || "ACTIVITY_ID"}" data-language="${selectedLanguage}">
  Reservar Actividad
</button>

<button data-flora="menu" data-agency-id="${agencyId || "AGENCY_ID"}" data-language="${selectedLanguage}">
  Ver Todas las Actividades
</button>`}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 4: Practical Examples */}
          <TabPanel value={tabValue} index={3}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    🎨 Ejemplo: WordPress
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Cómo integrar Flora+ en un sitio WordPress usando shortcodes
                    o widgets.
                  </Typography>

                  <TextField
                    multiline
                    rows={8}
                    fullWidth
                    value={`// En functions.php
function flora_reservation_button_shortcode(\$atts) {
    \$atts = shortcode_atts(array(
        'activity_id' => '',
        'agency_id' => '',
        'language' => 'es',
        'text' => 'Reservar Ahora'
    ), \$atts);
    
    if (!empty(\$atts['activity_id'])) {
        \$url = "https://stg.getfloraplus.com/reservation/{\$atts['language']}?actividad_id={\$atts['activity_id']}";
    } else {
        \$url = "https://stg.getfloraplus.com/reservation/menu/{\$atts['language']}?agency_id={\$atts['agency_id']}";
    }
    
    return '<button onclick="window.open(\\'' . \$url . '\\', \\'_blank\\')" style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">' . \$atts['text'] . '</button>';
}
add_shortcode('flora_button', 'flora_reservation_button_shortcode');

// Uso en páginas/posts:
// [flora_button activity_id="123" text="Reservar Tour"]
// [flora_button agency_id="456" text="Ver Actividades"]`}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    🎨 Ejemplo: HTML Puro
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Integración simple en un sitio HTML estático.
                  </Typography>

                  <TextField
                    multiline
                    rows={8}
                    fullWidth
                    value={`<!DOCTYPE html>
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
</html>`}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    🎨 Ejemplo: React/Next.js
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Componente React para integrar Flora+ en aplicaciones
                    modernas.
                  </Typography>

                  <TextField
                    multiline
                    rows={8}
                    fullWidth
                    value={`import React from 'react';

const FloraButton = ({ activityId, agencyId, language = 'es', children, ...props }) => {
  const handleClick = () => {
    let url;
    if (activityId) {
      url = \`https://stg.getfloraplus.com/reservation/\${language}?actividad_id=\${activityId}\`;
    } else {
      url = \`https://stg.getfloraplus.com/reservation/menu/\${language}?agency_id=\${agencyId}\`;
    }
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: '#F47920',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '500',
        ...props.style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// Uso:
// <FloraButton activityId="123">Reservar Tour</FloraButton>
// <FloraButton agencyId="456">Ver Actividades</FloraButton>`}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    🎨 Ejemplo: Shopify
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Integración en tiendas Shopify usando Liquid templates.
                  </Typography>

                  <TextField
                    multiline
                    rows={8}
                    fullWidth
                    value={`{% comment %} En product.liquid {% endcomment %}
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
</div>`}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabPanel>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body2" color="text.secondary">
            ¿Necesitas ayuda? Contacta a nuestro equipo de soporte técnico
          </Typography>
          <Button
            variant="outlined"
            href="mailto:soporte@getfloraplus.com"
            sx={{ mt: 2 }}
          >
            Contactar Soporte
          </Button>
        </Box>
      </div>
    </div>
  );
}
