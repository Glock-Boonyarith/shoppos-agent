import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "nara. Store Manager",
  description: "ระบบขายหน้าร้านและจัดการคลังสินค้า",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
