import { Typography } from "@mui/material";

interface MetricCardProps {
  icon: string;
  iconAlt: string;
  value: string | number;
  label: string;
  loading?: boolean;
  error?: boolean;
}

export default function MetricCard({
  icon,
  iconAlt,
  value,
  label,
  loading = false,
  error = false,
}: MetricCardProps) {
  const displayValue = loading ? "..." : error ? "Error" : value;

  return (
    <div className="w-1/4 border border-[#E0E0E0] bg-white rounded-[8px] h-[75px]">
      <div className="flex flex-row gap-2 items-center h-full pl-4">
        <img src={icon} width={38} alt={iconAlt} />
        <div className="flex flex-col">
          <Typography variant="h6" color="text.primary">
            {displayValue}
          </Typography>
          <Typography variant="caption" color="text.primary">
            {label}
          </Typography>
        </div>
      </div>
    </div>
  );
}
