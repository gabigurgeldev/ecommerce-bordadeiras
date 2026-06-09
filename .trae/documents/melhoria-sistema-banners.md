# Plano: Melhoria do Sistema de Banners

## Resumo
Melhorar o sistema de gerenciamento de banners para:
1. Remover a necessidade de inserir URL manualmente (apenas upload)
2. Corrigir erros no upload de imagens
3. Adicionar informações claras sobre tamanhos ideais para desktop e mobile
4. Suportar imagens diferentes para desktop e mobile (responsive)

---

## Estado Atual

### Componentes Existentes
- `banner-form-dialog.tsx` - Wizard de 4 passos para criar/editar banners
- `banners-table.tsx` - Tabela de listagem de banners
- `hero.tsx` - Componente de exibição dos banners na home
- `upload-via-api.ts` - Helper para upload de imagens
- API `/api/uploads/direct` - Endpoint de upload

### Schema Atual (bannerSchema)
```typescript
{
  title: string (min 2 chars)
  imageUrl: string (URL válida)
  link: string opcional (URL ou path)
  sortOrder: number
  active: boolean
}
```

### Problemas Identificados
1. **Campo URL obrigatório**: O usuário precisa preencher manualmente ou fazer upload separado
2. **Upload pode estar falhando**: Necessário verificar logs e tratamento de erros
3. **Falta informações de tamanho**: Usuário não sabe qual dimensão usar
4. **Uma imagem só**: Não tem separação desktop/mobile

---

## Mudanças Propostas

### 1. Schema do Banner (Nova Estrutura)

**Migration SQL:**
```sql
-- Adicionar novas colunas para suportar imagens responsive
ALTER TABLE "StorefrontBanner" 
ADD COLUMN IF NOT EXISTS "desktopImageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "mobileImageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "altText" TEXT;

-- Migrar dados existentes (imageUrl -> desktopImageUrl)
UPDATE "StorefrontBanner" 
SET "desktopImageUrl" = "imageUrl" 
WHERE "desktopImageUrl" IS NULL;

-- Remover coluna antiga (depois de migrar)
-- ALTER TABLE "StorefrontBanner" DROP COLUMN "imageUrl";
```

**Novo Schema TypeScript:**
```typescript
export const bannerSchema = z.object({
  title: z.string().min(2, "Título interno obrigatório"),
  desktopImageUrl: z.string().url("Imagem para desktop é obrigatória"),
  mobileImageUrl: z.string().url().optional().or(z.literal("")),
  altText: z.string().max(200).optional().or(z.literal("")),
  link: z.string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.startsWith("/") || /^https?:\/\//i.test(val),
      "Link: use URL (https://) ou caminho (/loja)",
    ),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});
```

### 2. Componente de Upload com Dropzone

**Novo Componente: `ImageUploadField.tsx`**

