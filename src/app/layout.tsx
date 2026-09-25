import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giuseppe | Control de pedidos",
  description: "Panel de control de pedidos y pagos para Giuseppe",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
