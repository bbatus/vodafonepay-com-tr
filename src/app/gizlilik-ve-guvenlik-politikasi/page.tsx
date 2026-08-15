import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getLegalPage, getPageMeta, textToParagraphs } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/gizlilik-ve-guvenlik-politikasi");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Gizlilik ve Güvenlik Politikası | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay kişisel verilerin korunması, gizlilik ve güvenlik politikası aydınlatma metinleri.",
    path: "/gizlilik-ve-guvenlik-politikasi",
    image: pageMeta?.ogImage?.url,
  });
}

/**
 * RFP feedback 5.0 (fallback masking audit) — KEPT DELIBERATELY.
 *
 * Checked against the live DB: the CMS collection behind this section has ZERO
 * rows, so unlike the FAQ/announcement/campaign fallbacks removed in this
 * round, this array is not dead code that only fires on an outage — it IS what
 * the site currently renders. Deleting it would blank a working section rather
 * than reveal a masked failure. Remove it in the same change that seeds the
 * collection; see the round report's "kalan fallback'ler" table.
 */
const fallbackIntro = [
  "6698 sayılı Kişisel Verilerin Korunması Kanunu (\"Kanun\") uyarınca, kişisel verileriniz; veri sorumlusu sıfatıyla, hizmet aldığınız Vodafone Elektronik Para ve Ödeme Hizmetleri A.Ş. (\"Vodafone\", \"Şirket\") tarafından aşağıda açıklanan amaç ve hukuki sebeplerle işlenecektir.",
];

const dataCategories = [
  "Kimlik (ad-soyadı, müşteri ID/kimliği, yaş, cinsiyet)",
  "İletişim (GSM numarası, e-posta adresi, adres bilgisi)",
  "Müşteri İşlem (abonelik bilgisi, sipariş bilgileri, indirim ve kupon bilgileri, talep ve yorumlar dahil gerçekleştirilen işlemlere dair bilgiler, fatura bilgileri ve tercihi)",
  "İşlem Güvenliği (cihaz işletim sistemi ve sürümü, cihaz türü, cihaz ID/kimliği, donanım modeli, IP adresi, kullanıcı işlem (log) kayıtları, elektronik iletişim kayıtları)",
  "Üye İş Yeri İşlemleri (işlem sıklığı, üye işyerinde gerçekleştirilen işleme konu mal veya hizmete ilişkin bilgiler)",
  "Pazarlama (kullanıcı tercih ve ilgi alanları hakkında bilgiler, kampanya ve promosyonlar kapsamındaki bilgiler, satın alınan ürün, hizmet süreçlerinde veya anket ve kampanyalar ile elde edilen bilgiler, pazarlama analizleri ve segmentasyon kapsamında elde edilen bilgiler)",
];

const processingPurposes: { purpose: string; legalBasis: string }[] = [
  {
    purpose:
      "Size uygun ürün, hizmet ve kampanyalarının belirlenebilmesi için kişisel zevk, tercih ve alışkanlıklarınızın belirlenerek pazarlama analiz çalışmalarının yapılması ve bunların tanıtım, reklam ve pazarlamasının yapılması.",
    legalBasis: "Kanun md.5/1 — İlgili kişinin açık rızasını sağlaması.",
  },
  {
    purpose:
      "Cep telefonu ve e-posta iletişim kanallarınıza, Vodafone ürün, hizmet ve kampanyalarının; tanıtım, reklam ve pazarlamasının yapılması amacıyla kısa mesaj, arama, anlık mesaj ve e-posta gönderimleri suretiyle ticari elektronik ileti gönderilmesi.",
    legalBasis: "Kanun md.5/1 — İlgili kişinin açık rızasını sağlaması.",
  },
  {
    purpose:
      "Çeşitli ürün, hizmet ve faydaların tarafınıza sunulmasına ilişkin sözleşme süreçlerinin yürütülmesi. Şirketimizce sunulan çeşitli faydalar bakımından öngörülen sözleşmesel şartlar kapsamında ilgili faydalara hak kazanıp kazanmadığınızın belirlenmesi. Hak kazandığınız faydaların tarafınıza sunulması için gerekli operasyonel işlemlerin gerçekleştirilmesi.",
    legalBasis:
      "Kanun m. 5/2 (c) — Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla, sözleşmenin taraflarına ait kişisel verilerin işlenmesinin gerekli olması.",
  },
  {
    purpose:
      "Ürün, hizmet ve süreçlerimiz ile müşteri deneyimini geliştirmek ve iyileştirmek amacıyla incelemeler gerçekleştirmek; bu incelemeler doğrultusunda iş stratejilerimizi belirlemek. Şikayet, talep, öneri ve isteklerinizin alınması, talebinize istinaden tarafınızla iletişime geçilmesi ve bunların sonuçlandırılması. İş faaliyetlerimizi incelemek ve denetlemek.",
    legalBasis: "Kanun m. 5/2 (f) — Bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması.",
  },
  {
    purpose:
      "Yetkili kurum veya kuruluşların talepte bulunması ya da bu kurumlara bildirim yapılmasının öngörüldüğü durumlarda, yasal yükümlülüklerimizi yerine getirmek.",
    legalBasis:
      "Kanun md. 5/2(ç) — Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için veri işlenmesinin zorunlu olması.",
  },
  {
    purpose: "Olası bir uyuşmazlık durumunda, haklarımızı koruyabilmek ve hukuki süreçleri yürütmek.",
    legalBasis: "Kanun md. 5/2(e) — Bir hakkın tesisi, kullanılması veya korunması için veri işlenmesinin zorunlu olması.",
  },
];

