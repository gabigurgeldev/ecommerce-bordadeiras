# Plano de Melhoria: Sistema de Banners com Upload Direto

## Resumo

Melhorar o sistema de banners do e-commerce para:
1. **Remover a necessidade de URL manual** - Upload direto de arquivo
2. **Corrigir erros no upload** - Investigar e resolver problemas
3. **Adicionar especificações de tamanho** - Informar tamanhos ideais para desktop e mobile

---

## Análise do Estado Atual

### Arquitetura do Sistema de Banners

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE BANNERS ATUAL                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐         ┌─────────────────┐                   │
│  │  Admin Form     │────────▶│  URL Input      │                   │
│  │  (banner-form-  │         │  (Manual)       │                   │
│  │   dialog.tsx)   │         └────────┬────────┘                   │
│  └────────┬────────┘                  │                           │
│           │                           ▼                           │
│           │                  ┌─────────────────┐                  │
│           │                  │  Upload File    │                  │
│           │                  │  (Opcional)     │                  │
│           │                  └────────┬────────┘                  │
│           │                           │                          │
│           └───────────────────────────┘                          │
│                                     │                            │
│                                     ▼                            │
│                          ┌─────────────────┐                    │
│                          │  Supabase       │                    │
│                          │  Storage        │                    │
│                          │  (banners)      │                    │
│                          └─────────────────┘                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Componentes Principais

| Componente | Arquivo | Função |
|------------|---------|--------|
| Formulário de Banner | `src/components/admin/banner-form-dialog.tsx` | Wizard de 4 passos para criar/editar banners |
| Schema de Validação | `src/lib/validations/admin.ts` | Validação Zod (bannerSchema) |
| Storage Helper | `src/lib/storage.ts` | Funções de upload, delete, URL pública |
| Upload Via API | `src/lib/upload-via-api.ts` | Client-side upload usando API |
| API Upload Direto | `src/app/api/uploads/direct/route.ts` | Server-side upload handler |

### Fluxo de Upload Atual

1. **Usuário seleciona arquivo** no input de upload
2. **uploadImageViaApi** é chamada com file, kind="banner", entityId
3. **API /api/uploads/direct** recebe FormData com arquivo
4. **uploadFile** em storage.ts faz upload para Supabase
5. **URL pública** é retornada e setada no form

### Campos do Schema de Banner

```typescript
export const bannerSchema = z.object({
  title: z.string().min(2, "Título interno obrigatório"),
  imageUrl: z.string().url("URL da imagem inválida"),  // ← OBRIGATÓRIO
  link: optionalBannerLink,  // opcional
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});
```

### Proporção e Tamanhos Atuais

| Contexto | Proporção | Tamanho |
|----------|-----------|---------|
| Hero Component | 21:9 | Min 220px / Max 480px altura |
| Preview Admin | 21:9 | 180px largura |
| Thumbnail Banner | 21:9 | Full width |
| Formato aceito | - | JPEG, PNG, WebP, GIF |
| Tamanho máximo | - | 8MB |

---

## Problemas Identificados

### 1. UX Ruim - Campo URL Obrigatório

**Problema:** O formulário requer que o usuário preencha uma URL de imagem manualmente, mesmo fazendo upload do arquivo.

**Localização:**
```typescript
// banner-form-dialog.tsx - linhas 204-213
<div className="space-y-1">
  <Label htmlFor="banner-image-url">URL da imagem</Label>
  <Input
    id="banner-image-url"
    {...form.register("imageUrl")}
    placeholder="https://..."
  />
  // ...
</div>
```

**Impacto:** O usuário precisa preencher duas vezes - faz upload e ainda precisa colar a URL.

### 2. Upload Pode Estar com Erro

**Possíveis Causas:**
- **Bucket não existe:** O bucket "banners" pode não estar criado no Supabase
- **Permissões:** RLS policies podem estar bloqueando upload
- **Tamanho do arquivo:** Arquivos > 8MB são rejeitados
- **Tipo de arquivo:** Apenas JPEG, PNG, WebP, GIF são aceitos
- **CORS:** Problemas de CORS no Supabase Storage

**Código de Upload:**
```typescript
// upload-via-api.ts
export async function uploadImageViaApi(
  file: File,
  kind: "product" | "banner" | "category",
  entityId: string,
): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);
  formData.append("entityId", entityId);

  const res = await fetch("/api/uploads/direct", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.url ?? null;
}
```

### 3. Falta Especificações de Tamanho Claras

