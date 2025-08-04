import { Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import CachedIcon from "@mui/icons-material/Cached";
import { formatTimeAgo } from "../../utils/timeUtils";

interface RefreshHeaderProps {
  lastUpdate: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

export const RefreshHeader = ({
  lastUpdate,
  onRefresh,
  loading,
}: RefreshHeaderProps) => {
  const [timeAgo, setTimeAgo] = useState<string>("");

  // Actualizar el tiempo transcurrido cada minuto
  useEffect(() => {
    const updateTimeAgo = () => {
      setTimeAgo(formatTimeAgo(lastUpdate));
    };

    updateTimeAgo(); // Actualizar inmediatamente
    const interval = setInterval(updateTimeAgo, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className="flex items-center gap-2">
      <Typography variant="caption" color="text.secondary">
        Última actualización: {timeAgo}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={onRefresh}
        disabled={loading}
        sx={{
          minWidth: "auto",
          px: 1,
          py: 0.5,
          fontSize: "0.75rem",
        }}
      >
        <CachedIcon fontSize="small" />
      </Button>
    </div>
  );
};
