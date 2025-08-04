/**
 * Flora+ Integration Script
 *
 * Este script facilita la integración de Flora+ en sitios web de agencias de turismo.
 * Incluye funciones para abrir modales, crear botones dinámicamente y manejar iframes.
 *
 * Uso:
 * 1. Incluir este script en tu sitio web
 * 2. Usar las funciones Flora.openActivity() o Flora.openMenu() para crear botones
 * 3. O usar Flora.createButton() para crear botones personalizados
 * 4. O simplemente agregar IDs a tus elementos HTML:
 *    - Para actividades: id="actividad-es-123" o id="actividad-en-456" (con sufijo opcional: actividad-es-123-KSLQ112)
 *    - Para menús de agencias: id="menu-es-123" o id="menu-en-456" (con sufijo opcional: menu-es-22-KSLQ112)
 *    - Compatibilidad: id="123" (actividad) o id="menu123" (menú)
 */

(function () {
  "use strict";

  // Detectar el entorno y configurar la URL base
  function getBaseUrl() {
    // Si estamos en el mismo dominio que el script, usar el origen actual
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return window.location.origin;
    }

    // En producción, usar el dominio de Flora+
    return "https://stg.getfloraplus.com";
  }

  // Configuración global
  const FLORA_CONFIG = {
    baseUrl: getBaseUrl(),
    modalWidth: "90%",
    modalHeight: "90%",
    modalMaxWidth: "1200px",
    modalMaxHeight: "800px",
    overlayColor: "rgba(0, 0, 0, 0.7)",
    animationDuration: "300ms",
  };

  // Variables globales para el modal
  let currentModal = null;
  let currentOverlay = null;

  // Función para crear el CSS del modal si no existe
  function createModalStyles() {
    if (document.getElementById("flora-modal-styles")) {
      return; // Los estilos ya existen
    }

    const styles = document.createElement("style");
    styles.id = "flora-modal-styles";
    styles.textContent = `
      .flora-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${FLORA_CONFIG.overlayColor};
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        color: #ffffff;
        transition: opacity ${FLORA_CONFIG.animationDuration} ease-in-out;
        backdrop-filter: blur(2px);
      }
      
      .flora-modal-overlay.active {
        opacity: 1;
      }
      
      .flora-modal-container {
        border-radius: 12px;
        // box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        width: ${FLORA_CONFIG.modalWidth};
        height: ${FLORA_CONFIG.modalHeight};
        max-width: ${FLORA_CONFIG.modalMaxWidth};
        max-height: ${FLORA_CONFIG.modalMaxHeight};
        position: relative;
        transform: scale(0.9);
        transition: transform ${FLORA_CONFIG.animationDuration} ease-in-out;

      }
      
      .flora-modal-overlay.active .flora-modal-container {
        transform: scale(1);
      }
      
      .flora-modal-header {
        position: absolute;
        top: -30px;
        left: 0;
        right: 0;
        height: 50px;
        // background: white; 
        // border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        z-index: 10;
      }
      
      .flora-modal-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }
      
      .flora-modal-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
      }
      
      .flora-modal-close {
        background-color: #f0f0f0;
        color: #333;
      }
      
      .flora-modal-content {
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 12px;
      }
      
      .flora-modal-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #ffffff;
        font-size: 16px;
      }
      
      .flora-modal-loading::after {
        content: '';
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #F47920;
        border-radius: 50%;
        animation: flora-spin 1s linear infinite;
        margin-left: 10px;
      }
      
      @keyframes flora-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .flora-modal-container {
          width: 95%;
          height: 95%;
          border-radius: 8px;
        }
        
        .flora-modal-header {
          height: 40px;
          padding: 0 15px;
        }
        
        .flora-modal-title {
          font-size: 14px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  // Función para crear el modal
  function createModal(title = "Flora+ Reservas") {
    // Crear estilos si no existen
    createModalStyles();

    // Crear overlay
    const overlay = document.createElement("div");
    overlay.className = "flora-modal-overlay";
    overlay.id = "flora-modal-overlay";

    // Crear contenedor del modal
    const container = document.createElement("div");
    container.className = "flora-modal-container";
    container.id = "flora-modal-container";

    // Crear header
    const header = document.createElement("div");
    header.className = "flora-modal-header";

    const titleElement = document.createElement("div");
    titleElement.className = "flora-modal-title";
    titleElement.textContent = title;

    const closeButton = document.createElement("button");
    closeButton.className = "flora-modal-close";
    closeButton.innerHTML = "x";
    closeButton.setAttribute("aria-label", "Cerrar modal");

    header.appendChild(titleElement);
    header.appendChild(closeButton);

    // Crear contenido (iframe)
    const content = document.createElement("iframe");
    content.className = "flora-modal-content";
    content.id = "flora-modal-iframe";

    // Crear loading
    const loading = document.createElement("div");
    loading.className = "flora-modal-loading";
    loading.textContent = "Cargando...";

    // Ensamblar modal
    container.appendChild(header);
    container.appendChild(content);
    container.appendChild(loading);
    overlay.appendChild(container);

    // Eventos
    closeButton.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Cerrar con ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && currentModal) {
        closeModal();
      }
    });

    return { overlay, container, content, loading };
  }

  // Función para abrir el modal
  function openModal(url, title) {
    // Cerrar modal existente si hay uno
    if (currentModal) {
      closeModal();
    }

    // Crear nuevo modal
    const { overlay, container, content, loading } = createModal(title);

    // Agregar al DOM
    document.body.appendChild(overlay);

    // Forzar reflow para que la animación funcione
    overlay.offsetHeight;

    // Activar animación
    overlay.classList.add("active");

    // Cargar contenido
    content.style.display = "none";
    loading.style.display = "flex";

    content.onload = () => {
      loading.style.display = "none";
      content.style.display = "block";
    };

    content.onerror = () => {
      loading.textContent = "Error al cargar el contenido";
      loading.style.color = "#ffffff";
    };

    content.src = url;

    // Guardar referencia
    currentModal = overlay;
    currentOverlay = overlay;

    // Prevenir scroll del body
    document.body.style.overflow = "hidden";

    return overlay;
  }

  // Función para cerrar el modal
  function closeModal() {
    if (!currentModal) return;

    currentModal.classList.remove("active");

    setTimeout(() => {
      if (currentModal && currentModal.parentNode) {
        currentModal.parentNode.removeChild(currentModal);
      }
      currentModal = null;
      currentOverlay = null;

      // Restaurar scroll del body
      document.body.style.overflow = "";
    }, parseInt(FLORA_CONFIG.animationDuration));
  }

  // Función principal para abrir una actividad específica
  function openActivity(activityId, language = "es", options = {}) {
    const url = `${FLORA_CONFIG.baseUrl}/reservation/${language}?actividad_id=${activityId}`;
    const title = language === "es" ? "Reservar Actividad" : "Reserve Activity";
    return openModal(url, title);
  }

  // Función para abrir el menú de actividades de una agencia
  function openMenu(agencyId, language = "es", options = {}) {
    const url = `${FLORA_CONFIG.baseUrl}/reservation/menu/${language}?agency_id=${agencyId}`;
    const title = language === "es" ? "" : "";
    return openModal(url, title);
  }

  // Función para abrir un popup (mantener compatibilidad)
  function openPopup(url, options = {}) {
    const title = options.title || "Flora+";
    return openModal(url, title);
  }

  // Función para crear un botón dinámicamente
  function createButton(options = {}) {
    const defaults = {
      text: "Reservar Ahora",
      type: "button", // 'button', 'link', 'popup'
      target: "_blank",
      style: {
        backgroundColor: "#F47920",
        color: "white",
        padding: "12px 24px",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "500",
        fontSize: "14px",
        textDecoration: "none",
        display: "inline-block",
      },
      className: "flora-button",
      onClick: null,
    };

    const config = Object.assign({}, defaults, options);
    const element =
      config.type === "link"
        ? document.createElement("a")
        : document.createElement("button");

    // Aplicar estilos
    Object.assign(element.style, config.style);

    // Configurar propiedades
    element.textContent = config.text;
    element.className = config.className;

    if (config.type === "link") {
      element.href = config.href || "#";
      element.target = config.target;
    }

    // Agregar evento click
    if (config.onClick) {
      element.addEventListener("click", config.onClick);
    }

    return element;
  }

  // Función para crear un iframe
  function createIframe(url, options = {}) {
    const defaults = {
      width: "100%",
      height: "600px",
      style: {
        border: "none",
        borderRadius: "8px",
        width: "100%",
        height: "600px",
      },
    };

    const config = Object.assign({}, defaults, options);
    const iframe = document.createElement("iframe");

    iframe.src = url;
    iframe.width = config.width;
    iframe.height = config.height;
    iframe.frameBorder = "0";

    // Aplicar estilos
    Object.assign(iframe.style, config.style);

    return iframe;
  }

  // Función para crear un botón de actividad específica
  function createActivityButton(activityId, language = "es", options = {}) {
    const buttonOptions = {
      text: language === "es" ? "Reservar Actividad" : "Reserve Activity",
      onClick: (e) => {
        e.preventDefault();
        openActivity(activityId, language, options);
      },
      ...options,
    };

    return createButton(buttonOptions);
  }

  // Función para crear un botón del menú de actividades
  function createMenuButton(agencyId, language = "es", options = {}) {
    const buttonOptions = {
      text:
        language === "es" ? "Ver Todas las Actividades" : "View All Activities",
      onClick: (e) => {
        e.preventDefault();
        openMenu(agencyId, language, options);
      },
      ...options,
    };

    return createButton(buttonOptions);
  }

  // Función para crear un iframe de actividad
  function createActivityIframe(activityId, language = "es", options = {}) {
    const url = `${FLORA_CONFIG.baseUrl}/reservation/${language}?actividad_id=${activityId}`;
    return createIframe(url, options);
  }

  // Función para crear un iframe del menú
  function createMenuIframe(agencyId, language = "es", options = {}) {
    const url = `${FLORA_CONFIG.baseUrl}/reservation/menu/${language}?agency_id=${agencyId}`;
    return createIframe(url, options);
  }

  // Función para agregar un botón a un elemento existente
  function addButtonToElement(elementSelector, button, position = "append") {
    const element = document.querySelector(elementSelector);
    if (!element) {
      console.error(`Flora+: Elemento no encontrado: ${elementSelector}`);
      return false;
    }

    if (position === "prepend") {
      element.insertBefore(button, element.firstChild);
    } else {
      element.appendChild(button);
    }

    return true;
  }

  // Función para agregar un iframe a un elemento existente
  function addIframeToElement(elementSelector, iframe, position = "append") {
    const element = document.querySelector(elementSelector);
    if (!element) {
      console.error(`Flora+: Elemento no encontrado: ${elementSelector}`);
      return false;
    }

    if (position === "prepend") {
      element.insertBefore(iframe, element.firstChild);
    } else {
      element.appendChild(iframe);
    }

    return true;
  }

  // Función para detectar el idioma del navegador
  function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith("en") ? "en" : "es";
  }

  // Función para inicializar automáticamente botones con atributos data-flora
  function initAutoButtons() {
    // Buscar botones con atributos data-flora (compatibilidad)
    const buttons = document.querySelectorAll("[data-flora]");

    buttons.forEach((button) => {
      const floraType = button.getAttribute("data-flora");
      const activityId = button.getAttribute("data-activity-id");
      const agencyId = button.getAttribute("data-agency-id");
      const language = button.getAttribute("data-language") || detectLanguage();

      if (floraType === "activity" && activityId) {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          openActivity(activityId, language);
        });
      } else if (floraType === "menu" && agencyId) {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          openMenu(agencyId, language);
        });
      }
    });

    // NUEVA FUNCIONALIDAD: Atributos simples para botones existentes
    // Buscar botones con data-flora-activity (ID de actividad directo)
    const activityButtons = document.querySelectorAll("[data-flora-activity]");

    activityButtons.forEach((button) => {
      const activityId = button.getAttribute("data-flora-activity");
      const language =
        button.getAttribute("data-flora-lang") || detectLanguage();

      // Preservar el onclick existente si lo tiene
      const existingOnClick = button.onclick;

      button.addEventListener("click", (e) => {
        // Si tiene onclick existente, ejecutarlo primero
        if (existingOnClick) {
          existingOnClick.call(button, e);
        }

        // Luego abrir el modal
        e.preventDefault();
        openActivity(activityId, language);
      });
    });

    // Buscar botones con data-flora-menu (ID de agencia directo)
    const menuButtons = document.querySelectorAll("[data-flora-menu]");

    menuButtons.forEach((button) => {
      const agencyId = button.getAttribute("data-flora-menu");
      const language =
        button.getAttribute("data-flora-lang") || detectLanguage();

      // Preservar el onclick existente si lo tiene
      const existingOnClick = button.onclick;

      button.addEventListener("click", (e) => {
        // Si tiene onclick existente, ejecutarlo primero
        if (existingOnClick) {
          existingOnClick.call(button, e);
        }

        // Luego abrir el modal
        e.preventDefault();
        openMenu(agencyId, language);
      });
    });

    // NUEVA FUNCIONALIDAD: Detectar por ID de elemento
    // Buscar elementos con ID que coincida con los patrones de Flora+
    const allElements = document.querySelectorAll("*[id]");

    allElements.forEach((element) => {
      const elementId = element.id;

      // Patrón para actividades: actividad-{idioma}-{id}[sufijo opcional]
      // Ejemplo: actividad-es-123, actividad-en-456, actividad-es-123-KSLQ112
      const actividadMatch = elementId.match(
        /^actividad-(es|en)-(\d+)(?:-[a-zA-Z0-9]+)?$/i
      );
      if (actividadMatch) {
        const language = actividadMatch[1];
        const activityId = actividadMatch[2];

        // Preservar el onclick existente si lo tiene
        const existingOnClick = element.onclick;

        element.addEventListener("click", (e) => {
          // Si tiene onclick existente, ejecutarlo primero
          if (existingOnClick) {
            existingOnClick.call(element, e);
          }

          // Luego abrir el modal de actividad
          e.preventDefault();
          openActivity(activityId, language);
        });
      }

      // Patrón para menús de agencias: menu-{idioma}-{id}[sufijo opcional]
      // Ejemplo: menu-es-123, menu-en-456, menu-es-22-KSLQ112
      const menuMatch = elementId.match(
        /^menu-(es|en)-(\d+)(?:-[a-zA-Z0-9]+)?$/i
      );
      if (menuMatch) {
        const language = menuMatch[1];
        const agencyId = menuMatch[2];

        // Preservar el onclick existente si lo tiene
        const existingOnClick = element.onclick;

        element.addEventListener("click", (e) => {
          // Si tiene onclick existente, ejecutarlo primero
          if (existingOnClick) {
            existingOnClick.call(element, e);
          }

          // Luego abrir el modal del menú
          e.preventDefault();
          openMenu(agencyId, language);
        });
      }

      // COMPATIBILIDAD: Patrones anteriores (mantener para compatibilidad)
      // Patrón para actividades: cualquier ID que sea solo números
      if (/^\d+$/.test(elementId)) {
        const language =
          element.getAttribute("data-flora-lang") || detectLanguage();

        // Preservar el onclick existente si lo tiene
        const existingOnClick = element.onclick;

        element.addEventListener("click", (e) => {
          // Si tiene onclick existente, ejecutarlo primero
          if (existingOnClick) {
            existingOnClick.call(element, e);
          }

          // Luego abrir el modal de actividad
          e.preventDefault();
          openActivity(elementId, language);
        });
      }

      // Patrón para menús de agencias: ID que empiece con "menu" seguido de números
      // Ejemplo: menu123, menu456, etc.
      if (/^menu\d+$/i.test(elementId)) {
        const agencyId = elementId.replace(/^menu/i, ""); // Extraer solo los números
        const language =
          element.getAttribute("data-flora-lang") || detectLanguage();

        // Preservar el onclick existente si lo tiene
        const existingOnClick = element.onclick;

        element.addEventListener("click", (e) => {
          // Si tiene onclick existente, ejecutarlo primero
          if (existingOnClick) {
            existingOnClick.call(element, e);
          }

          // Luego abrir el modal del menú
          e.preventDefault();
          openMenu(agencyId, language);
        });
      }
    });

    // Buscar enlaces con atributos Flora+
    const activityLinks = document.querySelectorAll("a[data-flora-activity]");

    activityLinks.forEach((link) => {
      const activityId = link.getAttribute("data-flora-activity");
      const language = link.getAttribute("data-flora-lang") || detectLanguage();

      link.addEventListener("click", (e) => {
        e.preventDefault();
        openActivity(activityId, language);
      });
    });

    const menuLinks = document.querySelectorAll("a[data-flora-menu]");

    menuLinks.forEach((link) => {
      const agencyId = link.getAttribute("data-flora-menu");
      const language = link.getAttribute("data-flora-lang") || detectLanguage();

      link.addEventListener("click", (e) => {
        e.preventDefault();
        openMenu(agencyId, language);
      });
    });
  }

  // Función para obtener la URL de una actividad
  function getActivityUrl(activityId, language = "es") {
    return `${FLORA_CONFIG.baseUrl}/reservation/${language}?actividad_id=${activityId}`;
  }

  // Función para obtener la URL del menú
  function getMenuUrl(agencyId, language = "es") {
    return `${FLORA_CONFIG.baseUrl}/reservation/menu/${language}?agency_id=${agencyId}`;
  }

  // Exponer la API global
  window.Flora = {
    // Funciones principales
    openActivity,
    openMenu,
    openPopup,
    openModal,
    closeModal,

    // Funciones de creación de elementos
    createButton,
    createIframe,
    createActivityButton,
    createMenuButton,
    createActivityIframe,
    createMenuIframe,

    // Funciones de utilidad
    addButtonToElement,
    addIframeToElement,
    detectLanguage,
    initAutoButtons,
    getActivityUrl,
    getMenuUrl,

    // Configuración
    config: FLORA_CONFIG,
  };

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAutoButtons);
  } else {
    initAutoButtons();
  }

  // Log de inicialización
})();