**Problema:** Apenas mostra "Proporção recomendada 21:9" sem detalhes sobre:
- Tamanho ideal em pixels para desktop
- Tamanho ideal em pixels para mobile
- Diferenças entre dispositivos
- Como a imagem é cortada em diferentes telas

**Localização Atual:**
```typescript
// banner-form-dialog.tsx - linha 238-240
<p className="text-xs text-muted-foreground">
  Proporção recomendada 21:9 — JPEG, PNG, WebP ou GIF.
</p>
```

---

## Soluções Propostas

### 1. Melhorar UX - Upload Direto (Sem URL Manual)

**Objetivo:** O usuário deve apenas fazer upload do arquivo, sem precisar preencher URL.

**Mudanças:**

a) **Remover campo URL obrigatório do formulário** ou torná-lo opcional/hidden

b) **Melhorar o componente de upload** para:
- Mostrar preview da imagem selecionada
- Mostrar progresso de upload
- Validar tamanho e formato antes de enviar
- Mostrar erro claro se falhar

c) **Atualizar schema de validação** para tornar imageUrl opcional no form (mas required no banco após upload)

**Implementação:**

```typescript
// Novo componente de upload com preview
// Em banner-form-dialog.tsx, substituir o input de upload atual por:

<div className="space-y-3">
  <Label>Imagem do banner</Label>
  
  {/* Área de upload com drag & drop */}
  <div 
    className={cn(
      "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
      dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
    )}
    onDragEnter={handleDrag}
    onDragLeave={handleDrag}
    onDragOver={handleDrag}
    onDrop={handleDrop}
    onClick={() => fileInputRef.current?.click()}
  >
    <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      accept="image/jpeg,image/png,image/webp,image/gif"
      onChange={handleFileSelect}
    />
    
    {uploading ? (
      <div className="space-y-2">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Enviando imagem...</p>
        <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
      </div>
    ) : imageUrl ? (
      <div className="space-y-2">
        <div className="relative w-full aspect-[21/9] max-h-[200px] rounded-md overflow-hidden mx-auto">
          <Image
            src={imageUrl}
            alt="Preview do banner"
            fill
            className="object-cover"
          />
        </div>
        <p className="text-sm text-muted-foreground">Clique para trocar a imagem</p>
      </div>
    ) : (
      <div className="space-y-2">
        <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/50" />
        <p className="text-sm font-medium">Clique ou arraste uma imagem aqui</p>
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP ou GIF (max 8MB)</p>
      </div>
    )}
  </div>
  
  {/* Informações de tamanho */}
  <div className="bg-muted/50 rounded-md p-3 text-xs space-y-1">
    <p className="font-medium text-foreground">Tamanhos recomendados:</p>
    <ul className="text-muted-foreground space-y-0.5">
      <li>• Desktop: 1920 x 823 pixels (21:9)</li>
      <li>• Mobile: 768 x 329 pixels (21:9)</li>
      <li>• Formatos: JPEG, PNG, WebP, GIF</li>
      <li>• Tamanho máximo: 8MB</li>
    </ul>
  </div>
</div>
```

### 2. Corrigir Erros de Upload

**Investigação e Soluções:**

a) **Verificar Bucket no Supabase:**
- Bucket "banners" deve existir
- Deve ter RLS policies configuradas para upload

b) **Melhorar Tratamento de Erros no Upload:**

```typescript
// Em upload-via-api.ts, melhorar a função:

export async function uploadImageViaApi(
  file: File,
  kind: "product" | "banner" | "category",
  entityId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string | null; error: string | null }> {
  // Validações antes de enviar
  const maxSize = 8 * 1024 * 1024; // 8MB
  if (file.size > maxSize) {
    return { url: null, error: `Arquivo muito grande. Máximo: 8MB (tamanho atual: ${(file.size / 1024 / 1024).toFixed(2)}MB)` };
  }
  
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return { url: null, error: `Formato não suportado. Use: JPEG, PNG, WebP ou GIF (formato atual: ${file.type})` };
  }
  
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    formData.append("entityId", entityId);
    
    const res = await fetch("/api/uploads/direct", {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Erro ${res.status}: Falha no upload`;
      return { url: null, error: errorMessage };
    }
    
    const json = await res.json();
    return { url: json.url ?? null, error: null };
  } catch (err) {
    console.error("Upload error:", err);
    return { url: null, error: err instanceof Error ? err.message : "Erro desconhecido ao fazer upload" };
  }
}
```

c) **Melhorar API de Upload no Servidor:**

```typescript
// Em src/app/api/uploads/direct/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { uploadFile, bucketForKind, buildBannerImageKey, buildProductImageKey, buildCategoryImageKey } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

