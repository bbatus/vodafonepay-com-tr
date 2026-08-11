"use client";

import { useState } from "react";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Faq } from "@/components/Faq";
import type { FaqItem } from "@/types/homepage";

const categories = [
  "Tümü",
  "Anasayfa",
  "Anında Bakiye",
  "Vodafone Pay Uygulama",
  "Kampanyalar",
  "Vodafone Pay Kart",
  "QR ile Faturana Yansıt",
] as const;

type Category = (typeof categories)[number];

/** Maps the CMS's FaqItems.category select values (see cms/src/collections/FaqItems.ts) to this page's display labels. */
const CMS_CATEGORY_TO_LABEL: Record<string, Exclude<Category, "Tümü">> = {
  anasayfa: "Anasayfa",
  "aninda-bakiye": "Anında Bakiye",
  "vodafone-pay-uygulama": "Vodafone Pay Uygulama",
  kampanyalar: "Kampanyalar",
  "vodafone-pay-kart": "Vodafone Pay Kart",
  "qr-ile-faturana-yansit": "QR ile Faturana Yansıt",
};

const fallbackFaqsByCategory: Record<Exclude<Category, "Tümü">, FaqItem[]> = {
  Anasayfa: [
    {
      question: "Vodafone Pay Nedir?",
      answer:
        "Vodafone Pay, Cüzdan, Faturana Yansıt ve Vodafone Pay Kart ile finansal işlemlerinizi kolayca ve güvenli şekilde gerçekleştirmenizi sağlayan bir finansal teknoloji şirketidir.",
    },
    {
      question: "Vodafone Pay ile Nasıl Alışveriş Yapılır?",
      answer:
        "Vodafone Pay'in sunduğu ödeme yöntemleri ile hem fiziksel hem online alışverişlerinizi gerçekleştirebilirsiniz. Kartlarınıza banka/kredi kartı, EFT veya ATM ile bakiye yükleyip harcamalarınızdan nakit iade kazanabilirsiniz.",
    },
    {
      question: "Mobil Ödeme nedir?",
      answer:
        "Vodafone Mobil Ödeme alışverişlerinizi hızlı ve güvenli bir şekilde gerçekleştirmenizi sağlayan tahsilat aracıdır. Faturalı veya faturasız fark etmeksizin, kredi kartı veya banka kartına ihtiyaç duymadan alışverişlerinizi gerçekleştirebilirsiniz.",
    },
    {
      question: "Vodafone Pay Nerelerde Kullanılır?",
      answer:
        "Vodafone Pay Kart, VISA ve TROY seçenekleriyle tüm POS cihazlarında fiziksel ve online harcamalarda kullanılabilir. Faturana Yansıt ise uygulama mağazaları ve anlaşmalı markalarda geçerlidir.",
    },
  ],
  "Anında Bakiye": [
    {
      question: "Anında Bakiye nedir? Kimler kullanabilir?",
      answer:
        "Anında Bakiye, Vodafone Pay tarafından sana özel olarak tanımlanan Faturana Yansıt limitini Vodafone Pay Sanal Kart'ına aktarabileceğin bir hizmettir.",
    },
    {
      question: "Anında Bakiye ile yapılan işlemler ücretli mi?",
      answer: "Anında Bakiye yüklemelerinde komisyon uygulanır. Faturana Yansıt hizmet bedeline web sitemizden ulaşabilirsin.",
    },
    {
      question: "Anında Bakiye'mi nerelerde kullanabilirim?",
      answer: "Sana özel tanımlanan Anında Bakiye'ni yurtiçi ve yurtdışında Visa kart geçerli olan tüm kurum ve platformlarda kullanabilirsin.",
    },
    {
      question: "Anında Bakiye alırken Faturana Yansıt yöntemini açmam gerekli midir?",
      answer: "Evet, bu işlemin yapılabilmesi için Faturana Yansıt yöntemi açık olmalıdır.",
    },
  ],
  "Vodafone Pay Uygulama": [
    {
      question: "Vodafone Pay Uygulaması Nedir?",
      answer:
        "Vodafone Pay Uygulaması, herhangi bir banka müşterisi olmadan ve hangi operatörü kullandığınız fark etmeden finansal işlemlerinizi tek bir uygulama içerisinden yönetmenizi sağlayan yeni nesil bir mobil cüzdan uygulamasıdır.",
    },
    {
      question: "Vodafone Pay Uygulaması Nasıl Kullanılır?",
      answer:
        "Google Play Store ya da App Store üzerinden indirip, 12 yaşından büyük bir kullanıcı olarak TCKN, ad, soyad, doğum tarihi ve iletişim bilgilerinizi girerek kaydolabilirsiniz.",
    },
    {
      question: "Vodafone Pay Uygulamasıyla Sanal Kart Nasıl Üretilir?",
      answer:
        "Uygulamaya kaydolduktan sonra otomatik olarak bir Vodafone Pay Sanal Kart oluşturulur. Yeniden oluşturmak için \"Varlıklarım\" altındaki \"Vodafone Pay Kart Ekle\" alanını kullanabilirsiniz.",
    },
  ],
  Kampanyalar: [
    {
      question: "Vodafone Pay kampanyalarına nasıl katılabilirim?",
      answer:
        "Vodafone Pay Uygulaması üzerinden kampanyaları inceleyerek katılmak istedikleriniz için \"Kampanyaya Katıl\" butonuna tıklayabilir veya kampanya esaslarında yer alan yönlendirmeleri uygulayarak kampanyalara katılabilirsiniz.",
    },
  ],
  "Vodafone Pay Kart": [
    {
      question: "Vodafone Pay Kart Nedir?",
      answer: "Vodafone Pay Kart herhangi bir banka müşterisi olmadan ve hangi operatör müşterisi olduğunuz fark etmeksizin kullanabileceğiniz ön ödemeli bir karttır.",
    },
    {
      question: "Vodafone Pay Kart Nasıl Alınır?",
      answer:
        "Fiziksel ve sanal kart olmak üzere 2 tür Vodafone Pay Kart bulunur. Fiziksel kart için Vodafone Mağazalarını ziyaret edebilir, Sanal Kart için Vodafone Pay Uygulaması'nı indirebilirsiniz.",
    },
    {
      question: "Vodafone Pay Kart Limiti Ne Kadar?",
      answer: "Hesabı doğrulanmış müşterilerin aylık limitleri 75.000 TL; hesabı doğrulanmamış müşterilerin limitleri 2.000 TL'dir.",
    },
  ],
  "QR ile Faturana Yansıt": [
    {
      question: "QR ile Faturana Yansıt nedir?",
      answer:
        "Vodafone Pay Uygulaması'nda TR Kare kod (QR) ile ödemede Faturana Yansıt'ı hem faturalı hem faturasız Vodafone mobil müşterileri kullanabilir.",
    },
    {
      question: "QR ile Faturana Yansıt nasıl kullanılır?",
      answer:
        "Vodafone Pay Uygulaması ana sayfasında yer alan QR ikonuna tıkladıktan sonra \"QR ile Ödeme\" seçeneğini seçip POS cihazında yer alan TR Kare Kod'u (QR) okutmalısınız.",
    },
  ],
};

