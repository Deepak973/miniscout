"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#1C1B1B",
          color: "#FAD691",
          border: "1px solid #FAD691",
          borderRadius: "12px",
          padding: "16px",
          fontSize: "14px",
          fontFamily: "Arimo, sans-serif",
          boxShadow: "0 8px 32px rgba(250, 214, 145, 0.2)",
          backdropFilter: "blur(8px)",
        },
        success: {
          duration: 3000,
          style: {
            background: "#1C1B1B",
            color: "#FAD691",
            border: "1px solid #FAD691",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "14px",
            fontFamily: "Arimo, sans-serif",
            boxShadow: "0 8px 32px rgba(250, 214, 145, 0.2)",
            backdropFilter: "blur(8px)",
          },
          iconTheme: {
            primary: "#FAD691",
            secondary: "#1C1B1B",
          },
        },
        error: {
          duration: 5000,
          style: {
            background: "#1C1B1B",
            color: "#ED775A",
            border: "1px solid #ED775A",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "14px",
            fontFamily: "Arimo, sans-serif",
            boxShadow: "0 8px 32px rgba(237, 119, 90, 0.2)",
            backdropFilter: "blur(8px)",
          },
          iconTheme: {
            primary: "#ED775A",
            secondary: "#1C1B1B",
          },
        },
      }}
    />
  );
}
