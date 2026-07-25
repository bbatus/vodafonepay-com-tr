import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vodafoneRegular = localFont({
  src: "../../public/fonts/vodafone-regular.woff",
  variable: "--font-vodafone-regular",
  weight: "400",
  display: "swap",
});

const vodafoneLight = localFont({
  src: "../../public/fonts/vodafone-light.woff",
  variable: "--font-vodafone-light",
  weight: "300",
  display: "swap",
});

const vodafoneBold = localFont({
  src: "../../public/fonts/vodafone-bold.woff",
  variable: "--font-vodafone-bold",
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vodafone Pay | Yeni Nesil Mobil Cüzdan",
  description:
    "Vodafone Pay ile cüzdanınıza bakış açınız kökten değişiyor, hazır mısınız? Vodafone Pay hakkında detaylı bilgi almak için tıklayın.",
  icons: {
    icon: "/seo/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${vodafoneRegular.variable} ${vodafoneLight.variable} ${vodafoneBold.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
