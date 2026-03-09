export const CITIES = [
  { value: 'rome', label: 'رم (Roma)' },
  { value: 'milan', label: 'میلان (Milano)' },
  { value: 'florence', label: 'فلورانس (Firenze)' },
  { value: 'venice', label: 'ونیز (Venezia)' },
  { value: 'naples', label: 'ناپل (Napoli)' },
  { value: 'turin', label: 'تورین (Torino)' },
  { value: 'bologna', label: 'بولونیا (Bologna)' },
  { value: 'genoa', label: 'جنوا (Genova)' },
  { value: 'palermo', label: 'پالرمو (Palermo)' },
  { value: 'catania', label: 'کاتانیا (Catania)' },
  { value: 'verona', label: 'ورونا (Verona)' },
  { value: 'bari', label: 'باری (Bari)' },
  { value: 'bergamo', label: 'برگامو (Bergamo)' },
  { value: 'brescia', label: 'برشیا (Brescia)' },
  { value: 'padua', label: 'پادوا (Padova)' },
  { value: 'other', label: 'سایر شهرها' },
];

export const CATEGORIES = [
  {
    id: 'real-estate',
    label: 'مسکن و ملک',
    icon: '🏠',
    color: 'bg-blue-100 text-blue-700',
    subcategories: [
      { value: 'apartment-rent', label: 'اجاره آپارتمان' },
      { value: 'apartment-sale', label: 'فروش آپارتمان' },
      { value: 'house-rent', label: 'اجاره خانه' },
      { value: 'house-sale', label: 'فروش خانه' },
      { value: 'room-rent', label: 'اجاره اتاق' },
      { value: 'office', label: 'دفتر و تجاری' },
    ],
  },
  {
    id: 'vehicles',
    label: 'خودرو و وسایل نقلیه',
    icon: '🚗',
    color: 'bg-red-100 text-red-700',
    subcategories: [
      { value: 'car-sale', label: 'فروش ماشین' },
      { value: 'car-rent', label: 'اجاره ماشین' },
      { value: 'motorcycle', label: 'موتورسیکلت' },
      { value: 'bicycle', label: 'دوچرخه' },
      { value: 'car-parts', label: 'قطعات خودرو' },
    ],
  },
  {
    id: 'electronics',
    label: 'موبایل و الکترونیک',
    icon: '📱',
    color: 'bg-purple-100 text-purple-700',
    subcategories: [
      { value: 'mobile', label: 'موبایل و تبلت' },
      { value: 'laptop', label: 'لپتاپ و کامپیوتر' },
      { value: 'tv', label: 'تلویزیون' },
      { value: 'camera', label: 'دوربین' },
      { value: 'other-electronics', label: 'سایر لوازم الکترونیکی' },
    ],
  },
  {
    id: 'home-appliances',
    label: 'لوازم خانه و آشپزخانه',
    icon: '🛋️',
    color: 'bg-yellow-100 text-yellow-700',
    subcategories: [
      { value: 'furniture', label: 'مبلمان' },
      { value: 'kitchen', label: 'لوازم آشپزخانه' },
      { value: 'decoration', label: 'دکوراسیون' },
      { value: 'garden', label: 'باغبانی' },
    ],
  },
  {
    id: 'jobs',
    label: 'کار و استخدام',
    icon: '💼',
    color: 'bg-green-100 text-green-700',
    subcategories: [
      { value: 'job-offer', label: 'آگهی استخدام' },
      { value: 'job-seek', label: 'رزومه و دنبال کار' },
      { value: 'freelance', label: 'پروژه و فریلنس' },
    ],
  },
  {
    id: 'services',
    label: 'خدمات',
    icon: '🔧',
    color: 'bg-orange-100 text-orange-700',
    subcategories: [
      { value: 'repairs', label: 'تعمیرات' },
      { value: 'cleaning', label: 'نظافت' },
      { value: 'transport', label: 'حمل و نقل' },
      { value: 'teaching', label: 'تدریس و آموزش' },
      { value: 'beauty', label: 'آرایش و زیبایی' },
      { value: 'legal', label: 'مشاوره حقوقی' },
      { value: 'other-services', label: 'سایر خدمات' },
    ],
  },
  {
    id: 'clothing',
    label: 'پوشاک و مد',
    icon: '👗',
    color: 'bg-pink-100 text-pink-700',
    subcategories: [
      { value: 'women-clothing', label: 'پوشاک زنانه' },
      { value: 'men-clothing', label: 'پوشاک مردانه' },
      { value: 'kids-clothing', label: 'پوشاک کودک' },
      { value: 'shoes', label: 'کفش و کیف' },
    ],
  },
  {
    id: 'food',
    label: 'خوراکی و مواد غذایی',
    icon: '🍎',
    color: 'bg-emerald-100 text-emerald-700',
    subcategories: [
      { value: 'iranian-food', label: 'مواد غذایی ایرانی' },
      { value: 'homemade', label: 'غذای خانگی' },
      { value: 'restaurant', label: 'رستوران و کافه' },
    ],
  },
  {
    id: 'kids',
    label: 'کودک و نوجوان',
    icon: '🧸',
    color: 'bg-cyan-100 text-cyan-700',
    subcategories: [
      { value: 'kids-toys', label: 'اسباب‌بازی' },
      { value: 'kids-furniture', label: 'لوازم کودک' },
      { value: 'kids-clothing-sub', label: 'پوشاک کودک' },
    ],
  },
  {
    id: 'other',
    label: 'متفرقه',
    icon: '📦',
    color: 'bg-gray-100 text-gray-700',
    subcategories: [
      { value: 'books', label: 'کتاب و مجله' },
      { value: 'sports', label: 'ورزش و تفریح' },
      { value: 'music', label: 'موسیقی و هنر' },
      { value: 'pets', label: 'حیوانات خانگی' },
      { value: 'misc', label: 'سایر' },
    ],
  },
];

export const getCategoryById = (id: string) => {
  return CATEGORIES.find(cat => cat.id === id);
};

export const getAllSubcategories = () => {
  return CATEGORIES.flatMap(cat =>
    cat.subcategories.map(sub => ({ ...sub, categoryId: cat.id, categoryLabel: cat.label }))
  );
};

export const getCityLabel = (value: string) => {
  return CITIES.find(c => c.value === value)?.label || value;
};
