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
};

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minCents: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId: string | null;
  couponId: string | null;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  shippingAddressId: string | null;
  shippingAddress: JsonValue | null;
  trackingCode: string | null;
  carrier: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  priceCents: number;
};

export type Payment = {
  id: string;
  orderId: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amountCents: number;
  mercadoPagoId: string | null;
  mercadoPagoPrefId: string | null;
  externalReference: string | null;
  metadata: JsonValue | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Tracking = {
  id: string;
  orderId: string;
  status: TrackingStatus;
  description: string | null;
  location: string | null;
  carrierEventCode: string | null;
  occurredAt: Date;
  createdAt: Date;
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

export type BlogPostTag = {
  postId: string;
  tagId: string;
};

export type Notification = {
  id: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  metadata: JsonValue | null;
  createdAt: Date;
};

export type EmailTemplate = {
  id: string;
  key: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Setting = {
  id: string;
  key: string;
  value: string;
  group: string | null;
  updatedAt: Date;
};

export type StorefrontBanner = {
  id: string;
  title: string;
  imageUrl: string;
  link: string | null;
  sortOrder: number;
  active: boolean;
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

export type WhatsappRecipient = {
  id: string;
  label: string | null;
  phone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type WhatsappSession = {
  id: string;
  sessionId: string;
  creds: JsonValue | null;
  keys: JsonValue | null;
  status: string;
  qrCode: string | null;
  updatedAt: Date;
  createdAt: Date;
};

export type AuditLog = {
  id: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  userId: string | null;
  userEmail: string | null;
  metadata: JsonValue | null;
  ipAddress: string | null;
  createdAt: Date;
};

/** Product with relations for admin/storefront mappers */
export type ProductWithRelations = Product & {
  category: Category | null;
  productImages: ProductImage[];
};

export type CategoryWithCount = Category & {
  _count?: { products: number };
};