```typescript
"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon, AlertCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadImageViaApi } from "@/lib/upload-via-api";

interface ImageUploadFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  entityId: string;
  kind: "banner" | "product" | "category";
  recommendedSize?: {
    width: number;
    height: number;
    label: string;
  };
  aspectRatio?: string;
  required?: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function ImageUploadField({
  label,
  description,
  value,
  onChange,
  entityId,
  kind,
  recommendedSize,
  aspectRatio = "21/9",
  required = false,
  error,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validações
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error("Arquivo muito grande. Tamanho máximo: 8MB.");
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        // Simular progresso
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const url = await uploadImageViaApi(file, kind, entityId);

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (url) {
          onChange(url);
          toast.success("Imagem enviada com sucesso!");
        } else {
          toast.error("Falha ao enviar imagem. Tente novamente.");
        }
      } catch (err) {
        console.error("Erro no upload:", err);
        toast.error("Erro ao enviar imagem. Verifique sua conexão e tente novamente.");
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [kind, entityId, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
          {label}
        </Label>
        {recommendedSize && (
          <span className="text-xs text-muted-foreground">
            Tamanho ideal: {recommendedSize.label}
          </span>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {value ? (
        <div className="relative overflow-hidden rounded-lg border bg-muted/30">
          <div
            className={cn(
              "relative w-full overflow-hidden",
              aspectRatio && `aspect-[${aspectRatio}]`
            )}
            style={{ aspectRatio }}
          >
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 560px"
              unoptimized={value.startsWith("http://localhost")}
            />
          </div>
          <div className="absolute right-2 top-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "relative cursor-pointer rounded-lg border-2 border-dashed transition-colors",
            "flex flex-col items-center justify-center gap-3 p-6",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            uploading && "pointer-events-none opacity-60"
          )}
          style={{ aspectRatio }}
        >
          <input {...getInputProps()} />

          {uploading ? (
            <>
              <div className="relative h-12 w-12">
                <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${uploadProgress}, 100`}
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-medium">Enviando...</p>
                <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-muted p-3">
                {isDragActive ? (
                  <Upload className="h-6 w-6 text-primary" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="font-medium">
                  {isDragActive
                    ? "Solte a imagem aqui"
                    : "Clique ou arraste uma imagem"}
                </p>
                <p className="text-sm text-muted-foreground">
                  JPEG, PNG, WebP ou GIF até 8MB
                </p>
              </div>
              {recommendedSize && (
                <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                  <AlertCircle className="h-3 w-3" />
                  <span>Tamanho ideal: {recommendedSize.label}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
```

### 3. Atualização do Banner Form Dialog

**Arquivo:** `src/components/admin/banner-form-dialog.tsx`

**Mudanças principais:**
- Substituir campo URL por componente ImageUploadField
- Adicionar upload separado para desktop e mobile
- Adicionar texto alternativo (alt text)
- Adicionar info sobre tamanhos ideais

```typescript
// Novo schema atualizado
const bannerSchema = z.object({
  title: z.string().min(2, "Título interno obrigatório"),
  desktopImageUrl: z.string().url("Imagem para desktop é obrigatória"),
  mobileImageUrl: z.string().url().optional().or(z.literal("")),
  altText: z.string().max(200).optional().or(z.literal("")),
  link: optionalBannerLink,
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});
```

### 4. Atualização do Hero Component

**Arquivo:** `src/components/home/hero.tsx`

**Mudanças:**
- Adicionar suporte a imagens responsive (desktop/mobile)
- Usar `<picture>` element ou `srcSet` para carregar imagem correta baseada no viewport
- Adicionar alt text dos banners

```typescript
// Exemplo de implementação responsive
<picture>
  <source
    media="(max-width: 768px)"
    srcSet={banner.mobileImageUrl || banner.desktopImageUrl}
  />
  <Image
    src={banner.desktopImageUrl}
    alt={banner.altText || banner.title}
    fill
    className="object-cover"
    priority={index === 0}
  />
</picture>
```

### 5. Migration do Banco de Dados

**Arquivo:** `supabase/migrations/20250606_update_banners.sql`

```sql
-- Adicionar novas colunas para imagens responsive
ALTER TABLE "StorefrontBanner" 
ADD COLUMN IF NOT EXISTS "desktopImageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "mobileImageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "altText" TEXT;

-- Migrar dados existentes
UPDATE "StorefrontBanner" 
SET "desktopImageUrl" = "imageUrl"
WHERE "desktopImageUrl" IS NULL;

-- Tornar desktopImageUrl obrigatório
ALTER TABLE "StorefrontBanner" 
ALTER COLUMN "desktopImageUrl" SET NOT NULL;

-- Remover coluna antiga (após migração bem sucedida)
-- ALTER TABLE "StorefrontBanner" DROP COLUMN "imageUrl";
```

### 6. Atualização do Tipo TypeScript

**Arquivo:** `src/lib/types/database.ts`

Adicionar/atualizar tipo StorefrontBanner:

```typescript
export type StorefrontBanner = {
  id: string;
  title: string;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  altText: string | null;
  link: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Campo legado (deprecated)
  imageUrl?: string;
};
```

---

## Arquivos a Modificar

| # | Arquivo | Tipo | Descrição |
|---|---------|------|-----------|
| 1 | `src/lib/validations/admin.ts` | Modificar | Atualizar bannerSchema com novos campos |
| 2 | `src/components/admin/banner-form-dialog.tsx` | Modificar | Substituir URL por upload com dropzone |
| 3 | `src/components/home/hero.tsx` | Modificar | Adicionar suporte a imagens responsive |
| 4 | `src/lib/types/database.ts` | Modificar | Atualizar tipo StorefrontBanner |
| 5 | `supabase/migrations/20250606_update_banners.sql` | Criar | Migration para novas colunas |
| 6 | `src/components/admin/ImageUploadField.tsx` | Criar | Componente de upload com dropzone |
| 7 | `src/actions/admin/banners.ts` | Modificar | Atualizar para novos campos |
| 8 | `src/lib/data/banners.ts` | Modificar | Atualizar query para novos campos |

---

## Especificações de Tamanho de Imagem

### Desktop
- **Proporção:** 21:9 (ultrawide)
- **Tamanho recomendado:** 1920 x 823 pixels
- **Largura mínima:** 1200 pixels
- **Formato:** JPEG, PNG, WebP
- **Tamanho máximo:** 8MB

### Mobile
- **Proporção:** 16:9
- **Tamanho recomendado:** 750 x 422 pixels
- **Largura mínima:** 375 pixels
- **Formato:** JPEG, PNG, WebP
- **Tamanho máximo:** 4MB

### Recomendações
- Use imagens otimizadas (TinyPNG, Squoosh)
- Prefira WebP para melhor compressão
- Mantenha texto em imagens minimal (pode ser cortado em mobile)
- Teste em diferentes tamanhos de tela

---

## Verificação Pós-Implementação

1. [ ] Criar banner com upload de imagem desktop
2. [ ] Criar banner com upload de ambas as imagens (desktop + mobile)
3. [ ] Verificar se o banner aparece corretamente na home
4. [ ] Testar visualização em mobile (imagem mobile deve aparecer)
5. [ ] Testar validação (tentar salvar sem imagem desktop)
6. [ ] Verificar mensagens de erro amigáveis
7. [ ] Testar edição de banner existente
8. [ ] Verificar exclusão de banner
