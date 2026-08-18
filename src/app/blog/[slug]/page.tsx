import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getBlogPostBySlug, getBlogPosts, richTextToPlainText } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";
import { RichText } from "@/components/RichText";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return (posts ?? []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.seoTitle || `${post.title} | Vodafone Pay`,
    description: post.seoDescription || richTextToPlainText(post.body, 155),
    path: `/blog/${post.slug}`,
    image: post.coverImage.url,
  });
}

export default async function BlogYazisi({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={post.title} />

      <section className="mx-auto w-full max-w-[840px] px-4 pb-20">
        <Image
          src={post.coverImage.url}
          alt={post.coverImage.alt || post.title}
          width={840}
          height={420}
          className="h-auto w-full rounded-md object-cover"
        />
        <h1 className="mt-6 text-[32px] font-light leading-[40px] text-black">{post.title}</h1>
        {post.publishedDate && (
          <p className="mt-2 text-sm text-gray-500">{new Date(post.publishedDate).toLocaleDateString("tr-TR")}</p>
        )}
        <div className="mt-8">
          <RichText data={post.body} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