function groupByCategory(items: (FaqItem & { category: string })[]): Record<Exclude<Category, "Tümü">, FaqItem[]> {
  const grouped: Record<string, FaqItem[]> = {};
  for (const { question, answer, category } of items) {
    const label = CMS_CATEGORY_TO_LABEL[category];
    if (!label) continue;
    grouped[label] ??= [];
    grouped[label].push({ question, answer });
  }
  return grouped as Record<Exclude<Category, "Tümü">, FaqItem[]>;
}

export function FaqCategoryFilter({ items }: { items?: (FaqItem & { category: string })[] }) {
  const [active, setActive] = useState<Category>("Tümü");

  const faqsByCategory = items?.length ? groupByCategory(items) : fallbackFaqsByCategory;
  const visibleCategories = (active === "Tümü" ? categories.slice(1) : [active]) as Exclude<Category, "Tümü">[];

  return (
    <>
      <StickyQr />
      <Breadcrumb current="Sıkça Sorulan Sorular" />

      <section className="mx-auto w-full max-w-[1030px] px-4 pb-10 pt-6">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Sıkça Sorulan Sorular</h1>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                active === c ? "border-vf-navy bg-vf-navy text-white" : "border-gray-300 bg-white text-black hover:bg-gray-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <Faq items={visibleCategories.flatMap((c) => faqsByCategory[c] ?? [])} showHeading={false} />
    </>
  );
}
