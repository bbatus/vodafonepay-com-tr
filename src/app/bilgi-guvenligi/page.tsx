import type { Metadata } from "next";
import { AppDownloadBanner } from "@/components/AppDownloadBanner";
import { Header } from "@/components/Header";
import { StickyQr } from "@/components/StickyQr";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { getLegalPage, getPageMeta, textToParagraphs } from "@/lib/cms";
import { buildMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMeta = await getPageMeta("/bilgi-guvenligi");
  return buildMetadata({
    title: pageMeta?.seoTitle || "Bilgi Güvenliği | Vodafone Pay",
    description: pageMeta?.seoDescription || "Vodafone Pay müşteri bilgileri ve hassas ödeme verilerinin güvenliği için alınması gereken önlemler.",
    path: "/bilgi-guvenligi",
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
const fallbackTips = [
  "Sizi arayan ve kendilerini avukat, polis, savcı, bankacı, sigortacı gibi tanıtan, sosyal medya/e-posta üzerinden arkadaşınız ya da ticaret yaptığınız şirket gibi davranan dolandırıcılar olabilir. Bu nedenle kiminle görüştüğünüze dikkat edin.",
  "Vodafone Pay uygulamasındaki cep telefonu ve e-posta bilgilerinizin, her zaman güncel olmasına dikkat edin.",
  "Vodafone Pay kartınızı sizin dışınızda kimsenin kullanmasına izin vermeyin.",
  "Vodafone Pay kartınızı kullanırken satıcıların yaptığı işleme dikkat edin. Kartınızı işlem yapılmak üzere satıcıya verdiğinizde kart numaranızın not edilmediğinden ya da POS cihazı dışında bir cihazdan geçirilmediğinden emin olun.",
  "Vodafone Pay kartınızla POS makinelerinde ödeme yaptıktan sonra kartınızı geri aldığınızdan emin olun.",
  "İnternet kafe gibi halka açık ve kalabalık yerlerde bulunan bilgisayarlarda, internet aracılığıyla alışveriş yapmanız durumunda kart bilgilerinizin güvenliği açısından çok dikkatli olun.",
  "Hem cep telefonunuzda hem de kişisel bilgisayarınızda antivirüs yazılımınız yoksa, sosyal ağlardaki kimliklerinizi, e-posta hesaplarınızı ve kişisel bilgilerinizi kaybedebilirsiniz. Cihazlarınızı korumak için güvenilir yazılım firmalarına ait güvenlik yazılımlarını kullanmalısınız.",
  "Mobil cihazınızın son sürümünün yüklü olmasını ve güncel güvenlik yamalarını yüklemenizi öneririz.",
  "Güvenliğiniz için şifrenizi belirlerken kolay tahmin edilebilir ve sizinle ilişkilendirilebilir sayılar kullanmayın.",
  "Ödeme işlemine onay verirken internet tarayıcınızın web adresinde https bağlantısının olduğundan ve güvenli bağlantınız için kullanılan sertifikanın geçerli ve ödeme işlemi ile ilişkili olduğundan emin olun.",
  "Şifrenizi ve size gelen tek seferlik SMS doğrulama kodunu (OTP) kimseyle paylaşmayın.",
  "Vodafone Pay uygulamanızın son güncel versiyonunun yüklü olduğundan emin olun.",
  "Vodafone Pay uygulamasını sadece güvenli olan Apple Store, Google Play, Huawei AppGallery platformlarından indirin. Başka hiçbir kanal üzerinden veya güvenli olmayan paketleri telefonunuza yüklemeyin.",
  "Mobil Ödeme işlemlerinizde tek seferlik şifre giriş sayfasını güvenilir bir tarayıcıda (Google Chrome, Mozilla Firefox, Apple Safari, Opera, vb.) girin. Bunun haricinde güvenilir olmayan tarayıcılarda ödeme işleminizi gerçekleştirmeyin.",
  "Vodafone Pay kart numaranızın tamamını, son kullanma tarihini, kartınıza ait CVV numarasını ve kart şifrenizi kimseyle paylaşmayın.",
  "Vodafone Pay kartınızın çalınması veya kaybolması durumunda 0 (212) 942 21 21 no'lu Çağrı Merkezi numaramızı arayarak kartınızı iptal ettirebilir ve mevcut bakiyenizin yeni bir karta aktarılmasını sağlayabilirsiniz.",
  "Mobil ödeme aboneliğinizin olduğu hattınızın kaybolması/çalınması durumunda; hattınızı Faturama Yansıt'a kapatmak için 0 (212) 942 21 21 no'lu Çağrı Merkezi numaramızı arayabilir veya \"MOBILODEME KAPAT\" yazıp 7878'e gönderebilirsiniz. Hattınızı bulmanız ve güvenliğinden emin olmanız durumunda, \"MOBILODEME AC\" yazıp 7878'e SMS göndererek ya da Çağrı Merkezimizi arayarak tekrar faturama yansıta açtırabilirsiniz.",
  "Gerçekleştirdiğiniz işlemleriniz esnasında veya yapılan işlemleri incelerken size ait olmayan bir işlem tespit etmeniz veya başka bir sahtekarlık ve dolandırıcılık şüphesi olan bir işlem fark etmeniz durumunda; 0 (212) 942 21 21 no'lu Çağrı Merkezi numaramızdan gecikmeksizin bildirimde bulunmalısınız.",
  "Kuruluşumuz sadece Vodafone Pay isimli SMS başlığı ile size bilgilendirme yapar.",
  "Sizlere ödül kazandırma vaadi karşılığında Vodafone Pay uygulamasına giriş şifrenizi veya SMS ile iletilen şifreleri paylaşmanızı isteyen kişilere itibar etmeyin. Vodafone Pay uygulama şifreniz, kart şifreniz, CVV numaranız veya üçüncü bir kişiye ait hesaba para göndermeniz hiçbir koşul altında istenmemektedir.",
  "Vodafone Pay sizlere kredi vermek vaadi ile faturama yansıt şifrenizi istemez. Vodafone Pay'in kredi verme gibi bir hizmeti bulunmamaktadır. Sosyal medya ve benzeri kanallar aracılığıyla size ulaşan ve Faturana Yansıt hizmetini kullanmanızı isteyerek karşılığında kredi, hediye çeki veya ek fayda sağlayacağını iddia eden kişilere lütfen itibar etmeyin.",
  "Vodafone Pay uygulamasındaki kimlik doğrulama süreci sırasında, güvenli, şeffaf ve mevzuata uygun bir dijital müşteri edinimi sağlamak amacıyla Ön Plan Servisi (Foreground Services) ve Medya Yansıtma/ekran kaydı (Media Projection) özelliklerinden faydalanıyoruz. Bu kayıt yalnızca yüz doğrulama adımı sırasında gerçekleşir ve yalnızca kullanıcının açık rızası alındıktan sonra başlatılır. Ekran kaydı yalnızca yüz doğrulama adımı sırasında görünen ekran etkinliğini kaydeder, herhangi bir ses veya mikrofon girişi içermez, doğrulama tamamlandığında otomatik olarak durdurulur ve kullanıcının cihazında saklanmaz ve üçüncü taraflarla paylaşılmaz.",
  "Bu özelliğin kullanımı, yasal ve düzenleyici yükümlülüklere tamamen uyumludur ve uzaktan kimlik doğrulama sürecinin bütünlüğünü ve denetlenebilirliğini sağlamak amacıyla gerçekleştirilir. Kullanıcılar bu izni vermemeyi tercih edebilir; ancak bu durumda uzaktan kimlik doğrulama süreci tamamlanamaz.",
];

export default async function BilgiGuvenligi() {
  const cmsPage = await getLegalPage("bilgi-guvenligi");
  const tips = cmsPage ? textToParagraphs(cmsPage.intro) : fallbackTips;

  const pageMeta = await getPageMeta("/bilgi-guvenligi");

  return (
    <main className="flex min-h-screen flex-col">
      <AppDownloadBanner />
      <Header />
      <StickyQr />
      <Breadcrumb current={pageMeta?.breadcrumbLabel || "Bilgi Güvenliği"} />

      <section className="mx-auto w-full max-w-3xl px-4 pb-20">
        <h1 className="text-center text-[40px] font-light leading-[48px] text-black">Bilgi Güvenliği</h1>

        <p className="mt-8 text-sm leading-6 text-gray-700">
          Müşteri bilgilerinin, kişisel verilerin ve hassas ödeme verilerinin gizliliğini ve güvenliğini sağlamak
          üzere sunduğumuz hizmetlere ilişkin riskler ve alınması gereken önlemler aşağıdaki gibidir:
        </p>

        <ul className="mt-6 flex flex-col gap-y-4">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-x-3 text-sm leading-6 text-gray-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vf-red" />
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
