// Actividades Page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EmptyState from "@/components/Productos/EmptyState";
import {
  Button,
  Box,
  Typography,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  Divider,
  Skeleton,
  Dialog,
  DialogContent,
  Select,
  TextField,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CodeIcon from "@mui/icons-material/Code";
import LanguageIcon from "@mui/icons-material/Language";
import { cleanDigitSectionValue } from "@mui/x-date-pickers/internals/hooks/useField/useField.utils";
import { getApiUrl } from "@/lib/config";
import { useUser } from "@/context/UserContext";
import { FC } from "react";

interface Actividad {
  id: number;
  titulo: string;
  imagen: string;
  estado: string;
}

interface IntegrationCode {
  type: "button" | "link" | "iframe" | "popup";
  language: "es" | "en";
  code: string;
}

const d = getApiUrl("/actividades");



// Loading fallback component for Suspense
const LoadingFallback = () => <p>Loading page contents...</p>;

const ActivityCardSkeleton: FC = () => {
  return (
    <Card sx={{ width: 345 }} className="relative">
      <Skeleton variant="rectangular" height={205} />
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex flex-col bg-[#FAFAFA] rounded-[8px] p-2">
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="50%" height={20} />
          </div>
          <div className="flex flex-col bg-[#FAFAFA] rounded-[8px] p-2">
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="50%" height={20} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ActividadesContent = () => {
  const router = useRouter();
  const { customUser } = useUser();
  const agency_id = customUser?.agencia_id;
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Actividad[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Actividad[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<string>("all");
  const [error, setError] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedActivity, setSelectedActivity] = useState<Actividad | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Actividad | null>(
    null
  );
  const [integrationModalOpen, setIntegrationModalOpen] = useState(false);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<
    "button" | "link" | "iframe" | "popup"
  >("button");
  const [selectedLanguage, setSelectedLanguage] = useState<"es" | "en">("es");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    activity: Actividad
  ) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedActivity(activity);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedActivity(null);
  };

  const handleEdit = () => {
    if (selectedActivity) {
      router.push(`/productos/actividades/editar/${selectedActivity.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {

    if (activityToDelete) {
      try {
        const response = await fetch(`${d}?id=${activityToDelete.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Filtrar la actividad de la lista local (soft delete)
          setActivities(
            activities.filter((activity) => activity.id !== activityToDelete.id)
          );
          // Mostrar toast de éxito
          const message = "Actividad eliminada exitosamente";
          router.push(
            `/productos/actividades?toast=${encodeURIComponent(message)}`
          );
        } else {
          // Si hay un error, mostrar el mensaje de error
          const errorData = await response.json();
          setError(errorData.message || "Error al eliminar la actividad");
        }
      } catch (err) {
        setError("Error al eliminar la actividad");
      }
    }
    setDeleteModalOpen(false);
    setActivityToDelete(null);
  };

  const handleStatusToggle = async () => {
    if (selectedActivity) {
      try {
        const newStatus =
          selectedActivity.estado === "publicado" ? "borrador" : "publicado";

        // Si va a cambiar a borrador, mostrar modal de confirmación
        if (newStatus === "borrador") {
          setDraftModalOpen(true);
          return;
        }

        const response = await fetch(
          `${d}/cambiar-estado?id=${selectedActivity.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ estado: newStatus }),
          }
        );

        if (response.ok) {
          setActivities(
            activities.map((activity) =>
              activity.id === selectedActivity.id
                ? { ...activity, estado: newStatus }
                : activity
            )
          );
        }
      } catch (err) {
        setError("Error al actualizar el estado de la actividad");
      }
    }
    handleMenuClose();
  };

  const handleDraftConfirm = async () => {
    if (selectedActivity) {
      try {
        const response = await fetch(
          `${d}/cambiar-estado?id=${selectedActivity.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ estado: "borrador" }),
          }
        );

        if (response.ok) {
          setActivities(
            activities.map((activity) =>
              activity.id === selectedActivity.id
                ? { ...activity, estado: "borrador" }
                : activity
            )
          );
        }
      } catch (err) {
        setError("Error al actualizar el estado de la actividad");
      }
    }
    setDraftModalOpen(false);
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setActivityToDelete(selectedActivity);
    setDeleteModalOpen(true);
    handleMenuClose();
  };

  const handleDraftClick = () => {
    setDraftModalOpen(true);
    handleMenuClose();
  };

  const generateIntegrationCode = (
    activityId: number,
    type: "button" | "link" | "iframe" | "popup",
    language: "es" | "en"
  ): string => {
    const baseUrl = "https://stg.getfloraplus.com";
    const activityUrl = `${baseUrl}/reservation/${language}?actividad_id=${activityId}`;
    const menuUrl = `${baseUrl}/reservation/menu/${language}?agency_id=${agency_id}`;

    const texts = {
      es: {
        reserveNow: "Reservar Ahora",
        viewActivities: "Ver Todas las Actividades",
        buttonText: "Reservar Actividad",
        linkText: "Hacer Reserva",
      },
      en: {
        reserveNow: "Reserve Now",
        viewActivities: "View All Activities",
        buttonText: "Reserve Activity",
        linkText: "Make Reservation",
      },
    };

    const t = texts[language];

    switch (type) {
      case "button":
        return `<button onclick="window.open('${activityUrl}', '_blank')" style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
  ${t.buttonText}
</button>`;

      case "link":
        return `<a href="${activityUrl}" target="_blank" style="color: #F47920; text-decoration: none; font-weight: 500;">
  ${t.linkText}
</a>`;

      case "iframe":
        return `<iframe src="${activityUrl}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`;

      case "popup":
        return `<button data-flora-activity="${activityId}" data-flora-lang="${language}" style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
  ${t.buttonText}
</button>

<!-- Incluir el script de Flora+ -->
<script src="https://stg.getfloraplus.com/api/flora-integration.js"></script>`;

      default:
        return "";
    }
  };

  // Función para generar solo el script de integración
  const generateIntegrationScript = (): string => {
    return `<script src="https://stg.getfloraplus.com/flora-integration.js"></script>`;
  };

  // Función para generar IDs de menú con sufijos específicos
  const generateMenuIds = (): string => {
    return `id="menu-es-${agency_id}-FL"
id="menu-en-${agency_id}-FL"`;
  };

  const generateMenuCode = (
    type: "button" | "link" | "iframe" | "popup",
    language: "es" | "en"
  ): string => {
    const baseUrl = "https://stg.getfloraplus.com";
    const menuUrl = `${baseUrl}/reservation/menu/${language}?agency_id=${agency_id}`;

    const texts = {
      es: {
        viewActivities: "Ver Todas las Actividades",
        buttonText: "Ver Actividades",
        linkText: "Explorar Actividades",
      },
      en: {
        viewActivities: "View All Activities",
        buttonText: "View Activities",
        linkText: "Explore Activities",
      },
    };

    const t = texts[language];

    switch (type) {
      case "button":
        return `<button onclick="window.open('${menuUrl}', '_blank')" style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
  ${t.buttonText}
</button>`;

      case "link":
        return `<a href="${menuUrl}" target="_blank" style="color: #F47920; text-decoration: none; font-weight: 500;">
  ${t.linkText}
</a>`;

      case "iframe":
        return `<iframe src="${menuUrl}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`;

      case "popup":
        return `<button data-flora-menu="${agency_id}" data-flora-lang="${language}" style="background-color: #F47920; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
  ${t.buttonText}
</button>

<!-- Incluir el script de Flora+ -->
<script src="https://stg.getfloraplus.com/api/flora-integration.js"></script>`;

      default:
        return "";
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  const handleCreateActivity = () => {
    router.push("/productos/actividades/nueva");
  };

  // Cargar actividades desde la API
  useEffect(() => {
    const loadActivities = async () => {
      try {
        const response = await fetch(d);
        if (!response.ok) throw new Error("Error al obtener actividades");
        const { data } = await response.json();
        setActivities(data);
        setFilteredActivities(data);
      } catch (err) {
        setError("Error cargando actividades");
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, []);

  // Filtrar actividades por estado
  useEffect(() => {
    if (selectedEstado === "all") {
      setFilteredActivities(activities);
    } else {
      const filtered = activities.filter(
        (activity) => activity.estado === selectedEstado
      );
      setFilteredActivities(filtered);
    }
  }, [selectedEstado, activities]);

  if (loading) {
    return (
      <>
        <div className="flex flex-row justify-between items-center bg-[#FAFAFA] py-[20px] px-12">
          <Typography variant="h4" sx={{ fontWeight: "500" }}>
            Actividades
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ mb: 2 }}
            disabled
          >
            Crear Actividad
          </Button>
        </div>
        <div className="bg-[#FAFAFA] px-12">
          <div className="relative">
            <div className="flex flex-col gap-2">
              <Typography variant="subtitle2">
                Menú de todas las actividades
              </Typography>
              <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row gap-4">
                  <Skeleton
                    variant="rectangular"
                    sx={{ width: 130, height: 38, borderRadius: "8px" }}
                  />
                  <Skeleton
                    variant="rectangular"
                    sx={{ width: 130, height: 38, borderRadius: "8px" }}
                  />
                </div>
                <Skeleton
                  variant="rectangular"
                  sx={{ width: 150, height: 32, borderRadius: "4px" }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-row gap-4 flex-wrap mt-6">
            {[1, 2, 3, 4].map((index) => (
              <ActivityCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  if (activities.length < 1) {
    return (
      <div className="pt-[20px] px-12">
        <Typography variant="h4" sx={{ fontWeight: "500" }}>
          Actividades
        </Typography>
        <EmptyState
          entityName="Actividad"
          redirectPath="/productos/actividades/nueva"
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-row justify-between items-center bg-[#FAFAFA] py-[20px] px-12">
        <Typography variant="h4" sx={{ fontWeight: "500" }}>
          Actividades
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{ mb: 2 }}
          onClick={handleCreateActivity}
        >
          Crear Actividad
        </Button>
      </div>
      <div className=" bg-[#FAFAFA] px-12">
        <div className="relative">
          <div className="flex flex-col gap-2">
            <Typography variant="subtitle2">
              Menú de todas las actividades
            </Typography>
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-row gap-4">
                {/* <Button
                  variant="text"
                  startIcon={<LanguageIcon />}
                  onClick={() => window.open("/integration-docs", "_blank")}
                  sx={{
                    color: "#F47920",
                    "&:hover": {
                      backgroundColor: "rgba(244, 121, 32, 0.04)",
                    },
                  }}
                >
                  Ver Documentación
                </Button> */}

                <div
                  className="w-[130px] h-[38px] bg-white rounded-[8px] flex items-center justify-around border border-[#E0E0E0] cursor-pointer"
                  onClick={() => {
                    if (!agency_id) {
                      console.error("No agency ID found in user metadata");
                      return;
                    }
                    copyToClipboard(`id="menu-es-${agency_id}-FL"`, "menu_es");
                  }}
                >
                  <span className="text-sm font-medium text-[#000000]">
                    {copiedCode === "menu_es" ? "¡Copiado!" : "ESPAÑOL 🇪🇸"}
                  </span>
                  <ContentCopyIcon fontSize="small" sx={{ color: "#F47920" }} />
                </div>

                <div
                  className="w-[130px] h-[38px] bg-white rounded-[8px] flex items-center justify-around border border-[#E0E0E0] cursor-pointer"
                  onClick={() => {
                    if (!agency_id) {
                      console.error("No agency ID found in user metadata");
                      return;
                    }
                    copyToClipboard(`id="menu-en-${agency_id}-FL"`, "menu_en");
                  }}
                >
                  <span className="text-sm font-medium text-[#000000]">
                    {copiedCode === "menu_en" ? "¡Copiado!" : "INGLES 🇬🇧"}
                  </span>
                  <ContentCopyIcon fontSize="small" sx={{ color: "#F47920" }} />
                </div>
                <Button
                  variant="outlined"
                  startIcon={<CodeIcon />}
                  onClick={() => {
                    copyToClipboard(
                      generateIntegrationScript(),
                      "integration_script"
                    );
                  }}
                  sx={{
                    borderColor: "#F47920",
                    color: "#F47920",
                    "&:hover": {
                      borderColor: "#F47920",
                      backgroundColor: "rgba(244, 121, 32, 0.04)",
                    },
                  }}
                >
                  {copiedCode === "integration_script"
                    ? "¡Copiado!"
                    : "Copiar Script de Integración"}
                </Button>
              </div>

              {/* Selector de Estado */}
              <div>
                <Select
                  displayEmpty
                  value={selectedEstado}
                  onChange={(e) => setSelectedEstado(e.target.value as string)}
                  sx={{
                    minWidth: 150,
                    maxWidth: 180,
                    height: "32px",
                    ".MuiSelect-select": {
                      padding: "4px 14px",
                    },
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="publicado">Publicado</MenuItem>
                  <MenuItem value="borrador">Borrador</MenuItem>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row gap-4 flex-wrap my-6">
          {filteredActivities?.slice().map((activity) => (
            <Card sx={{ width: 345 }} key={activity.id} className="relative">
              <Chip
                label={activity?.estado}
                sx={{ backgroundColor: "#FAFAFA", color: "black" }}
                className="absolute capitalize top-[24px] left-[16px]"
              />

              <div className="absolute top-[24px] right-[16px]">
                <IconButton
                  aria-label="more options"
                  aria-controls="activity-menu"
                  aria-haspopup="true"
                  onClick={(e) => handleMenuOpen(e, activity)}
                  sx={{
                    padding: 0,
                    width: 28,
                    height: 28,
                    cursor: "pointer",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    "&:hover": {
                      backgroundColor: "#E3E3E3",
                    },
                  }}
                >
                  <MoreHorizIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </div>
              <CardMedia
                component="img"
                sx={{ height: 205 }}
                image={activity?.imagen}
                title={activity.id.toString()}
              />
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  {activity?.titulo}
                </Typography>

                {activity?.estado === "borrador" ? (
                  <div className="flex flex-col bg-[#FAFAFA] rounded-[8px] mt-2 p-4">
                    <Typography variant="body1" sx={{ color: "#9B9B9B" }}>
                      Esta actividad aún está en estado Borrador. Para compartir
                      el link de reserva, primero debes cambiar el estado a
                      Publicado.
                    </Typography>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col bg-[#FAFAFA] rounded-[8px] mt-2 p-2">
                      <Typography variant="subtitle2">
                        Iframe de actividad en ESPAÑOL
                      </Typography>
                      <span
                        className="mt-2 text-sm underline text-[#F47920] cursor-pointer"
                        onClick={() => {
                          copyToClipboard(
                            `id="actividad-es-${activity.id}-FL"`,
                            "activity_es"
                          );
                        }}
                      >
                        {copiedCode === "activity_es"
                          ? "¡Copiado!"
                          : "COPIAR CÓDIGO DE INSERCIÓN"}
                        <ContentCopyIcon
                          fontSize="small"
                          sx={{ color: "#F47920", ml: 2 }}
                        />
                      </span>
                    </div>

                    <div className="flex flex-col bg-[#FAFAFA] rounded-[8px] mt-2 p-2">
                      <Typography variant="subtitle2">
                        Código de integración - INGLES
                      </Typography>
                      <span
                        className="mt-2 text-sm underline text-[#F47920] cursor-pointer"
                        onClick={() => {
                          copyToClipboard(
                            `id="actividad-en-${activity.id}-FL"`,
                            "activity_en"
                          );
                        }}
                      >
                        {copiedCode === "activity_en"
                          ? "¡Copiado!"
                          : "COPIAR CÓDIGO DE INSERCIÓN"}
                        <ContentCopyIcon
                          fontSize="small"
                          sx={{ color: "#F47920", ml: 2 }}
                        />
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Single shared menu for all activities */}
        <Menu
          id="activity-menu"
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          PaperProps={{
            elevation: 0,
            sx: {
              mt: 1.5,
              minWidth: 200,
              padding: 1,
              boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.08) !important",
              borderRadius: 2,
              "& .MuiMenuItem-root": {
                px: 2,
                py: 1.5,
              },
            },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Publicado
            </Typography>
            <Switch
              size="small"
              checked={selectedActivity?.estado === "publicado"}
              onChange={handleStatusToggle}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          <MenuItem onClick={handleEdit} sx={{ gap: 1 }}>
            <EditIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="body2">Editar actividad</Typography>
          </MenuItem>

          <MenuItem
            onClick={handleDeleteClick}
            sx={{ gap: 1, color: "error.main" }}
          >
            <DeleteIcon fontSize="small" />
            <Typography variant="body2">Eliminar actividad</Typography>
          </MenuItem>
        </Menu>

        {/* Modal de confirmación para eliminar */}
        <Dialog
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setActivityToDelete(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogContent sx={{ padding: "70px" }}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-6">
                <ReportProblemIcon sx={{ fontSize: 48, color: "#FF9800" }} />
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "500", textAlign: "center" }}
                >
                  ¿Eliminar actividad?
                </Typography>
                {activityToDelete && (
                  <Typography
                    variant="body1"
                    sx={{ textAlign: "center", color: "#666666" }}
                  >
                    "{activityToDelete.titulo}"
                  </Typography>
                )}
              </div>

              <div className="flex flex-row gap-3 items-center justify-center uppercase">
                <Button
                  variant="text"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setActivityToDelete(null);
                  }}
                  sx={{
                    color: "#000000",
                    textTransform: "uppercase",
                    fontSize: "16px",
                  }}
                >
                  Mejor no
                </Button>
                <Button
                  variant="contained"
                  onClick={handleDelete}
                  sx={{
                    backgroundColor: "#f47920",
                    "&:hover": {
                      backgroundColor: "#f47920",
                    },
                    textTransform: "uppercase",
                    fontSize: "16px",
                  }}
                >
                  Sí, eliminar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmación para cambiar a borrador */}
        <Dialog
          open={draftModalOpen}
          onClose={() => setDraftModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogContent sx={{ padding: "70px" }}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-6">
                <ReportProblemIcon sx={{ fontSize: 48, color: "#FF9800" }} />
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "500", textAlign: "center" }}
                >
                  ¿Cambiar a borrador?
                </Typography>
              </div>

              <div className="flex flex-col items-center gap-4">
                <Typography
                  variant="body1"
                  sx={{ textAlign: "center", color: "#666666" }}
                >
                  Al cambiar esta actividad a borrador, no será visible para los
                  clientes y no podrás compartir el link de reserva.
                </Typography>
              </div>

              <div className="flex flex-row gap-3 items-center justify-center uppercase">
                <Button
                  variant="text"
                  onClick={() => setDraftModalOpen(false)}
                  sx={{
                    color: "#000000",
                    textTransform: "uppercase",
                    fontSize: "16px",
                  }}
                >
                  Mejor no
                </Button>
                <Button
                  variant="contained"
                  onClick={handleDraftConfirm}
                  sx={{
                    backgroundColor: "#f47920",
                    "&:hover": {
                      backgroundColor: "#f47920",
                    },
                    textTransform: "uppercase",
                    fontSize: "16px",
                  }}
                >
                  Sí, cambiar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de integración */}
        <Dialog
          open={integrationModalOpen}
          onClose={() => setIntegrationModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ padding: "40px" }}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-4">
                <CodeIcon sx={{ fontSize: 48, color: "#F47920" }} />
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "500", textAlign: "center" }}
                >
                  Generador de Código de Integración
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ textAlign: "center", color: "#666666" }}
                >
                  Genera código personalizado para integrar Flora+ en tu sitio
                  web
                </Typography>
              </div>

              <div className="flex flex-row gap-4">
                <Tabs
                  value={selectedIntegrationType}
                  onChange={(_, newValue) =>
                    setSelectedIntegrationType(newValue)
                  }
                  sx={{ borderBottom: 1, borderColor: "divider" }}
                >
                  <Tab label="Botón" value="button" />
                  <Tab label="Enlace" value="link" />
                  <Tab label="Iframe" value="iframe" />
                  <Tab label="Popup" value="popup" />
                </Tabs>
              </div>

              <div className="flex flex-row gap-4">
                <Tabs
                  value={selectedLanguage}
                  onChange={(_, newValue) => setSelectedLanguage(newValue)}
                  sx={{ borderBottom: 1, borderColor: "divider" }}
                >
                  <Tab label="Español" value="es" />
                  <Tab label="English" value="en" />
                </Tabs>
              </div>

              <div className="flex flex-col gap-4">
                <Typography variant="h6">
                  Código para Actividad Individual
                </Typography>
                <TextField
                  multiline
                  rows={6}
                  value={
                    selectedActivity
                      ? generateIntegrationCode(
                          selectedActivity.id,
                          selectedIntegrationType,
                          selectedLanguage
                        )
                      : generateMenuCode(
                          selectedIntegrationType,
                          selectedLanguage
                        )
                  }
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    const code = selectedActivity
                      ? generateIntegrationCode(
                          selectedActivity.id,
                          selectedIntegrationType,
                          selectedLanguage
                        )
                      : generateMenuCode(
                          selectedIntegrationType,
                          selectedLanguage
                        );
                    copyToClipboard(code, "integration_code");
                  }}
                  sx={{
                    backgroundColor: "#F47920",
                    "&:hover": {
                      backgroundColor: "#F47920",
                    },
                  }}
                >
                  Copiar Código
                </Button>
              </div>

              <div className="flex flex-col gap-4">
                <Typography variant="h6">
                  Código para Menú de Actividades
                </Typography>
                <TextField
                  multiline
                  rows={6}
                  value={generateMenuCode(
                    selectedIntegrationType,
                    selectedLanguage
                  )}
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    const code = generateMenuCode(
                      selectedIntegrationType,
                      selectedLanguage
                    );
                    copyToClipboard(code, "menu_code");
                  }}
                  sx={{
                    backgroundColor: "#F47920",
                    "&:hover": {
                      backgroundColor: "#F47920",
                    },
                  }}
                >
                  Copiar Código
                </Button>
              </div>

              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Instrucciones:</strong> Copia el código y pégalo en tu
                  sitio web. Para actividades individuales, selecciona una
                  actividad de la lista arriba.
                </Typography>
              </Alert>

              <div className="flex flex-row gap-3 items-center justify-center">
                <Button
                  variant="text"
                  onClick={() => setIntegrationModalOpen(false)}
                  sx={{
                    color: "#000000",
                    textTransform: "uppercase",
                    fontSize: "16px",
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default function ActividadesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ActividadesContent />
    </Suspense>
  );
}
