declare module "react-date-range" {
  import * as React from "react";

  export interface Range {
    startDate: Date;
    endDate: Date;
    key: string;
  }

  export interface DateRangeProps {
    ranges: Range[];
    onChange: (item: { selection: Range }) => void;
    moveRangeOnFirstSelection?: boolean;
    months?: number;
    direction?: "vertical" | "horizontal";
    locale?: any;
    editableDateInputs?: boolean;
  }

  export class DateRange extends React.Component<DateRangeProps> {}
}