const cookieTypes = [
  {
    title: "Zorunlu Tanımlama Teknolojileri",
    body: "Mobil Uygulamanın düzgün şekilde çalışabilmesi için gerekli olan Tanımlama Teknolojileridir. Bu Tanımlama Teknolojilerinin kullanımı esnasında gerçekleştirdiğimiz veri işleme faaliyetleri için Kanun madde 5/2-c ve Kanun madde 5/2-f hukuki sebebine dayanılmaktadır.",
  },
  {
    title: "İşlevsellik Tanımlama Teknolojileri",
    body: "Mobil Uygulamada kişiselleştirme ve tercihlerin hatırlanması amaçları ile kullanılan teknolojilerdir. Bu Tanımlama Teknolojilerinin kullanımı esnasında gerçekleştirdiğimiz veri işleme faaliyetleri için Kanun madde 5/1 kapsamında “açık rıza” hukuki sebebine dayanılmaktadır.",
  },
  {
    title: "Performans ve Analitik Tanımlama Teknolojileri",
    body: "Mobil Uygulamayı görüntüleyen kişi sayısı ile Mobil Uygulama trafiğini takip ve analiz edilmesini sağlar. Bu Tanımlama Teknolojilerinin kullanımı esnasında gerçekleştirdiğimiz veri işleme faaliyetleri için Kanun madde 5/1 kapsamında “açık rıza” hukuki sebebine dayanılmaktadır.",
  },
];

