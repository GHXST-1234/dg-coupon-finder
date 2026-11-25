const fs = require('fs');

const FEEDS = [
  'https://thekrazycouponlady.com',
  'https://hip2save.com'
];

function guessCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('5 off 25') || t.includes('$5/$25') || t.includes('5/25')) return '5off25';
  if (t.includes('cereal') || t.includes('soda') || t.includes('snack') || t.includes('food') || t.includes('coffee')) return 'food';
  return 'household';
}

function extractPrices(text) {
  const matches = [...text.matchAll(/\$([0-9]+(?:\.[0-9]{2})?)/g)].map(m => parseFloat(m[1]));
  if (matches.length >= 2) {
    const sorted = [...matches].sort((a, b) => b - a);
    return { shelfPrice: sorted[0], finalPrice: sorted[sorted.length - 1] };
  }
  if (matches.length === 1) return { shelfPrice: matches[0], finalPrice: matches[0] };
  return { shelfPrice: 2.00, finalPrice: 0.99 };
}

async function run() {
  let freshDeals = [];
  for (const url of FEEDS) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 12);
      items.forEach((m, idx) => {
        const block = m[1];
        const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1];
        const desc = (block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || [])[1] || '';
        if (!title) return;
        const cleanTitle = title.replace(/&#8217;/g, "'").replace(/&#038;/g, "&").replace(/<[^>]+>/g, '').trim();
        const prices = extractPrices(cleanTitle + ' ' + desc);
        freshDeals.push({
          id: `live-${freshDeals.length + 1}`,
          title: cleanTitle,
          category: guessCategory(cleanTitle),
          coupon: 'Check DG Digital Coupons App',
          shelfPrice: prices.shelfPrice,
          finalPrice: prices.finalPrice
        });
      });
    } catch (err) {
      console.log('Feed skipped:', url);
    }
  }

  if (freshDeals.length > 0) {
    const output = {
      updated: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' EST',
      deals: freshDeals
    };
    fs.writeFileSync('deals.json', JSON.stringify(output, null, 2));
    console.log(`Saved ${freshDeals.length} live DG deals.`);
  } else {
    console.log('Kept existing deals.json');
  }
}

run();
