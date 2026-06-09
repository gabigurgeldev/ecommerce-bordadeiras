# Melhorias: Auth, Sacola, Conta, Popups e Busca

## Bugs corrigidos

1. **Header permanecia em "Entrar" após login** — `refresh()` em `session-provider.tsx` agora prioriza `/api/auth/me` (cookies HttpOnly) antes do client Supabase.
2. **Login no checkout não atualizava o header** — `checkout-identify-form.tsx` chama `refresh()` + `router.refresh()`; `checkout-login` retorna redirect em JSON.
3. **E-mail não verificado deixava cookies ativos** — `authenticate-user.ts` executa `signOut()` antes de retornar erro de verificação.
4. **Hook `use-debounce` ausente** — criado em `src/lib/hooks/use-debounce.ts`.

## Novas funcionalidades

### Autenticação
- `AccountMenu` migrado para Radix `DropdownMenu` com acessibilidade (Escape, foco, ARIA).

### Sacola
- Tabela `CartItem` + sync servidor para usuários logados.
- `CartSyncProvider` faz merge guest + servidor no login e sync debounced (500ms).
- Popup redesenhado com `StorefrontSheet`: preço unitário, subtotal por item, frete estimado, CTAs.

### Área do usuário
- `/conta/pedidos` — lista real via `fetchUserOrders`.
- `/conta/pedidos/[id]` — detalhe com rastreamento e endereço.
- `/conta` — perfil editável.
- `/conta/enderecos` — CRUD de endereços.
- `/conta/notificacoes` — preferências JSON em `User.notificationPrefs`.
- `/conta/pagamentos` — cartões salvos via Mercado Pago Vault.
- `/conta/senha` — alteração de senha via Supabase Auth.

### Popups padronizados
- `StorefrontSheet`, `dropdown-menu`, menu mobile em Sheet, vídeo em Dialog Radix.

### Busca
- API estendida: nome/descrição/marca, filtros preço/estoque/categoria.
- Autocomplete com combobox ARIA, histórico local, Ctrl+K, busca por voz.
- Filtros alinhados em `/loja` via `ShopFilters`.

## Migrations

- `20250610100000_user_cart.sql` — `CartItem`
- `20250610110000_user_preferences.sql` — `notificationPrefs`, `mercadoPagoCustomerId`
- `20250610120000_saved_cards.sql` — `SavedCard`

## Testes

```bash
npm run test:run
```

Cobertura: `use-debounce`, `cart-merge`, `useCartStore`, `search-history`.

## Checklist manual (dev / homolog / prod)

- [ ] Login → header mostra nome imediatamente
- [ ] Reload → sessão persiste
- [ ] Login checkout → header atualiza
- [ ] Sacola guest → login → merge com servidor
- [ ] Pedidos reais em `/conta/pedidos`
- [ ] Cartão salvo via MP (requer HTTPS + credenciais)
- [ ] Busca: sugestões, filtros, Ctrl+K, voz (Chrome)
- [ ] Popups: Escape, clique fora

## Checklist WCAG

- Contraste em popups e sugestões
- Labels/`aria-label` em controles
- `aria-live="polite"` nos resultados de busca
- `aria-pressed` no botão de voz
- Focus trap nos modais Radix

## Limitações conhecidas

- **Filtro por avaliação**: não há sistema de reviews; item futuro.
- **MP Vault**: requer credenciais MP e HTTPS em produção.
- **Busca por voz**: depende de `SpeechRecognition` (Chrome/Edge).
