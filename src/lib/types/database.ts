/** Database enums and row types (formerly @prisma/client). */

export const Role = { USER: "USER", ADMIN: "ADMIN" } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  PIX: "PIX",
  CREDIT_CARD: "CREDIT_CARD",
  BOLETO: "BOLETO",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const ProductStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  OUT_OF_STOCK: "OUT_OF_STOCK",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const ShippingMode = {
  FREE: "FREE",
  FIXED: "FIXED",
  CORREIOS: "CORREIOS",
} as const;
export type ShippingMode = (typeof ShippingMode)[keyof typeof ShippingMode];

export const CouponType = { PERCENT: "PERCENT", FIXED: "FIXED" } as const;
export type CouponType = (typeof CouponType)[keyof typeof CouponType];

export const NotificationType = {
  ORDER: "ORDER",
  PAYMENT: "PAYMENT",
  SHIPPING: "SHIPPING",
  PROMO: "PROMO",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const TrackingStatus = {
  LABEL_CREATED: "LABEL_CREATED",
  IN_TRANSIT: "IN_TRANSIT",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  EXCEPTION: "EXCEPTION",
  RETURNED: "RETURNED",
} as const;
export type TrackingStatus = (typeof TrackingStatus)[keyof typeof TrackingStatus];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  SETTINGS_CHANGE: "SETTINGS_CHANGE",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type User = {
  id: string;
  authUserId: string | null;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  passwordHash: string | null;
  phone: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type Account = {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};

export type VerificationToken = {
  identifier: string;
  token: string;
  expires: Date;
};

export type PasswordResetToken = {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export type Address = {
  id: string;
  userId: string;
  label: string | null;
  recipientName: string;
  phone: string | null;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  parentId: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  priceCents: number;
  compareCents: number | null;
  stock: number;
  status: ProductStatus;
  active: boolean;
  images: JsonValue | null;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: string[];
  brand: string | null;
  costCents: number | null;
  showPrice: boolean;
  stockUnlimited: boolean;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  shippingMode: ShippingMode;
  fixedShippingCents: number | null;
  /** @deprecated Use videoUrls instead */
  videoUrl: string | null;
  videoUrls: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type ProductOption = {
  id: string;
  productId: string;
  name: string;
  sortOrder: number;
};

export type ProductOptionValue = {
  id: string;
  optionId: string;
  value: string;
  sortOrder: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string | null;
  priceCents: number | null;
  compareCents: number | null;
  costCents: number | null;
  stock: number;
  stockUnlimited: boolean;
  lowStockThreshold: number;
  soldCount: number;
  attributes: JsonValue;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const ReviewSource = { USER: "USER", AI: "AI" } as const;
export type ReviewSource = (typeof ReviewSource)[keyof typeof ReviewSource];

export type ProductReview = {
  id: string;
  productId: string;
  userId: string | null;
  authorName: string;
  text: string;
  rating: number;
  imageUrl: string | null;
  source: ReviewSource;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Order = {
  id: string;
  userId: string | null;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingCents: number;
  shippingServiceId: string | null;
  shippingServiceName: string | null;
  discountCents: number;
  couponCode: string | null;
  subtotalCents: number;
  totalCents: number;
  trackingCode: string | null;
  carrier: string | null;
  notes: string | null;
  paidAt: Date | null;
  processingAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  priceCents: number;
  deductedStock: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Payment = {
  id: string;
  orderId: string;
  mercadoPagoId: string | null;
  mercadoPagoPrefId: string | null;
  externalReference: string | null;
  status: PaymentStatus;
  amountCents: number;
  method: PaymentMethod | null;
  metadata: JsonValue;
  paidAt: Date | string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minCents: number | null;
  validFrom: Date | string | null;
  validUntil: Date | string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CartItem = {
  id: string;
  userId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  slug: string | null;
  name: string | null;
  priceCents: number | null;
  imageUrl: string | null;
  updatedAt: Date;
};

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: JsonValue;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AuditLog = {
  id: string;
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId: string;
  oldData: JsonValue;
  newData: JsonValue;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export type ShippingRate = {
  id: string;
  name: string;
  minWeightGrams: number | null;
  maxWeightGrams: number | null;
  priceCents: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type StorefrontBanner = {
  id: string;
  title: string;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  altText: string | null;
  link: string | null;
  sortOrder: number;
  active: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TrustItem = {
  id: string;
  title: string;
  description: string | null;
  iconKey: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogTag = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string | null;
  authorId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WhatsappRecipient = {
  id: string;
  label: string | null;
  phone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const WhatsappTemplateRecipientType = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;
export type WhatsappTemplateRecipientType =
  (typeof WhatsappTemplateRecipientType)[keyof typeof WhatsappTemplateRecipientType];

export const CustomerActivityType = {
  PAGE_VIEW: "PAGE_VIEW",
  PRODUCT_VIEW: "PRODUCT_VIEW",
  ADD_TO_CART: "ADD_TO_CART",
  REMOVE_FROM_CART: "REMOVE_FROM_CART",
  BEGIN_CHECKOUT: "BEGIN_CHECKOUT",
  SEARCH: "SEARCH",
} as const;
export type CustomerActivityType =
  (typeof CustomerActivityType)[keyof typeof CustomerActivityType];

export type CustomerActivity = {
  id: string;
  userId: string;
  type: CustomerActivityType;
  path: string | null;
  productId: string | null;
  productName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export const WhatsappTemplateEvent = {
  NEW_ORDER: "NEW_ORDER",
  PAYMENT_APPROVED: "PAYMENT_APPROVED",
  ORDER_PROCESSING: "ORDER_PROCESSING",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  PENDING_PAYMENT: "PENDING_PAYMENT",
  ABANDONED_CART: "ABANDONED_CART",
  CUSTOM_OUTREACH: "CUSTOM_OUTREACH",
} as const;
export type WhatsappTemplateEvent =
  (typeof WhatsappTemplateEvent)[keyof typeof WhatsappTemplateEvent];

export type WhatsappTemplate = {
  id: string;
  key: string;
  name: string;
  template: string;
  recipientType: WhatsappTemplateRecipientType;
  event: WhatsappTemplateEvent;
  active: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type StorefrontTrustItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SiteSettings = {
  id: string;
  storeName: string;
  storeEmail: string;
  storePhone: string | null;
  storeAddress: string | null;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  freeShippingThresholdCents: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  faviconUrl: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  whatsappNumber: string | null;
  googleAnalyticsId: string | null;
  facebookPixelId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Extended types with relations
export type ProductWithRelations = Product & {
  category?: Category | null;
  productImages?: ProductImage[];
  /** @deprecated Prefer productOptions — kept for admin form compatibility */
  productOptions?: (ProductOption & { values?: ProductOptionValue[] })[];
  /** @deprecated Prefer productVariants — kept for admin form compatibility */
  productVariants?: ProductVariant[];
  options?: (ProductOption & { values?: ProductOptionValue[] })[];
  variants?: ProductVariant[];
};

export type OrderWithRelations = Order & {
  items?: (OrderItem & { product?: Product | null; variant?: ProductVariant | null })[];
  payments?: Payment[];
  user?: User | null;
};

export type CategoryWithRelations = Category & {
  parent?: Category | null;
  children?: Category[];
  products?: Product[];
};
