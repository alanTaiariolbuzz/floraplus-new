// components/Dashboard/types.ts

export interface Reservation {
  client: string;
  code: string;
  tour: string;
  time: string;
  date: string;
}

export interface Sale {
  client: string;
  amount: number;
  tour: string;
  date: string;
}

export interface Cancellation extends Sale {
  reason?: string;
}

export interface Schedule {
  time: string;
  tour: string;
  availability: string;
  progress: number;
  date: string;
}

export interface Metric {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

export interface PaymentInfo {
  nextPaymentDate: string;
  pendingAmount: string;
}
