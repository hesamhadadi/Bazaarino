export type RootStackParamList = {
  Home: undefined;
  AdDetails: { adId: string; title?: string };
  Register: undefined;
  Info: undefined;
};

export type AdSummary = {
  _id: string;
  title: string;
  description: string;
  price?: number;
  priceType?: 'fixed' | 'negotiable' | 'free' | 'exchange';
  currency?: string;
  city: string;
  category: string;
  subcategory: string;
  images?: string[];
  status?: string;
  isFeatured?: boolean;
  isUrgent?: boolean;
  views?: number;
  createdAt?: string;
  marketPrice?: {
    label?: string;
    trend?: 'up' | 'down' | 'stable';
  };
  userId?: {
    name?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    city?: string;
    role?: string;
    createdAt?: string;
  };
};

export type AdListResponse = {
  ads: AdSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdDetailsResponse = {
  ad: AdSummary & {
    phone?: string;
    email?: string;
    showPhone?: boolean;
    showEmail?: boolean;
    housing?: {
      deposit?: number;
      residenceEligible?: boolean;
      preferredGender?: 'male' | 'female' | 'any';
      preferredAgeMin?: number;
      preferredAgeMax?: number;
      preferredUniversity?: string;
      roommatesCount?: number;
      availabilityStartDate?: string;
      billsInfo?: 'included' | 'not-included' | 'partial';
      agencyFee?: number;
      isAllInclusivePrice?: boolean;
      address?: string;
      location?: {
        lat: number;
        lng: number;
      };
    };
  };
};
