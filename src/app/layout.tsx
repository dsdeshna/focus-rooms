import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Focus Rooms",
  description:
    "Create beautiful, ambient focus rooms where your team can study, work, and collaborate together with shared whiteboards, ambient sounds, and real-time communication.",
  keywords: ["focus room", "study room", "collaboration", "whiteboard", "ambient sounds", "productivity", "chill", "friends"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
