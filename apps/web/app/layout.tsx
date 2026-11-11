import type { Metadata, Viewport } from "next";
import { Fira_Sans, Fira_Sans_Condensed } from "next/font/google";
import "./globals.css";

// Fira Sans: humanista de herencia en señalética (FF Meta / Spiekermann); legible al sol y en pantallas pequeñas.
const firaSans = Fira_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Condensada para rótulos de estación y etiquetas del diagrama.
const firaCondensed = Fira_Sans_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "bus-tracking · buses troncales de Bogotá en vivo",
  description:
    "Posición en tiempo real de los buses troncales y duales de Bogotá, con sus rutas y estaciones. Proyecto independiente con datos abiertos GTFS Realtime de TRANSMILENIO S.A.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#13203a" },
    { media: "(prefers-color-scheme: dark)", color: "#13203a" },
  ],
};

// shadcn usa la clase `.dark`; se sincroniza con la preferencia del sistema antes del primer pintado.
const themeScript = `(()=>{const m=matchMedia("(prefers-color-scheme: dark)");const s=()=>document.documentElement.classList.toggle("dark",m.matches);s();m.addEventListener("change",s)})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${firaSans.variable} ${firaCondensed.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground min-h-full font-sans">{children}</body>
    </html>
  );
}
