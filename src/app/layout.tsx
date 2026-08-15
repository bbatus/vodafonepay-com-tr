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

// Fallback for the ~15% of taps Universal Links miss (app not installed yet,
// user long-pressed instead of tapping, in-app browsers that ignore
// associated domains). Only renders once a real Apple App Store id is
// configured — see src/app/.well-known/apple-app-site-association/route.ts
// for the actual Safari→app handoff fix.
const appleAppId = process.env.NEXT_PUBLIC_APPLE_APP_STORE_ID;

export const metadata: Metadata = {
  title: "Vodafone Pay | Yeni Nesil Mobil Cüzdan",
  description:
    "Vodafone Pay ile cüzdanınıza bakış açınız kökten değişiyor, hazır mısınız? Vodafone Pay hakkında detaylı bilgi almak için tıklayın.",
  icons: {
    icon: "/seo/favicon.ico",
  },
  ...(appleAppId
    ? { other: { "apple-itunes-app": `app-id=${appleAppId}` } }
    : {}),
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
      <head>
        {/* RFP feedback: hide this site's own scrollbar only when it's
            embedded in the CMS's publish-preview iframe (see globals.css) —
            runs synchronously, before paint, so there's no scrollbar flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(window.self!==window.top){document.documentElement.setAttribute('data-embedded-preview','')}}catch(e){document.documentElement.setAttribute('data-embedded-preview','')}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
