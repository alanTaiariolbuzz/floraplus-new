// components/ui/AccountMenu.tsx
"use client";

import { useState } from "react";
import {
  Box,
  Tooltip,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from "@mui/material";
import { Logout } from "@mui/icons-material";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/context/UserContext";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SettingsIcon from "@mui/icons-material/Settings";
import { useRouter } from "next/navigation";

export default function AccountMenu({ user }: { user: any }) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const supabase = createClient();
  const { customUser } = useUser();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <div
        onClick={handleClick}
        style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
      >
        <Tooltip title="Menú de usuario">
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "primary.main",
              cursor: "pointer",
            }}
          >
            {customUser?.nombre?.[0]?.toUpperCase() || "U"}
          </Avatar>
        </Tooltip>
        <div className="flex flex-row items-center ml-3">
          <Typography variant="body1" sx={{ color: "#202020" }}>
            {customUser?.nombre} {customUser?.apellido}
          </Typography>
          <KeyboardArrowDownIcon style={{ marginLeft: 4 }} />
        </div>
      </div>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 250,
            padding: 1,
            mt: 1.5,
            "& .MuiMenuItem-root": {
              px: 2,
              py: 1.5,
            },
          },
        }}
      >
        <MenuItem disableRipple sx={{ cursor: "default" }}>
          <Box sx={{ width: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {customUser?.nombre} {customUser?.apellido}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || "usuario@ejemplo.com"}
            </Typography>
          </Box>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: "error" }}>
            Cerrar Sesión
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {handleClose; router.push("/configuracion")}}>
          <ListItemIcon>
            <SettingsIcon fontSize="small"/>
          </ListItemIcon>
          <ListItemText>
            Configuración de cuenta
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
