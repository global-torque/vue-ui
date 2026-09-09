import { createOffersClient, readConfiguration } from './offers.mjs';
const config = readConfiguration(process.env, process.argv.includes('--fixture'));
const client = createOffersClient(config);
try {
  const list = await client.offers.listOffers({ limit: 10 });
  console.log(JSON.stringify({ mode: config.mode, offers: list.data }, null, 2));
  const slug = list.data.data?.[0]?.slug;
  if (slug) {
    const detail = await client.offers.getOffer({ slug });
    console.log(JSON.stringify({ mode: config.mode, offer: detail.data }, null, 2));
  }
} finally { client.dispose(); }
