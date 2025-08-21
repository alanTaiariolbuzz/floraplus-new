"use client";
import * as React from "react";
import { Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { AppProvider, Navigation } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";
import { createTheme } from "@mui/material/styles";
import {
  Avatar,
  Button,
  CircularProgress,
  Typography,
  Popover,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import StyleIcon from "@mui/icons-material/Style";
import DashboardIcon from "@mui/icons-material/SpaceDashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BarChartIcon from "@mui/icons-material/BarChart";
import DescriptionIcon from "@mui/icons-material/Description";
import LayersIcon from "@mui/icons-material/Layers";
import CachedIcon from "@mui/icons-material/Cached";
import CalendarIcon from "@mui/icons-material/DateRange";
import { useUser } from "@/context/UserContext";
import AccountMenu from "@/components/ui/accountMenu";
import SettingsIcon from "@mui/icons-material/Settings";
import AppsIcon from "@mui/icons-material/Apps";
import EmailIcon from "@mui/icons-material/Email";
import { ToastProvider } from "./gestion-dinamica/nueva/components/ToastContext";

// Contexto para el estado del sidebar
const SidebarContext = React.createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

// Loading fallback for Suspense
const LayoutLoadingFallback = () => (
  <div
    className="flex items-center justify-center min-h-screen"
    style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <CircularProgress />
  </div>
);

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, customUser, agency, isLoading } = useUser();
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // --- POPOVER STATE FOR PRODUCTOS ---
  const [productosPopoverAnchor, setProductosPopoverAnchor] =
    React.useState<HTMLElement | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const handleProductosPopoverClose = () => {
    setProductosPopoverAnchor(null);
  };

  const handleProductosSubItemClick = (segment: string) => {
    handleProductosPopoverClose();
    router.push(`/productos/${segment}`);
  };

  // Detectar clics en el ítem "Productos" del sidebar
  React.useEffect(() => {
    const handleProductosItemClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Buscar el elemento que contiene "Productos" en el texto
      const productosElement =
        target.closest(
          '[role="button"], [role="menuitem"], button, a, [class*="nav"], [class*="menu"]'
        ) || target;

      if (productosElement) {
        const textContent = productosElement.textContent || "";
        const hasProductosText = textContent
          .toLowerCase()
          .includes("productos");

        if (hasProductosText && sidebarCollapsed) {
          event.preventDefault();
          event.stopPropagation();
          setProductosPopoverAnchor(productosElement as HTMLElement);
          return false; // Prevenir la navegación por defecto
        }
      }
    };

    // Agregar listener al documento con capture para interceptar antes que otros handlers
    document.addEventListener("click", handleProductosItemClick, true);

    return () => {
      document.removeEventListener("click", handleProductosItemClick, true);
    };
  }, [sidebarCollapsed]);
  // --- END POPOVER STATE ---

  // --- SPY MODE MINI-HEADER LOGIC ---
  const isSuperAdminInSpyMode =
    user?.app_metadata?.role === "SUPER_ADMIN" && !!customUser?.agencia_id;

  const handleExitSpyMode = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/usuarios/superadmin/spy_mode?agencia_id=`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      window.location.href = "/admin/panel";
    } catch (error) {
      alert("Error al salir del Spy Mode");
    }
  };
  // --- END SPY MODE MINI-HEADER LOGIC ---

  // Helper function to map rol_id to UserRole
  const mapRolIdToUserRole = (rolId: number): string => {
    switch (rolId) {
      case 1: // ROLES.ADMIN
        return "SUPER_ADMIN";
      case 2: // ROLES.AGENCY_ADMIN
        return "AGENCY_ADMIN";
      case 3: // ROLES.AGENCY_USER
        return "AGENCY_USER";
      default:
        return "AGENCY_USER"; // Default fallback
    }
  };

  // Efecto para manejar la autenticación y redirecciones
  React.useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading) {
        if (!user) {
          router.replace("/sign-in");
          return;
        }

        // Use customUser.rol_id instead of user.user_metadata.role
        const role = customUser?.rol_id
          ? mapRolIdToUserRole(customUser.rol_id)
          : user.user_metadata?.role;

        // Redirigir SUPER_ADMIN desde rutas de agencia
        if (
          role === "SUPER_ADMIN" &&
          (pathname === "/" || pathname.startsWith("/dashboard"))
        ) {
          router.replace("/admin/panel");
          return;
        }

        // Redirigir AGENCY_USER y AGENCY_ADMIN desde rutas de admin
        if (
          (role === "AGENCY_USER" || role === "AGENCY_ADMIN") &&
          pathname.startsWith("/admin")
        ) {
          router.replace("/dashboard");
          return;
        }

        // Si no hay rol definido, redirigir al dashboard
        if (!role) {
          router.replace("/dashboard");
          return;
        }

        setIsInitialLoad(false);
      }
    };

    checkAuth();
  }, [user, customUser, isLoading, router, pathname]);

  // Si estamos en una ruta de admin, auth o no hay usuario, no renderizar este layout
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/forgot-password") ||
    !user
  ) {
    return <>{children}</>;
  }

  const NAVIGATION: Navigation = [
    {
      kind: "header",
      title: "",
    },
    {
      segment: "dashboard",
      title: "Panel",
      icon: <DashboardIcon />,
    },
    {
      segment: "calendario",
      title: "Calendario",
      icon: <CalendarIcon />,
    },
    {
      kind: "divider",
    },
    {
      kind: "header",
      title: "",
    },

    {
      segment: "gestion-dinamica",
      title: "Modificación Temporal",
      icon: <CachedIcon />,
    },
    {
      segment: "reservas",
      title: "Reservas",
      icon: <StyleIcon />,
    },
    {
      segment: "reportes",
      title: "Reportes",
      icon: <BarChartIcon />,
    },
    {
      segment: "correos",
      title: "Correos",
      icon: <EmailIcon />,
    },
    {
      segment: "productos",
      title: "Productos",
      icon: <AppsIcon />,
      children: [
        {
          segment: "actividades",
          title: "Actividades",
          icon: <DescriptionIcon />,
        },
        {
          segment: "adicionales",
          title: "Adicionales",
          icon: <DescriptionIcon />,
        },
      ],
    },
    {
      segment: "configuracion",
      title: "Configuración",
      icon: <SettingsIcon />,
    },
  ];

  const demoTheme = createTheme({
    palette: {
      primary: {
        main: "#F47920",
        dark: "#E65100",
        light: "#F47920",
        contrastText: "#ffffff",
      },
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            maxWidth: 260,
          },
          docked: {
            width: 260,
            "& .MuiDrawer-paper": {
              width: 260,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            "&.Mui-selected": {
              backgroundColor: "rgba(244, 121, 32, 0.08)",
              "&:hover": {
                backgroundColor: "rgba(244, 121, 32, 0.12)",
              },
            },
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            minWidth: 200,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            minWidth: 200,
          },
        },
      },
    },
  });

  const customBranding = {
    title: <></>,
    logo: (
      <div className="flex items-center h-full gap-2 justify-between w-[92vw]">
    
        <div className="flex items-center gap-2"><img src="/images/flora-logo.svg"></img>{agency?.nombre_comercial || ""}</div>
        <div className="flex items-center gap-2">
          <AccountMenu user={user} />
        </div>
      </div>
    ),
    homeUrl: "",
  };

  function MySidebarFooter({ mini }: { mini: boolean }) {
    const { setIsCollapsed } = React.useContext(SidebarContext);

    // Actualizar el estado del sidebar cuando cambie la prop mini
    React.useEffect(() => {
      setIsCollapsed(mini);
    }, [mini, setIsCollapsed]);

    return (
      <div className={`${mini ? "mb-[17px] ml-[9px]" : "mb-[17px] ml-[24px]"}`}>
        {mini ? (
          <img src="/images/flora-logo.svg" alt="Flora Plus" />
        ) : (
          <div className="flex items-center gap-2 ">
            <Typography
              sx={{ color: "black", whiteSpace: "nowrap" }}
              variant="body2"
            >
              Powered by
            </Typography>
            <img
              src="/images/flora-logo.svg"
              className="mb-1 "
              alt="Flora Plus"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed: sidebarCollapsed,
        setIsCollapsed: setSidebarCollapsed,
      }}
    >
      <ToastProvider>
        <AppProvider
          navigation={NAVIGATION}
          window={undefined}
          theme={demoTheme}
          branding={customBranding as any}
          router={{
            pathname,
            searchParams,
            navigate: (url: string | URL) => {
              // Interceptar navegación a /productos para redirigir a la primera subpágina
              const urlString = url instanceof URL ? url.pathname : url;

              // Si intenta navegar a /productos, redirigir a /productos/actividades
              if (urlString === "/productos") {
                router.push("/productos/actividades");
                return;
              }

              // Para todas las demás URLs, navegar normalmente
              router.push(
                url instanceof URL ? `${url.pathname}${url.search}` : url
              );
            },
          }}
        >
          {/* MINI-HEADER SPY MODE */}
          {isSuperAdminInSpyMode && (
            <div className="w-screen h-[45px] bg-[#263238] flex justify-center gap-5 items-center px-4 z-50 ">
              <Typography sx={{ color: "white" }}>
                Te encuentras en la cuenta de {agency?.nombre_comercial}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleExitSpyMode}
              >
                Salir
              </Button>
            </div>
          )}
          {/* END MINI-HEADER */}

          {/* PRODUCTOS POPOVER */}
          <Popover
            open={Boolean(productosPopoverAnchor)}
            anchorEl={productosPopoverAnchor}
            onClose={handleProductosPopoverClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            PaperProps={{
              elevation: 8,
              sx: {
                minWidth: 200,
                mt: 2,
                mx: 1,
                py: 0.5,
              },
            }}
          >
            <MenuItem
              onClick={() => handleProductosSubItemClick("actividades")}
            >
              <ListItemIcon>
                <DescriptionIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Actividades</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => handleProductosSubItemClick("adicionales")}
            >
              <ListItemIcon>
                <DescriptionIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Adicionales</ListItemText>
            </MenuItem>
          </Popover>
          {/* END PRODUCTOS POPOVER */}

          <DashboardLayout
            sidebarExpandedWidth={260}
            slots={{
              sidebarFooter: MySidebarFooter,
            }}
          >
            {children}
          </DashboardLayout>
        </AppProvider>
      </ToastProvider>
    </SidebarContext.Provider>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LayoutLoadingFallback />}>
      <ProtectedLayoutContent children={children} />
    </Suspense>
  );
}
