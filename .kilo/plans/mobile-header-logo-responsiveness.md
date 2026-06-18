# Plano: Responsividade mobile do site principal (cabeçalho + refinamentos)

## Contexto / diagnóstico

O storefront `(storefront)` já é majoritariamente responsivo (rails horizontais no mobile,
grids que empilham, alvos de toque de 44px, overlays bem comportados). Os dois problemas
reportados pelo usuário convergem no **logo do cabeçalho no mobile**:

1. **Logo pequena no cabeçalho (mobile)** — `src/components/layout/header.tsx:141`
   renderiza `<Logo variant="compact" className="min-w-0 sm:hidden" />`. No
   `src/components/brand/logo.tsx` o variant `compact` usa ícone `h-9 w-9` (36px),
   bem menor que o desktop (`full` = `h-14 sm:h-16` = 56–64px).

2. **"Texto das bordadeiras não aparece" no mobile** — em `logo.tsx`:
   - variant `full` (nome "Bordadeiras" + tagline "de Serra Pelada") tem o span do
     texto com `hidden ... sm:flex` → **some no mobile**;
   - variant `compact` (mobile) mostra só "Bordadeiras" em `text-sm` (14px) com
     `truncate max-w-[120px] min-[375px]:max-w-[9rem]`, competindo espaço com os
     botões de busca/sacola/menu do header (`min-w-0`), ficando pequeno/truncado.

Decisões confirmadas com o usuário:
- Logo no mobile: **ícone maior + nome "Bordadeiras"** (sem tagline).
- Escopo: **foco no cabeçalho + refinamentos pontuais** (não reescrever tudo).

Assets de marca: `public/brand/logo.png` e `public/brand/logo-icon.png` são ambos
**500x500 (quadrados)** — então o "logo" é sempre ícone quadrado + wordmark em texto.

---

## Mudanças

### 1. Logo compacto (mobile) — `src/components/brand/logo.tsx`

Variant `compact` (usado no header mobile):
- Ícone: `h-9 w-9` → `h-11 w-11` (44px), mantendo `shrink-0 object-contain`.
- Wordmark: `text-sm` → `text-base` (16px) para clareza.
- Relaxar truncamento: trocar `max-w-[120px] min-[375px]:max-w-[9rem]` por
  `min-w-0` + `truncate` (ellipsis só como rede de segurança se faltar espaço),
  garantindo que "Bordadeiras" apareça inteiro na imensa maioria das telas.
- Manter `font-display font-semibold text-[var(--color-brown)]`.

> Não mexer no variant `full` (desktop) nem no `icon` (footer) para não regredir.

### 2. Cabeçalho — `src/components/layout/header.tsx`

a) **Espaçamento da linha principal (mobile):**
   - `flex min-w-0 items-center gap-1 sm:gap-3 lg:gap-6` → `gap-2 sm:gap-3 lg:gap-6`
     (mais respiro entre logo e botões no mobile).

b) **Utility bar (mobile) — manter links alcançáveis:**
   - A mensagem tem `min-w-0 shrink-0 truncate sm:max-w-[55%]`; com `shrink-0` uma
     mensagem longa empurra os links para fora (scroll horizontal). Trocar por
     `min-w-0 truncate max-w-[60%] sm:max-w-[55%]` (remover `shrink-0`, cap mobile).

c) Confirmar que o logo compacto maior + 3 botões (busca, sacola, menu) cabem em 320px:
   320 − 32(px-4) = 288; botões ≈ 3×36 + 2×8 = 124; logo (44 + 8 + ~95 do nome) ≈ 147;
   total ≈ 271 < 288. Cabe. (WhatsApp/Conta são `hidden sm:` no mobile.)

### 3. Refinamentos pontuais de mobile (home)

- **`src/components/home/about-snippet.tsx`** — bloco de stats:
  `grid-cols-3 gap-3 sm:gap-5` → `gap-2.5 sm:gap-5` (evita aperto em 320px);
  número `text-2xl sm:text-3xl` → `text-xl sm:text-3xl` (cabe melhor "5000+" em ~88px).
- **`src/components/home/trust-bar.tsx`** — item mobile `min-w-[78%]` → `min-w-[82%]`
  (mostra um pouco mais do próximo item no rail, indicando scroll).
- **`src/components/shop/product-card.tsx`** — preço `text-lg sm:text-xl` mantém; apenas
  garantir `tabular-nums` no preço para evitar tremor de layout em 2 colunas no mobile.
  (Ajuste mínimo; card já é responsivo.)

### 4. Seções já responsivas (sem alteração — apenas auditoria)

Confirmado que NÃO precisam de mudança: `hero.tsx` (aspect 4/3 mobile = ~281px de altura
em 375px, banner mobile dedicado), `categories-section.tsx` (rail `max-md:category-rail`),
`featured-products.tsx`/`product-grid.tsx` (grid 2 col mobile), `benefits.tsx` (empilha),
`section-header.tsx` (clamp), `category-nav-bar.tsx` (rail com snap + 44px), `footer.tsx`
(empilha + 44px nos links), `mobile-nav-sheet.tsx` (`w-[min(100vw,340px)]`).

---

## Validação

- `npm run lint` (eslint-config-next).
- `npm run build` (Next build) para checar tipos/SSR.
- Checagem visual manual em 375px e 320px (DevTools): logo com ícone 44px + "Bordadeiras"
  visível; utility bar sem scroll horizontal; stats e rail sem aperto.
- Sem testes unitários novos (alteração puramente visual/className).

## Arquivos a editar

1. `src/components/brand/logo.tsx` (variant compact)
2. `src/components/layout/header.tsx` (gap + utility bar)
3. `src/components/home/about-snippet.tsx` (stats)
4. `src/components/home/trust-bar.tsx` (item min-width)
5. `src/components/shop/product-card.tsx` (tabular-nums no preço)
