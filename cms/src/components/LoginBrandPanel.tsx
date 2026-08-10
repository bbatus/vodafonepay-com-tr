import React from "react";

const features = [
  {
    title: "Faturana Yansıt",
    desc: "Anlaşmalı işyerlerinde harcamanı Vodafone faturana yansıt.",
    icon: (
      <path d="M4 4h16v16H4V4Zm4 4h8m-8 4h8m-8 4h5" strokeWidth="1.6" strokeLinecap="round" />
    ),
  },
  {
    title: "QR ile Öde",
    desc: "Temassız, hızlı ve güvenli QR ödeme deneyimi.",
    icon: (
      <path
        d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 2h2m-2 4h6v-6h-4"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Anında Bakiye",
    desc: "İhtiyacın olduğu anda anında bakiye yükleme imkânı.",
    icon: <path d="M12 3v18m-6-6 6 6 6-6M6 9l6-6 6 6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

export default function LoginBrandPanel() {
  return (
    <div className="vf-login-panel">
      <div className="vf-login-panel__top">
        <div className="vf-login-panel__badge">
          <img src="/admin-icon.svg" alt="" width={40} height={40} />
        </div>
        <h1 className="vf-login-panel__title">Vodafone Pay</h1>
        <p className="vf-login-panel__tagline">Ödemenin Akıllı Hali — İçerik Yönetim Paneli</p>
      </div>

      <div className="vf-login-panel__features">
        {features.map((f) => (
          <div className="vf-login-panel__card" key={f.title}>
            <svg
              className="vf-login-panel__card-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              {f.icon}
            </svg>
            <div>
              <p className="vf-login-panel__card-title">{f.title}</p>
              <p className="vf-login-panel__card-desc">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="vf-login-panel__status">vodafonepay.com.tr · CMS</p>
    </div>
  );
}
