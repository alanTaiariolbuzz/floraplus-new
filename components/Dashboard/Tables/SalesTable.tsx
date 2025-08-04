// components/Dashboard/Tables/SalesTable.tsx
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Typography,
} from "@mui/material";
import { Schedule } from "@mui/icons-material";
import { Sale, Cancellation } from "../types";

interface SalesTableProps {
  data: Sale[];
  mode?: "sales" | "cancellations";
}

export const SalesTable = ({ data, mode = "sales" }: SalesTableProps) => {


  const formatAmount = (amount: number) => {
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const isCancellation = mode === "cancellations";
  // Type guard
  function isCancellationRow(row: Sale | Cancellation): row is Cancellation {
    return (row as Cancellation).reason !== undefined;
  }

  return (
    <Box
      sx={{
        overflowX: "auto",
        borderBottomLeftRadius: "8px",
        borderBottomRightRadius: "8px",
        maxHeight: "215px",
        overflowY: "auto",
      }}
    >
      <Table
        size="small"
        sx={{
          "& .MuiTableHead-root": {
            backgroundColor: "#fafafa",
          },
          "& .MuiTableCell-head": {
            backgroundColor: "#fafafa",
            fontWeight: "bold",
          },
          "& .MuiTableBody-root .MuiTableRow-root": {
            backgroundColor: "white",
            height: "40px",
          },
          "& .MuiTableBody-root .MuiTableRow-root:hover": {
            backgroundColor: "#f5f5f5",
          },
          borderTop: "solid 1px #DCDCDC",
          overflow: "hidden",
        }}
      >
        <TableHead sx={{ height: 56 }}>
          <TableRow>
            <TableCell>Cliente</TableCell>
            <TableCell>Monto</TableCell>
            <TableCell>Tour</TableCell>
            <TableCell>Fecha</TableCell>
            {isCancellation && <TableCell>Motivo</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isCancellation ? 5 : 4}>
                <div className="bg-[#fafafa] rounded-[8px] w-[calc(100%-16px)] flex flex-col items-center justify-center gap-2 py-8">
                  <Schedule sx={{ fontSize: 25, color: "text.disabled" }} />
                  <Typography variant="body2" color="text.secondary">
                    {isCancellation
                      ? "No tienes cancelaciones hoy"
                      : "No tienes ventas hoy"}
                  </Typography>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell
                  sx={{
                    maxWidth: 120,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    height: "36px",
                    padding: "8px 16px",
                  }}
                  title={row.client}
                >
                  {row.client}
                </TableCell>
                <TableCell
                  sx={{
                    height: "36px",
                    padding: "8px 16px",
                  }}
                >
                  {formatAmount(row.amount)}
                </TableCell>
                <TableCell
                  sx={{
                    maxWidth: 120,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    height: "36px",
                    padding: "8px 16px",
                  }}
                  title={row.tour}
                >
                  {row.tour}
                </TableCell>
                <TableCell
                  sx={{
                    height: "36px",
                    padding: "8px 16px",
                  }}
                >
                  {row.date}
                </TableCell>
                {isCancellation && (
                  <TableCell sx={{ height: "36px", padding: "8px 16px" }}>
                    {isCancellationRow(row) ? row.reason || "-" : "-"}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
};
