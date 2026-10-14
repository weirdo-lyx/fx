import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "木芽英语 · 老师后台",
  description: "抗遗忘单词复习系统 - 老师后台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}
