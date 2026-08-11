import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import type { CardListItem } from "@/components/CardListGrid";
import { Footer } from "@/components/Footer";
import { getBlogPosts } from "@/lib/cms";
import { BlogFilterableList } from "./BlogFilterableList";

export const metadata: Metadata = {
  title: "Bloglar | Vodafone Pay",
  description: "Vodafone Pay'den mobil ödeme, kart ve dijital cüzdan hakkında güncel blog yazıları.",
};

const fallbackPosts: CardListItem[] = [
  { image: "/images/blog-01.jpg", title: "Ulaşım Kartı Bakiye Yükleme Yolları | Vodafone Pay" },
  { image: "/images/blog-02.jpg", title: "Ön Ödemeli Kart Nedir?" },
  { image: "/images/blog-03.jpg", title: "Kart Limiti Artırma Nasıl Yapılır? | Vodafone Pay" },
  { image: "/images/blog-04.jpg", title: "Online Alışverişlerimi Faturama Nasıl Yansıtabilirim?" },
  { image: "/images/blog-05.jpg", title: "Dijital Mobil Cüzdan Nedir, Nasıl Kullanılır? | Vodafone Pay" },
  { image: "/images/blog-06.jpg", title: "Vodafone Pay Kart Nedir? | Vodafone Pay" },
  { image: "/images/blog-07.jpg", title: "Vodafone Pay Mobil Ödeme Nasıl Kullanılır?" },
  { image: "/images/blog-08.jpg", title: "İstanbulkart Bakiye Yükleme Nasıl Yapılır? | Vodafone Pay" },
  { image: "/images/blog-09.jpg", title: "Mobil Ödeme ile Alışveriş Nasıl Yapılır? | Vodafone Pay" },
  { image: "/images/blog-10.jpg", title: "7878 Mesajı Nedir? | Vodafone Pay" },
  { image: "/images/blog-11.jpg", title: "Cashback (Nakit İade) Nedir? | Vodafone Pay" },
  { image: "/images/blog-12.jpg", title: "Sanal Kredi Kartı Nedir? | Vodafone Pay" },
];

export default async function Blog() {
  const cmsPosts = await getBlogPosts();
  const posts: CardListItem[] = cmsPosts?.length
    ? cmsPosts.map((p) => ({
        image: p.coverImage.url,
        title: p.title,
        description: p.excerpt,
        href: `/blog/${p.slug}`,
        category: p.category,
      }))
    : fallbackPosts;

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />

      <section className="mx-auto w-full max-w-[1280px] px-4 pb-20">
        <div className="flex flex-col items-center justify-center lg:pt-8">
          <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Blog</h1>
        </div>

        <BlogFilterableList posts={posts} />
      </section>

      <Footer />
    </main>
  );
}
