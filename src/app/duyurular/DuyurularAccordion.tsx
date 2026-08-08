"use client";

import { useState } from "react";
import { FaqChevronIcon } from "@/components/icons";

export interface Announcement {
  title: string;
  body: React.ReactNode;
}

const fallbackAnnouncements: Announcement[] = [
  {
    title: "18.08.2026 02:00-08:00 Vodafone Pay Planlı Altyapı Çalışması",
    body: (
      <>
        <p>Değerli Müşterimiz,</p>
        <p className="mt-3">
          Hizmetlerimizi daha güvenli ve kesintisiz sunabilmek amacıyla planlı altyapı çalışması gerçekleştireceğiz.
        </p>
        <p className="mt-3">
          Tarih: 18.08.2026
          <br />
          Saat: 02.00–08.00
        </p>
        <p className="mt-3">
          Çalışma süresince Vodafone Pay uygulaması ile kart ve cüzdan servislerimiz geçici olarak kullanıma kapalı
          olacaktır. Bu süre içerisinde kart ve cüzdan ödeme/ bakiye yükleme, Anında Bakiye yükleme/harcama,
          Faturana Yansıt QR ile Ödeme, TR Karekod ile Para Çekme/Ödeme, EFT, ATM ve kart yönetimi işlemleri
          gerçekleştirilemeyecektir.
        </p>
        <p className="mt-3">Online alışverişlerinizde faturana yansıt hizmetimiz kesintisiz devam edecektir.</p>
        <p className="mt-3">Bakiyeniz ve hesap bilgileriniz bu çalışmadan etkilenmeyecektir.</p>
        <p className="mt-3">Çalışmanın tamamlanmasının ardından tüm hizmetlerimizi yeniden kullanabilirsiniz.</p>
        <p className="mt-3">Anlayışınız için teşekkür ederiz.</p>
      </>
    ),
  },
  {
    title: "Vodafone Elektronik Para ve Ödeme Hizmetleri AŞ Hizmet Yönetim Sistemi Politikası",
    body: (
      <>
        <p>
          &quot;Vodafone Elektronik Para ve Ödeme Hizmetleri A.Ş.&apos;nin Hizmet Yönetim Sistemi Politikası vermiş
          olduğu; Faturama Yansıt, e-fatura ve e-arşiv hizmetlerini; güvenilirlik, nitelikli hizmet, süreklilik
          ilkeleri çerçevesinde, iç ve dış müşterilerinin beklentilerini karşılayacak şekilde sunmaktır. Vodafone
          Elektronik Para ve Ödeme Hizmetleri A.Ş. üst yönetimi kapsam dahilindeki servis hizmetlerini sürekli
          geliştirmek için gerekli desteği ve ihtiyaç duyulan kaynağı sağlamayı taahhüt eder.&quot;
        </p>
        <p className="mt-3">
          Vodafone Elektronik Para ve Ödeme Hizmetleri A.Ş&apos;de Hizmet Yönetimi Sistemi kapsamındaki tüm süreçler,
          bu politika doğrultusunda, aşağıdaki kurallara uymak suretiyle yönetilmektedir;
        </p>
        <ul className="mt-3 flex list-disc flex-col gap-y-2 pl-5">
          <li>
            Değişen teknolojik gelişmeleri öncül olarak takip ederek farklılaşan müşteri beklentilerini karşılamak,
            mükemmel müşteri memnuniyetini sağlamak,
          </li>
          <li>Üst yönetim tarafından desteklenen Hizmet Servis Yönetimini sağlamak,</li>
          <li>Hizmet Servis Yönetimi prensiplerini kurum kültürümüzün vazgeçilmez bir parçası olarak uygulamak,</li>
          <li>
            Tüm Vodafone Elektronik Para ve Ödeme Hizmetleri A.Ş çalışanlarının ve iş ortaklarının yönetim
            sistemlerine katılımını ve uyumunu sağlamak için bilinçlendirmeye ve teşvik etmek,
          </li>
          <li>
            Hizmet Yönetim sistemimizin işletilmesi ve devamlılığı için bir Hizmet Yönetim Sistemi Komitesi kurmak,
            koordine etmek, ilgili rol ve sorumlulukların yerine getirilmesini sağlamak,
          </li>
          <li>
            Hizmet Yönetimi Sisteminin yürütülmesi için kullanılan süreç ve faaliyetlerin sürekli iyileştirilmesi
            amacıyla düzenli gözden geçirmeler gerçekleştirmek,
          </li>
          <li>
            Hizmet Yönetimi&apos;ne ilişkin riskleri azaltmak ve hizmetlerimizin kalitesini sağlamak için gerekli
            çalışanlarımızın yetkinliğini artıracak eğitim, donanım, yazılım ve diğer kontrollere gerekli kaynakları
            ayırmak,
          </li>
          <li>
            Hizmet Yönetimi sisteminin verimliliğini, standartlara ve yasal mevzuatlara uyumunu iç ve dış
            denetimlerle kontrol etmek ve sistemi sürekli uyumlu kılmak,
          </li>
          <li>
            Hizmet yönetimi süreçlerini sürekli izleyerek hedefe ulaşabilmek için iyileştirme çalışmaları
            gerçekleştirmek.
          </li>
        </ul>
        <p className="mt-4">
          Ceyhun Çakanel
          <br />
          VEPAŞ Genel Müdür Vekili
        </p>
        <p className="mt-3">
          Meltem Bakiler Şahin
          <br />
          Vodafone Türkiye İcra Kurulu Başkan Yardımcısı
        </p>
      </>
    ),
  },
  {
    title: "E-para ve ödeme işlemlerinde kendi adına ve fakat başkası hesabına işlem yapıldığının beyan edilmesi hakkında duyuru",
    body: (
      <>
        <p>
          5549 Sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun&apos;un 15.Maddesine göre; yükümlüler
          nezdinde veya aracılığıyla yapılacak kimlik tespitini gerektiren işlemlerde, kendi adına ve fakat başkası
          hesabına hareket eden kimse, bu işlemleri yapmadan önce kimin hesabına hareket ettiğini kuruluşumuza
          yazılı olarak bildirmediği takdirde altı aydan bir yıla kadar hapis veya beş bin güne kadar adli para
          cezası ile cezalandırılır.
        </p>
        <p className="mt-3">
          Bu kapsamda Vodafone Elektronik Para ve Ödeme Hizmetleri A.Ş. nezdinde 5549 sayılı Kanun, ilgili yönetmelik
          ve tebliğler çerçevesinde kimlik tespiti gerektiren işlem yaptıran gerçek ve tüzel kişilerin kendi adına ve
          fakat başkası adına hareket etmeleri halinde, kimin hesabına hareket ettiklerini işlemi yapmadan önce
          Şirketimize yazılı olarak beyan etme zorunluluğu bulunmaktadır. Bu beyan üzerine; işlemi talep edenin
          kimliği ve yetki durumu ile hesabına hareket edilen kişinin kimliği &quot;Suç Gelirlerinin Aklanmasının ve
          Terörün Finansmanın Önlenmesine Dair Tedbirler&quot; hakkında Yönetmeliğin 6 ile 14&apos;üncü maddeleri
          arasındaki hükümlere göre tespit edilir. Başkası adına işlem yapıldığının beyan edilmediği durumlarda,
          Şirketimizce kendi nam ve hesabınıza işlem yaptığınız kabul edilir.
        </p>
      </>
    ),
  },
];

export function DuyurularAccordion({ items = fallbackAnnouncements }: { items?: Announcement[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.title}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-x-4 rounded bg-white px-5 py-[22px] text-left shadow-[0px_2px_8px_0px_#00000029]"
            >
              <h3 className="font-bold text-black">{item.title}</h3>
              <FaqChevronIcon className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="rounded bg-gray-50 px-5 py-4">
                <div className="text-sm leading-6 text-gray-700">{item.body}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
