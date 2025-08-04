"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ReactNode } from "react";

const theme = createTheme({
  palette: {
    primary: {
      main: "#F47920",
      dark: "#E65100",
      light: "#F47920",
      contrastText: "#ffffff",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          "&.MuiButton-containedPrimary": {
            backgroundColor: "#F47920 !important",
            "&:hover": {
              backgroundColor: "#E65100 !important",
            },
          },
        },
      },
    },
    MuiTypography: {
      variants: [
        {
          props: { variant: "h4" },
          style: {
            margin: 0, // Elimina el margen para h4
          },
        },
      ],
    },
  },
});

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
