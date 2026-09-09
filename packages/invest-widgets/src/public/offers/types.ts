export interface OfferCardImage {
  src: string;
  alt: string;
  srcset?: string;
  sizes?: string;
}

export interface OfferCardFact {
  label: string;
  value: string;
}

/** Host-formatted presentation data; amounts, eligibility and routes stay in the host. */
export interface OfferCardData {
  id: string;
  title: string;
  description?: string;
  image?: OfferCardImage;
  facts?: readonly OfferCardFact[];
}