export default async function GizlilikVeGuvenlikPolitikasi() {
  const cmsPage = await getLegalPage("gizlilik-ve-guvenlik-politikasi");
  const intro = cmsPage ? textToParagraphs(cmsPage.intro) : fallbackIntro;

  const pageMeta = await getPageMeta("/gizlilik-ve-guvenlik-politikasi");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Gizlilik ve Güvenlik Politikası"} />

      <section className="mx-auto w-full max-w-3xl px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Gizlilik ve Güvenlik Politikası</h1>

        <div className="mt-10 flex flex-col gap-y-10 text-sm leading-6 text-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-black">Vodafone Yanımda Uygulaması İşlemlerine Dair Aydınlatma Metni</h2>
            {intro.map((p, i) => (
              <p key={p} className={i === 0 ? "mt-4" : "mt-3"}>
                {p}
              </p>
            ))}

            <h3 className="mt-6 font-bold text-black">
              İşlenen Kişisel Verileriniz, Kişisel Verilerinizin İşlenme Amaçları ve Hukuki Sebepleri
            </h3>
            <p className="mt-3">
              Kişisel Verilerin Korunması Kanunu&apos;nun (&quot;Kanun&quot;) 5. maddesi, kişisel veri işlemenin
              hukuki sebeplerini düzenlemektedir. Aşağıda hangi kişisel verilerinizin hangi amaçlarla işlendiğine ve
              söz konusu amaçlar kapsamında hangi hukuki sebeplere dayanıldığına yer verdik:
            </p>
            <ul className="mt-4 flex flex-col gap-y-4">
              {processingPurposes.map((item) => (
                <li key={item.purpose} className="rounded bg-vf-gray p-4">
                  <p>{item.purpose}</p>
                  <p className="mt-2 font-bold text-black">{item.legalBasis}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4">İşlenen kişisel veri kategorileri:</p>
            <ul className="mt-2 flex list-disc flex-col gap-y-1 pl-5">
              {dataCategories.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>

            <h3 className="mt-6 font-bold text-black">Kişisel Verilerin Aktarıldığı Alıcı Grupları ve Aktarım Amaçları</h3>
            <p className="mt-3">
              Kişisel verileriniz, bu aydınlatma metninin &apos;&apos;İşlenen Kişisel Verileriniz, Kişisel
              Verilerinizin İşlenme Amaçları ve Hukuki Sebepleri&apos;&apos; başlığında belirtilen amaçlar ve hukuki
              sebeplere uygun olarak üçüncü taraflarla aktarılmaktadır.
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-y-2 pl-5">
              <li>
                <span className="font-bold text-black">Vodafone Grup Şirketleri:</span> Grup Şirketleri tarafından
                tedarik edilen altyapıların kullanılması ve kampanyalardan faydalandırılabilmeniz amacıyla Vodafone
                Grup Şirketlerine,
              </li>
              <li>
                <span className="font-bold text-black">Tedarikçiler ve İş Ortakları:</span> Süreç kapsamında ürün ve
                hizmetlerin (örneğin, bilgi teknolojileri hizmetleri) temini için tedarikçiler ve iş ortaklarından
                destek alınması amacıyla tedarikçiler ve iş ortaklarına,
              </li>
              <li>
                <span className="font-bold text-black">Yetkili Kurum ve Kuruluşlar:</span> Yetkili kurum veya
                kuruluşların talepte bulunması ya da bu kurumlara bildirim yapılmasının öngörüldüğü durumlarda, yasal
                yükümlülüklerin yerine getirilmesi amacıyla yetkili kurum ve kuruluşlara aktarılabilmektedir.
              </li>
            </ul>

            <h3 className="mt-6 font-bold text-black">Kişisel Veri Toplama Yöntemleri</h3>
            <p className="mt-3">
              Kimlik ve iletişim bilgileriniz Yanımda uygulaması üzerinden veya yukarıda belirtilen kişisel
              verileriniz Şirket nezdindeki web sitesi, mobil uygulamalar ve çevrimiçi hizmetler üzerinden yapılan
              işlemler, etkileşimleriniz ve elektronik ortamda doldurulan formlar aracılığıyla otomatik, kısmen
              otomatik ve otomatik olmayan yöntemler ile toplanmaktadır.
            </p>

            <h3 className="mt-6 font-bold text-black">Kişisel Verilerinize İlişkin Haklarınız</h3>
            <p className="mt-3">
              Kişisel Verilerin Koruması Kanunu&apos;nun 11. maddesi &quot;ilgili kişi haklarını&quot; düzenlemektedir.
              Kişisel verileri Vodafone tarafından işlenen tüm gerçek kişiler, Kanun uyarınca veri sorumlusuna
              başvurma ve Kanun&apos;da sayılmış yasal haklarını kullanma hakkına sahiptir. Kanun kapsamındaki
              taleplerinizi ve kişisel verilerinizle ilgili her türlü sorunuzu, KVKK İlgili Kişi Talep Formu&apos;nu
              doldurarak veya Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ&apos;e uygun şekilde
              hazırlamış olduğunuz bir dilekçe ile; Maslak Mah. Büyükdere Cad. No:251 Kat:8 Vodafone Plaza Maslak
              Sarıyer / İstanbul adresine (Noter kanalı, taahhütlü posta vb. yollarla) gönderebilir ya da ilgili
              formu vodafoneelektronikpara@hs03.kep.tr adresine elektronik imzalı olarak iletebilir veya başvuru
              yapılan şirkete daha önce bildirilmek ve teyit edilerek ilgili şirket sistemlerine kayıt edilmiş olmak
              koşuluyla e-posta adresinizden kisiselverilerinkorunmasi@vodafone.com adresine iletebilirsiniz.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black">Vodafone Pay Mobil Uygulama Gizlilik Politikası</h2>
            <p className="mt-4">
              İşbu Vodafone Pay Mobil Uygulama Gizlilik Politikası &amp; Aydınlatma Metni, 6698 sayılı Kişisel
              Verilerin Korunması Kanunu&apos;nun (&quot;Kanun&quot;) m. 10 ile Aydınlatma Yükümlülüğünün Yerine
              Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında veri sorumlusu sıfatıyla Vodafone
              Elektronik Para ve Ödeme Hizmetleri AŞ (&quot;Vodafone&quot; veya &quot;Şirket&quot;) tarafından
              hazırlanmıştır.
            </p>
            <p className="mt-3">
              Bu metnin amacı, mobil uygulamamızda kullanılan SDK&apos;lar (Software Development Kit) ve kullanıcı
              hareketlerinin incelenmesine yarayan diğer araçların (tümü &quot;Tanımlama Teknolojileri&quot;)
              cihazınıza yerleştirilmesi aracılığıyla otomatik yolla elde edilen kişisel verilerin işlenmesine
              ilişkin olarak, hangi amaçlarla hangi tür tanımlama teknolojileri kullandığımız, hukuki sebebi, bu
              tanımlama teknolojilerini nasıl yönetebileceğiniz ve haklarınız hakkında sizlere bilgi vermektir.
            </p>
            <p className="mt-3">
              Tanımlama Teknolojileri, mobil uygulama kullanıcılarının belirli hareketlerinin kayıt altına
              alınmasını sağlar. Tanımlama Teknolojileri mobil uygulamanın daha verimli çalışmasının yanı sıra
              kişisel ihtiyaçlarınıza daha uygun ve hızlı bir ziyaret deneyimi yaşatmak için kişiselleştirilmiş
              içeriklerin sunulabilmesine olanak vermektedir. Tanımlama Teknolojileri, sadece ziyaret geçmişinize
              dair bilgiler içermekte olup mobil cihazınızda depolanmış dosyalara dair herhangi bir bilgi
              toplamamaktadır.
            </p>

            <h3 className="mt-6 font-bold text-black">Kişisel Verilerinizi İşleme Amaçlarımız ve Hukuki Sebepler</h3>
            <div className="mt-3 flex flex-col gap-y-4">
              {cookieTypes.map((c) => (
                <div key={c.title}>
                  <p className="font-bold text-black">{c.title}</p>
                  <p className="mt-1">{c.body}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-6 font-bold text-black">Tanımlama Teknolojileri Aracılığıyla İşlenen Kişisel Veriler</h3>
            <p className="mt-3">
              Kullanıcı kimliği/ID, IP adresi, cihaz ve işletim sistemi, ziyaret tarihi ve saati, etkileşim durumu
              (örneğin, Mobil Uygulamaya erişip erişemediğiniz veya bir hata uyarısı alıp almadığınız), Mobil
              Uygulamadaki özelliklerin kullanımı, girdiğiniz arama ifadeleri, Mobil Uygulamayı ne sıklıkta ziyaret
              ettiğiniz, dil tercihleriniz, sayfaları kaydırma hareketleri, eriştiğiniz sekmelere ilişkin bilgiler
              dahil kullanıcı işlem bilgileriniz işlenmektedir.
            </p>

            <h3 className="mt-6 font-bold text-black">Tanımlama Teknolojilerinin Yönetimi</h3>
            <p className="mt-3">
              Tanımlama Teknolojisi kullanılmasını tercih etmezseniz cihazınızın ayarlarından Tanımlama
              Teknolojilerini silebilir ya da engelleyebilirsiniz. Buna karşın, Mobil Uygulamanın çalışması için
              zorunlu olan Tanımlama Teknolojileri&apos;nin kullanılması gerekmektedir. Zorunlu Tanımlama
              Teknolojileri&apos;nin kullanılmaması halinde Mobil Uygulama&apos;nın birtakım işlevlerinin kısmen ya
              da tamamen çalışmayabileceğini hatırlatmak isteriz.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-black">Çerez Politikası</h2>
            <p className="mt-4">
              Vodafone&apos;da kişisel verileriniz güvence altındadır. Bu çerçevede Vodafone, kişisel verilerinizi
              tüm teknik ve idari tedbirleri alarak korur. Gerekli güvenlik düzeyi için bütün teknolojik imkanlar
              kullanılır.
            </p>
            <p className="mt-3">
              Bu metin, https://www.vodafonepay.com.tr/ (&quot;Site&quot;) kullanımınız veya ziyaretiniz sırasında
              sizlerin deneyimini geliştirmek için kullanılan çerezlerin cihazınıza yerleştirilmesi aracılığıyla
              otomatik yolla elde edilen kişisel verilerin işlenmesi hakkında sizleri bilgilendirmek amacıyla
              hazırlanmıştır. Çerez türleri, kullanım amaçları ve internet sitesinde kullanılan çerezlerin tam
              listesi Çerez Politikası sayfamızda yer almaktadır.
            </p>
          </div>

          <p className="text-xs text-gray-400">Mevcut Versiyon Tarihi: 27/03/2024</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
