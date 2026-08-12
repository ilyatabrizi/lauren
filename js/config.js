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
  hours: 'هر روز ۱۰:۰۰ تا ۲۲:۰۰ — جمعه‌ها ۱۶:۰۰ تا ۲۲:۰۰',
  mapUrl: 'https://maps.google.com/?q=Atlas+Shopping+Center+Tabriz',
  followers: '89.2K',
};

export const SHOP = {
  currency: 'تومان',
  freeShippingOver: 5_000_000,
  shipping: [
    { id: 'peyk', label: 'پیک اختصاصی تبریز', note: 'تحویل همان روز', cost: 180_000 },
    { id: 'pishtaz', label: 'پست پیشتاز', note: '۲ تا ۴ روز کاری', cost: 320_000 },
    { id: 'tipax', label: 'تیپاکس', note: '۱ تا ۳ روز کاری', cost: 450_000 },
  ],
  gateways: [
    { id: 'saman', label: 'بانک سامان', sub: 'درگاه مستقیم' },
    { id: 'mellat', label: 'بانک ملت', sub: 'به‌پرداخت ملت' },
    { id: 'zarin', label: 'زرین‌پال', sub: 'پرداخت واسط' },
  ],
  // loyalty — «باشگاه لارن»
  points: {
    perToman: 10_000,   // هر ۱۰٬۰۰۰ تومان خرید = ۱ امتیاز
    tomanPerPoint: 500, // هر ۱ امتیاز = ۵۰۰ تومان اعتبار
    signupBonus: 50,
    reviewBonus: 15,
  },
  tiers: [
    { id: 'member',   name: 'عضو',      min: 0,    perk: '۵٪ تخفیف تولد' },
    { id: 'silver',   name: 'نقره‌ای',   min: 500,  perk: 'ارسال رایگان دائمی' },
    { id: 'gold',     name: 'طلایی',    min: 1500, perk: 'دسترسی زودهنگام به کالکشن' },
    { id: 'platinum', name: 'پلاتین',   min: 4000, perk: 'استایلیست اختصاصی' },
  ],
  coupons: {
    LAUREN10: { type: 'percent', value: 10, label: '۱۰٪ تخفیف' },
    ATLAS:    { type: 'percent', value: 15, label: '۱۵٪ تخفیف حضوری' },
    POST0:    { type: 'shipping', value: 0, label: 'ارسال رایگان' },
  },
};

// This build is a design preview: no server, no real gateway, no real money.
export const PREVIEW = {
  enabled: true,
  note: 'این نسخه پیش‌نمایش طراحی است. پرداخت واقعی انجام نمی‌شود.',
  // Luhn-valid on purpose: the preview gateway checks it, so an invalid
  // number here would dead-end anyone clicking through the demo.
  testCard: '6037 9975 1234 5670',
};
