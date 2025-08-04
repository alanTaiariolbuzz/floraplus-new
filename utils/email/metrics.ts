// import { Counter, Histogram, Registry } from 'prom-client';

// export const emailSendSuccessTotal = new Counter({
//   name: 'email_send_success_total',
//   help: 'Total number of successful email sends',
// });
// export const emailSendFailureTotal = new Counter({
//   name: 'email_send_failure_total',
//   help: 'Total number of failed email sends',
// });
// export const emailLatencyMs = new Histogram({
//   name: 'email_latency_ms',
//   help: 'Email send latency in milliseconds',
//   buckets: [50, 100, 200, 500, 1000, 2000, 5000],
// });
// export const metricsRegistry = new Registry();
// metricsRegistry.registerMetric(emailSendSuccessTotal);
// metricsRegistry.registerMetric(emailSendFailureTotal);
// metricsRegistry.registerMetric(emailLatencyMs);
