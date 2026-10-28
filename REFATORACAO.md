# REFATORACAO.md — Atividade 2

Suíte: `front/cypress/e2e/nexsupport.cy.ts` (CT01–CT05, mesma cobertura da A1).

## Diagnóstico de smells (antes da refatoração)

| # | Smell | Onde | Por que é problema |
|---|-------|------|--------------------|
| 1 | Seletores `[data-cy=...]` espalhados | 16 ocorrências (`[data-cy=`) em CT01–CT05 | Se um `data-cy` mudar, é preciso caçar o texto em todos os testes |
| 2 | Passos duplicados | login (4 chamadas), checagem de cookie (5x), checagem de `pathname` (9x) | Mudança de fluxo exige editar vários lugares; o teste fica longo e ruidoso |
| 3 | Dados dentro do teste | e-mail, senha, nome, título e descrição do chamado, mensagem de erro | Não dá para reaproveitar nem trocar massa de dados sem mexer no código |
| 4 | Dependência do back-end real e do seed | CT02 e CT04 | Teste falha por 429 (limite de login), banco sujo ou API fora do ar, sem a UI ter defeito; o caminho de falha da API só funciona se houver um usuário real |
| 5 | Dado não determinístico | CT04: `Date.now()` no título | Resultado muda a cada execução e a lista cresce a cada run |
| 6 | Sem sincronia explícita com a rede | CT01, CT04, CT05 | A asserção depende de a API responder dentro do timeout (10 s); é a causa clássica de teste intermitente |
| 7 | Estado manual desnecessário | CT03: `clearAllCookies` / `clearLocalStorage` | O Cypress já limpa o estado entre testes; o código duplica o que o runner faz |
| 8 | Arquivos de exemplo do Cypress | `commands.ts`, `fixtures/example.json` | Ruído; nenhum comando ou fixture real |

> Obs.: a A1 **não tinha `cy.wait(<ms>)`**. O risco de instabilidade vinha dos itens 4–6 (rede, throttle e dado dinâmico).
