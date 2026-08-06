import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Emergency Contacts",
  description:
    "Your personal directory for emergency contacts — police, fire, medical, family and more. Works offline.",
  applicationName: "Emergency Contacts",
  manifest: "/manifest.webmanifest",
  icons: {
    // Both resolve at request time: /app-logo serves the admin logo when set,
    // otherwise falls back to the default icon.
    icon: "/app-logo",
    apple: "/app-logo",
  },
  appleWebApp: {
    capable: true,
    title: "Emergency Contacts",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col text-slate-900 dark:text-slate-100">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
