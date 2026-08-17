export interface NavLink {
  label: string;
  href: string;
}

export interface StepProduct {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

export interface CampaignCard {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  href: string;
  /** CMS-editable CTA text (campaign.ctaLabel) — falls back to "Detayları gör" when unset. */
  linkLabel?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