const uploadSchema = z.object({
  kind: z.enum(["product", "banner", "category"]),
  entityId: z.string().min(1),
});

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const limit = await rateLimit({ key: "upload", limit: 10, window: 60 });
    if (!limit.success) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns segundos." },
        { status: 429 }
      );
    }
    
    const formData = await req.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");
    const entityId = formData.get("entityId");
    
    // Validação de parâmetros
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado ou arquivo inválido" },
        { status: 400 }
      );
    }
    
    if (!kind || !entityId) {
      return NextResponse.json(
        { error: "Parâmetros kind e entityId são obrigatórios" },
        { status: 400 }
      );
    }
    
    const validation = uploadSchema.safeParse({ kind, entityId });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Parâmetros inválidos", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    // Validação de tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: 8MB (tamanho atual: ${(file.size / 1024 / 1024).toFixed(2)}MB)` },
        { status: 400 }
      );
    }
    
    // Validação de tipo MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Formato não suportado. Use: JPEG, PNG, WebP ou GIF (formato atual: ${file.type})` },
        { status: 400 }
      );
    }
    
    // Gera chave do arquivo
    let key: string;
    switch (validation.data.kind) {
      case "banner":
        key = buildBannerImageKey(validation.data.entityId, file.name);
        break;
      case "product":
        key = buildProductImageKey(validation.data.entityId, file.name);
        break;
      case "category":
        key = buildCategoryImageKey(validation.data.entityId, file.name);
        break;
      default:
        throw new Error("Tipo de upload desconhecido");
    }
    
    // Upload do arquivo
    const bucket = bucketForKind(validation.data.kind);
    const arrayBuffer = await file.arrayBuffer();
    const body = Buffer.from(arrayBuffer);
    
    const url = await uploadFile({
      bucket,
      path: key,
      body,
      contentType: file.type,
      upsert: true,
    });
    
    return NextResponse.json({ url });
    
  } catch (error) {
    console.error("Upload error:", error);
    
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    
    return NextResponse.json(
      { error: `Falha no upload: ${message}` },
      { status: 500 }
    );
  }
}
```

### 3. Adicionar Informações de Tamanho

**Criar componente de informações de tamanho:**

```typescript
// src/components/admin/banner-size-info.tsx

import { Monitor, Smartphone, Info } from "lucide-react";

export function BannerSizeInfo() {
  return (
    <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Info className="h-4 w-4 text-primary" />
        <span>Tamanhos recomendados para melhor qualidade</span>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-background rounded-md">
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium">Desktop</p>
            <p className="text-xs text-muted-foreground">
              1920 x 823 pixels (21:9)
            </p>
            <p className="text-xs text-muted-foreground">
              Tela grande: 2560 x 1097 pixels
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-background rounded-md">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium">Mobile</p>
            <p className="text-xs text-muted-foreground">
              768 x 329 pixels (21:9)
            </p>
            <p className="text-xs text-muted-foreground">
              Proporção mantida em todas as telas
            </p>
          </div>
        </div>
      </div>
      
      <div className="pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          <strong>Dica:</strong> A imagem mantém a proporção 21:9 em todos os dispositivos. 
          O sistema ajusta automaticamente para cobrir toda a área sem distorcer.
        </p>
      </div>
    </div>
  );
}
```

### 4. Melhorar Componente de Upload

**Criar novo componente de upload com preview:**

```typescript
// src/components/admin/banner-upload-area.tsx

"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadImageViaApi } from "@/lib/upload-via-api";

interface BannerUploadAreaProps {
  value: string | null;
  onChange: (url: string | null) => void;
  entityId: string;
  disabled?: boolean;
}

