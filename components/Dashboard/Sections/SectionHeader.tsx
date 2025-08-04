// components/Dashboard/Sections/SectionHeader.tsx
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

export const SectionHeader = ({ icon, title }: SectionHeaderProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mb: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
        color: theme.palette.primary.main,
      }}
    >
      {icon}
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
};
