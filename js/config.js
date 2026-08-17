// LAUREN — brand + storefront configuration.
// Everything the client might want changed lives here, in one file.

export const BRAND = {
  name: 'LAUREN',
  nameFa: 'لارن',
  tagline: 'Timeless Clothing, Endless Style',
  taglineFa: 'لباسِ ماندگار، استایلِ بی‌پایان',
  instagram: 'lauren__ir',
  instagramWomen: 'lauren.clothing.women',
  whatsapp: '989141039836',
  phone: '۰۴۱ ۳۳۳۳ ۱۰۳۹',
  address: 'تبریز، خیابان ولیعصر، مرکز خرید اطلس، طبقه GC',
  addressShort: 'تبریز · مرکز خرید اطلس',
  hours: 'هر روز ۱۰ تا ۲۲ — جمعه‌ها ۱۶ تا ۲۲',
  mapUrl: 'https://maps.google.com/?q=Atlas+Shopping+Center+Tabriz',
  followers: '89.2K',
};

export const SHOP = {
  currency: 'تومان',
  freeShippingOver: 5_000_000,
  shipping: [
    { id: 'peyk', label: 'پیک اختصاصی تبریز', note: 'تحویل همان روز', cost: 180_000, days: [0, 1] },
    { id: 'pishtaz', label: 'پست پیشتاز', note: '۲ تا ۴ روز کاری', cost: 320_000, days: [2, 4],
      track: 'https://tracking.post.ir/' },
    { id: 'tipax', label: 'تیپاکس', note: '۱ تا ۳ روز کاری', cost: 450_000, days: [1, 3],
      track: 'https://tipaxco.com/' },
    { id: 'pickup', label: 'تحویل حضوری در اطلس', note: 'پرو در فروشگاه · آماده تا ۲ ساعت',
      cost: 0, pickup: true, days: [0, 0] },
  ],
  gateways: [
    { id: 'saman', label: 'بانک سامان', sub: 'درگاه مستقیم' },
    { id: 'mellat', label: 'بانک ملت', sub: 'به‌پرداخت ملت' },
    { id: 'zarin', label: 'زرین‌پال', sub: 'پرداخت واسط' },
  ],

  /* ------------------------------------------------------------ wallet --
   * «کیف اعتبار لارن». One number, in Toman, so nothing needs converting.
   *
   * The scheme this replaced ran on two exchange rates at once — 10,000 Toman
   * spent earned 1 point, and 1 point was worth 500 Toman — so the product
   * page, the account and the tier bar each quoted a different unit and the
   * shopper had to do arithmetic to answer "how much comes back?". Now the
   * only unit on screen is Toman.
   */
  wallet: {
    // Credit is earned on the merchandise subtotal AFTER any coupon and
    // BEFORE shipping — so postage never earns, and paying with credit
    // doesn't quietly shrink what the next order earns.
    rateByTier: { member: 0.05, silver: 0.07, gold: 0.10 },
    // A shopper can cover at most half an order with credit. Without a cap,
    // a balance can zero out an order and the shop takes nothing.
    maxShareOfOrder: 0.5,
    welcome: 200_000,      // once per phone number, never counts toward tier
    expiryMonths: 12,
  },

  // Tier is set by what was actually spent in the last 12 months — not by a
  // balance, and never by the welcome credit.
  tiers: [
    { id: 'member', name: 'عضو',     minSpend: 0,          rate: 0.05,
      perk: 'ارسال رایگان بالای ۵ میلیون تومان' },
    { id: 'silver', name: 'نقره‌ای', minSpend: 25_000_000, rate: 0.07,
      perk: 'ارسال همیشه رایگان · تعویض سایز تا ۱۴ روز' },
    { id: 'gold',   name: 'طلایی',   minSpend: 60_000_000, rate: 0.10,
      perk: 'دسترسی زودهنگام به کالکشن · نوبت پرو اختصاصی' },
  ],

  /* The order lifecycle. This preview has no courier feed, so the stage is
   * derived from how long ago the order was placed — but it is derived in ONE
   * place (orderStage in store.js) so the account card, the tracker and the
   * receipt can never disagree. Real integration replaces that one function. */
  stages: [
    { key: 'paid',    label: 'پرداخت شد',              note: 'سفارش ثبت و پرداخت شد',      afterHours: 0 },
    { key: 'packing', label: 'آماده‌سازی در فروشگاه',   note: 'بسته‌بندی و کنترل نهایی',     afterHours: 1 },
    { key: 'sent',    label: 'تحویل به پست',            note: 'کد رهگیری پیامک می‌شود',      afterHours: 6 },
    { key: 'done',    label: 'تحویل به شما',            note: '',                            afterHours: 48 },
  ],
  // the pickup flow has its own wording — nothing is posted
  stagesPickup: [
    { key: 'paid',    label: 'پرداخت شد',              note: 'سفارش ثبت و پرداخت شد',      afterHours: 0 },
    { key: 'packing', label: 'آماده‌سازی در فروشگاه',   note: 'کنترل نهایی و کنار گذاشتن',   afterHours: 1 },
    { key: 'ready',   label: 'آماده‌ی تحویل در اطلس',   note: 'هر روز ۱۰ تا ۲۲',            afterHours: 2 },
    { key: 'done',    label: 'تحویل گرفتید',            note: '',                            afterHours: 72 },
  ],

  exchange: {
    days: 7,
    daysSilver: 14,
    reasons: ['کوچک بود', 'بزرگ بود', 'ایراد دوخت', 'با تصویر تفاوت داشت', 'نظرم عوض شد'],
  },

  coupons: {
    LAUREN10: { type: 'percent', value: 10, label: '۱۰٪ تخفیف' },
    ATLAS:    { type: 'percent', value: 15, label: '۱۵٪ تخفیف حضوری' },
    POST0:    { type: 'shipping', value: 0, label: 'ارسال رایگان' },
  },
};

// This build is a design preview: no server, no real gateway, no real money.
export const PREVIEW = {
  enabled: true,
  note: 'این نسخه پیش‌نمایش طراحی است و پرداخت واقعی انجام نمی‌شود.',
  // Luhn-valid on purpose: the preview gateway checks it, so an invalid
  // number here would dead-end anyone clicking through the demo.
  testCard: '6037 9975 1234 5670',
};