export function BannerUploadArea({
  value,
  onChange,
  entityId,
  disabled = false,
}: BannerUploadAreaProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSize = 8 * 1024 * 1024; // 8MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (file.size > maxSize) {
      return `Arquivo muito grande. Máximo: 8MB (tamanho atual: ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }

    if (!allowedTypes.includes(file.type)) {
      return `Formato não suportado. Use: JPEG, PNG, WebP ou GIF`;
    }

    return null;
  };

  const handleUpload = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadImageViaApi(file, "banner", entityId);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.error) {
        toast.error(`Falha no upload: ${result.error}`);
        onChange(null);
      } else if (result.url) {
        toast.success("Imagem enviada com sucesso!");
        onChange(result.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao fazer upload da imagem");
      onChange(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleUpload(file);
    }
    // Reset input para permitir selecionar mesmo arquivo novamente
    e.target.value = "";
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || uploading) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleUpload(file);
    }
  }, [disabled, uploading]);

  const handleRemove = useCallback(() => {
    onChange(null);
    toast.info("Imagem removida");
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-all",
          dragActive && "border-primary bg-primary/5 scale-[1.02]",
          !dragActive && !disabled && "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed",
          value && !uploading && "p-4"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Enviando imagem...</p>
              <div className="w-full max-w-[200px] mx-auto h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          </div>
        ) : value ? (
          <div className="space-y-3">
            <div className="relative w-full aspect-[21/9] max-h-[200px] rounded-lg overflow-hidden mx-auto">
              <Image
                src={value}
                alt="Preview do banner"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <p className="text-sm text-muted-foreground">Clique para trocar a imagem</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Clique ou arraste uma imagem aqui</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP ou GIF (max 8MB)</p>
          </div>
        )}
      </div>

      {value && !uploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
        >
          <X className="h-3 w-3" />
          Remover imagem
        </button>
      )}
    </div>
  );
}
```

---

## Implementação Passo a Passo

### Fase 1: Preparação e Correções (Prioridade Alta)

1. **Verificar e configurar bucket no Supabase**
   - Criar bucket "banners" se não existir
   - Configurar RLS policies para permitir upload
   - Verificar CORS settings

2. **Corrigir upload-via-api.ts**
   - Melhorar tratamento de erros
   - Retornar objeto com url e error
   - Adicionar validações client-side

3. **Corrigir API de upload**
   - Adicionar validações de tamanho e tipo
   - Melhorar mensagens de erro
   - Adicionar logs para debugging

### Fase 2: Melhorar UX (Prioridade Média)

4. **Criar componente BannerUploadArea**
   - Upload com drag & drop
   - Preview da imagem
   - Progresso de upload
   - Validações visuais

5. **Criar componente BannerSizeInfo**
   - Mostrar tamanhos recomendados
   - Desktop e Mobile
   - Formatos aceitos

6. **Atualizar banner-form-dialog.tsx**
   - Integrar novos componentes
   - Remover campo URL obrigatório
   - Melhorar fluxo de upload

### Fase 3: Testes e Validação (Prioridade Alta)

7. **Testar upload de diferentes tamanhos**
   - Arquivos pequenos (< 1MB)
   - Arquivos médios (1-5MB)
   - Arquivos grandes (5-8MB)
   - Arquivos muito grandes (> 8MB - deve falhar)

8. **Testar diferentes formatos**
   - JPEG
   - PNG
   - WebP
   - GIF
   - Formatos inválidos (devem falhar)

9. **Testar responsividade**
   - Desktop
   - Tablet
   - Mobile

---

## Arquivos a Serem Modificados

| Arquivo | Modificação | Prioridade |
|---------|-------------|------------|
| `src/lib/upload-via-api.ts` | Melhorar tratamento de erros e retorno | Alta |
| `src/app/api/uploads/direct/route.ts` | Melhorar validações e mensagens de erro | Alta |
| `src/components/admin/banner-upload-area.tsx` | Criar novo componente (novo arquivo) | Média |
| `src/components/admin/banner-size-info.tsx` | Criar novo componente (novo arquivo) | Média |
| `src/components/admin/banner-form-dialog.tsx` | Integrar novos componentes e melhorar UX | Média |

---

## Considerações Finais

### Tamanhos Recomendados para Implementação

**Desktop:**
- Padrão: 1920 x 823 pixels (21:9)
- Tela grande: 2560 x 1097 pixels

**Mobile:**
- Padrão: 768 x 329 pixels (21:9)

**Notas:**
- A proporção 21:9 é mantida em todos os dispositivos
- O sistema usa `object-fit: cover` para cobrir toda a área
- Imagens muito grandes são automaticamente otimizadas
- O tamanho máximo de arquivo é 8MB

### Testes Importantes

Antes de finalizar, testar:
1. Upload de arquivo grande (> 8MB deve falhar com mensagem clara)
2. Upload de formato inválido (deve falhar)
3. Upload bem-sucedido (deve mostrar preview)
4. Remoção de imagem (deve limpar o campo)
5. Troca de imagem (deve substituir a anterior)
6. Visualização em diferentes telas
