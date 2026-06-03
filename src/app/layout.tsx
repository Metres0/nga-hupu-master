import type { Metadata } from "next";
import "./globals.css";
import "@/plugins/car-club";
import "@/plugins/music-film";
import "@/plugins/spring-wind-village";
import ClientLayout from "./ClientLayout";
import EnhancedStarryBg from "@/components/effects/EnhancedStarryBg";

export const metadata: Metadata = {
  title: "NGA 镜像站",
  description: "NGA 论坛镜像阅读器，基于 FluxDO 架构理念改造",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0a1428",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash: set data-theme before any CSS/JS loads. Defaults to system preference. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('nga-theme');if(t==='system'||!t)t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}}())` }} />
        <link rel="preconnect" href="https://img.nga.178.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img4.nga.178.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img.nga.cn" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://bbs.nga.cn" />
      </head>
      <body className="min-h-screen antialiased">
        <EnhancedStarryBg />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
