import { Card, CardContent, Typography } from "@mui/material";

interface CancelCardProps {
  title: string;
  value: number;
  isMoney?: boolean;
}

export const CancelCard = ({
  title,
  value,
  isMoney = false,
}: CancelCardProps) => {
  const formatValue = (val: number) => {
    if (isMoney) {
      return `$${val.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return val.toString();
  };

  return (
    <Card
      sx={{
        border: "1px solid #E0E0E0",
        borderRadius: 2,
        boxSizing: "border-box",
        boxShadow: "none",
        maxHeight: 65,
        p: 0,
      }}
    >
      <CardContent sx={{ pl: "16px", pt: "7px" }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            pb: 0,
          }}
        >
          {formatValue(value)}
        </Typography>
        <p className="text-xs font-normal">{title}</p>
      </CardContent>
    </Card>
  );
};
