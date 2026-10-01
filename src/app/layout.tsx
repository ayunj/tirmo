import type { Metadata, Viewport } from "next";
import "flag-icons/css/flag-icons.min.css";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./mock.css";
import "./app.css";
import "./refine.css";
import Overlay from "@/components/ui/Overlay";

export const metadata: Metadata = {
  title: "트리모",
  description: "같이 쓰는 여행 메모",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "트리모", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="ph" id="ph">
          {children}
          <Overlay />
        </div>
      </body>
    </html>
  );
}
