-- Ecommerce Bordadeiras — schema foundation (MySQL → PostgreSQL)
-- Mirrors prisma/migrations/20250601170000_foundation adapted for Supabase/Postgres

-- Enums (Prisma-compatible names)
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'BOLETO');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK');
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED');
CREATE TYPE "NotificationType" AS ENUM ('ORDER', 'PAYMENT', 'SHIPPING', 'PROMO', 'SYSTEM');
CREATE TYPE "TrackingStatus" AS ENUM ('LABEL_CREATED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'RETURNED');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'SETTINGS_CHANGE', 'EXPORT', 'IMPORT');

-- Auth (NextAuth)
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- Addresses
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT,
    "zipCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "country" VARCHAR(2) NOT NULL DEFAULT 'BR',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Address_userId_idx" ON "Address"("userId");
CREATE INDEX "Address_userId_isDefault_idx" ON "Address"("userId", "isDefault");

-- Catalog
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX "Category_active_idx" ON "Category"("active");

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "priceCents" INTEGER NOT NULL,
    "compareCents" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "images" JSONB,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_active_idx" ON "Product"("active");
CREATE INDEX "Product_status_idx" ON "Product"("status");

CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");
CREATE INDEX "ProductImage_productId_isPrimary_idx" ON "ProductImage"("productId", "isPrimary");

-- Orders & payments
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minCents" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_active_idx" ON "Coupon"("active");

CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "couponId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotalCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "shippingCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "shippingAddressId" TEXT,
    "shippingAddress" JSONB,
    "trackingCode" TEXT,
    "carrier" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "mercadoPagoId" TEXT,
    "mercadoPagoPrefId" TEXT,
    "externalReference" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_mercadoPagoId_key" ON "Payment"("mercadoPagoId");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

CREATE TABLE "Tracking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "TrackingStatus" NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "carrierEventCode" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tracking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Tracking_orderId_idx" ON "Tracking"("orderId");
CREATE INDEX "Tracking_orderId_occurredAt_idx" ON "Tracking"("orderId", "occurredAt");

-- Blog
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

CREATE TABLE "BlogTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlogTag_slug_key" ON "BlogTag"("slug");

CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "categoryId" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_published_idx" ON "BlogPost"("published");
CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

CREATE TABLE "BlogPostTag" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "BlogPostTag_pkey" PRIMARY KEY ("postId", "tagId")
);

-- Notifications & templates
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailTemplate_key_key" ON "EmailTemplate"("key");

-- Platform
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT DEFAULT 'general',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
CREATE INDEX "Setting_group_idx" ON "Setting"("group");

CREATE TABLE "WhatsappRecipient" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "phone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappRecipient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WhatsappRecipient_active_idx" ON "WhatsappRecipient"("active");

CREATE TABLE "WhatsappSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL DEFAULT 'default',
    "creds" JSONB,
    "keys" JSONB,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "qrCode" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsappSession_sessionId_key" ON "WhatsappSession"("sessionId");

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Foreign keys
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressId_fkey"
    FOREIGN KEY ("shippingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Tracking" ADD CONSTRAINT "Tracking_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "BlogTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
