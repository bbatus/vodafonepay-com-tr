"use client";

import { useState } from "react";
import { FaqChevronIcon } from "@/components/icons";
import type { FaqItem } from "@/types/homepage";

const faqs: FaqItem[] = [
  {
    question: "Vodafone Pay Nedir?",
    answer:
      "Vodafone Pay, Cüzdan, Faturana Yansıt ve Vodafone Pay Kart ile finansal işlemlerinizi kolayca ve güvenli şekilde gerçekleştirmenizi sağlayan bir finansal teknoloji şirketidir. Vodafone Pay'in sunduğu tüm avantajlara ve kolaylıklara Vodafone Pay Uygulaması'nı indirerek ulaşabilirsiniz.",
  },
  {
    question: "Vodafone Pay ile Nasıl Alışveriş Yapılır?",
    answer:
      "Vodafone Pay'in sunduğu ödeme yöntemleri ile hem fiziksel hem online alışverişlerinizi gerçekleştirebilirsiniz. Vodafone Pay Kartlarınıza banka/kredi kartı, EFT veya ATM ile bakiye yükleyip kartınızı hem fiziksel hem online alışverişlerde kullanabilirsiniz. Faturana Yansıt ile anlaşmalı markalardaki harcamalarınızı ve aboneliklerinizi faturanıza yansıtabilir, ödemelerinizi fatura tarihine kadar bekletebilirsiniz.",
  },
  {
    question: "Vodafone Pay Uygulaması Nasıl Kullanılır?",
    answer:
      "Vodafone Pay Uygulaması'nı herhangi bir banka müşterisi olmadan, hangi operatör müşterisi olduğunuz fark etmeden Google Play Store ya da App Store'dan indirerek kullanabilirsiniz. Uygulamayı indirip sizden istenilen bilgileri tamamlayarak kaydınızı tamamlayabilirsiniz. Vodafone Pay Uygulaması 12 yaş ve üzeri kullanıcılara açıktır.",
  },
  {
    question: "Vodafone Pay Nerelerde Kullanılır?",
    answer:
      "Vodafone Pay Kart, VISA ve TROY seçenekleriyle tüm POS cihazlarında fiziksel ve online harcamalarda kullanılabilir. Faturana Yansıt anlaşmalı markaların ödeme adımlarında, uygulama mağazası ve dijital üyelik satın alımlarında ve Vodafone Pay Uygulaması'ndaki \"QR ile Ödeme\" fonksiyonu aracılığıyla da fiziksel mağazalardaki alışverişlerde kullanılabilir.",
  },
];

export function Faq({ items = faqs, showHeading = true }: { items?: FaqItem[]; showHeading?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[#f9fafb] px-4 py-16 lg:px-16">
      {showHeading && <h2 className="text-center text-3xl font-bold text-black">Sıkça Sorulan Sorular</h2>}
      <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between rounded bg-white px-5 py-[22px] text-left shadow-[0px_2px_8px_0px_#00000029]"
              >
                <h3 className="font-bold text-black">{item.question}</h3>
                <FaqChevronIcon
                  className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="rounded bg-gray-50 px-5 py-4">
                  <p className="text-sm text-gray-700">{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
