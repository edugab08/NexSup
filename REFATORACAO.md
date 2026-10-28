# REFATORACAO.md — Atividade 2

Suíte: `front/cypress/e2e/nexsupport.cy.ts` — **mesmos 5 casos (CT01–CT05) e mesmas asserções da A1**; nenhum teste foi apagado.

## Smells: problema → solução

| # | Smell (onde / por que é problema) | Solução aplicada | Onde ficou |
|---|-----------------------------------|------------------|------------|
| 1 | **Seletores espalhados** — 16 `[data-cy=…]` dentro dos testes; mudar um seletor obrigava a editar vários testes | **Page Objects**, um por tela; os testes só chamam métodos. Nenhum seletor resta no `.cy.ts` | `support/pages/` (`LoginPage`, `DashboardPage`, `NovoChamadoPage`, `ToastComponent`) |
| 2 | **Passos duplicados** — login (4 chamadas), checagem de cookie (5x), checagem de `pathname` (9x) | **3 comandos**: `cy.loginComo()`, `cy.deveTerSessao()`, `cy.deveEstarEm()` | `support/commands.ts` |
| 3 | **Dados dentro do teste** — e-mail, senha, nome, título, descrição, mensagens | **Fixtures** JSON importadas pelos testes | `fixtures/usuarios.json`, `fixtures/chamados.json`, `fixtures/respostas/` |
| 4 | **Dependência do back-end e do seed** — CT02/CT04 quebravam por 429 de login, banco sujo ou API fora do ar | **Stubs `cy.intercept`**: **falha** (login 401, CT02) e **sucesso** (API de chamados em memória, CT04) | `support/stubs.ts` |
| 5 | **Dado não determinístico** — `Date.now()` no título do CT04 | Título fixo na fixture; a unicidade deixou de ser necessária porque a lista vem do stub (sempre começa igual) | `fixtures/chamados.json` |
| 6 | **Sem sincronia com a rede** — asserção dependia de a API responder dentro do timeout | `cy.wait('@alias')` em login (`@login`, `@loginInvalido`) e criação (`@criarChamado`), além do retry nativo das asserções | `support/commands.ts`, `e2e/nexsupport.cy.ts` |
| 7 | **Limpeza manual redundante** — `clearAllCookies`/`clearLocalStorage` no CT03 | Removido: o Cypress já isola o estado entre testes | `e2e/nexsupport.cy.ts` |
| 8 | **Arquivos-modelo do Cypress** (`commands.ts` comentado, `example.json`) | Substituídos por comandos/fixtures reais | `support/`, `fixtures/` |

> A A1 **não tinha `cy.wait(<ms>)`**. Para garantir que continue assim há `npm run check:esperas`, que falha se alguém introduzir uma espera fixa.

## Estabilidade — como conferir

Pré-requisitos iguais aos da A1 (API no ar, seed aplicado, `LOGIN_THROTTLE_LIMIT` alto no `back/.env`, pois CT01, CT04 e CT05 ainda fazem login real).

```
cd front
npm run build
npm run e2e:3x     # check:esperas + 3 execuções seguidas do e2e
```

Registre o resultado em `evidencias/` (print do terminal com as 3 execuções verdes).

## Decisões

- **Login real em CT01, CT04 e CT05.** CT01 e CT05 testam o fluxo de autenticação em si. No CT04 o login precisa ser real: um token falso faria o back-end responder 401 às demais chamadas da home (notificações), e o front trata 401 como sessão expirada.
- **Stub só onde há ganho.** Apenas CT02 (falha) e CT04 (sucesso) usam stub; CT03 não chama a API.
