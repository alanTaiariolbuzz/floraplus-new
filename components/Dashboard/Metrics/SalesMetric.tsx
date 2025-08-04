// components/Dashboard/Metrics/SalesMetric.tsx
import { SalesCard } from "./MetricCard";

interface SalesMetricProps {
  metric: {
    title: string;
  };
}

export const SalesMetric = ({ metric }: SalesMetricProps) => (
  <SalesCard title={metric.title} value={0} />
);
