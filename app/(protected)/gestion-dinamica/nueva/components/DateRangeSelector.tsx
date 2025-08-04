"use client";

import { FC, useState, useEffect } from "react";
import { Typography } from "@mui/material";
import { DateRange, Range } from "react-date-range";
import { es } from "date-fns/locale";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRangeState } from "./types";

interface DateRangeSelectorProps {
  value: DateRangeState;
  onChange: (newValue: DateRangeState) => void;
}

export const DateRangeSelector: FC<DateRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oneWeekLater = new Date(today);
  oneWeekLater.setDate(today.getDate() + 7);

  const [selection, setSelection] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: value.startDate || today,
    endDate: value.endDate || oneWeekLater,
  });

  useEffect(() => {
    if (value.startDate && value.endDate) {
      setSelection({
        startDate: value.startDate,
        endDate: value.endDate,
      });
    }
  }, [value]);

  // i need to change the next and previous button to a custom one
  //

  return (
    <div className="flex flex-col gap-2">
      <div className="border border-[#E0E0E0] rounded-[8px] p-4">
        <Typography variant="h6">
          ¿Durante qué días aplican las modificaciones?
        </Typography>
        <DateRange
          {...({
            onChange: (item: { selection: Range }) => {
              const newSelection = {
                startDate: item.selection.startDate || null,
                endDate: item.selection.endDate || null,
              };
              setSelection(newSelection);
              onChange(newSelection);
            },
            months: 2,
            ranges: [
              {
                startDate: selection.startDate ?? new Date(),
                endDate: selection.endDate ?? new Date(),
                key: "selection",
              },
            ],
            direction: "horizontal",
            locale: es,
            minDate: today,
            disabledDay: (date: Date) => date < today,
          } as any)}
        />
      </div>
    </div>
  );
};
