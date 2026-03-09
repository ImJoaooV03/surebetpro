# Arquitetura do Sistema: Surebet Scanner Platform

## 1. Visão Geral
Plataforma SaaS B2B/B2C para detecção de arbitragem em apostas esportivas (Surebets). O sistema varre continuamente a Odds API, focado nas casas **Superbet** e **Novibet**, processa as odds através de um motor de cálculo matemático e exibe oportunidades de lucro garantido em tempo real.

## 2. Estratégia de Contenção de API (100 req/h)
Devido ao limite estrito do plano Free da Odds API, a arquitetura implementa um **Smart Scanner Scheduler**:
- **Taxa de Consumo:** 1 requisição a cada 36 segundos (1.6 req/min).
- **Priorização (Triage):**
  1. O sistema faz 1 requisição diária para mapear todos os esportes e ligas ativos.
  2. O sistema filtra eventos que começam nas próximas 24 horas.
  3. A fila de requisições consome o endpoint `/odds` filtrando por `regions=eu` e `bookmakers=superbet,novibet`.
- **Deduplicação e Cache:** Resultados são cacheados no Redis/PostgreSQL. Se um evento já foi escaneado nos últimos 15 minutos e não está prestes a começar, ele é ignorado na próxima rodada.

## 3. Stack Tecnológico
- **Frontend:** React, Vite, TypeScript, TailwindCSS, Recharts (Gráficos).
- **Backend:** Node.js, TypeScript, Express/Fastify.
- **Banco de Dados:** PostgreSQL (via Prisma ORM).
- **Filas/Workers:** BullMQ + Redis (para agendamento de varredura).

## 4. Normalização de Dados
O motor de normalização (`NormalizerEngine`) é crítico. Ele traduz nomes de times e mercados que podem diferir entre Superbet e Novibet.
- Exemplo: "Manchester Utd" (Superbet) vs "Man United" (Novibet).
- Mercados: `h2h` (Moneyline), `totals` (Over/Under), `spreads` (Handicap).

## 5. Roadmap MVP
- **Fase 1 (Mês 1):** Integração com Odds API, Motor de Arbitragem Base (1x2 e O/U), Dashboard Real-time.
- **Fase 2 (Mês 2):** Autenticação de Usuários, Calculadora de Stakes, Filtros Avançados.
- **Fase 3 (Mês 3):** Sistema de Alertas (Email/Telegram), Painel Admin, Planos de Assinatura (Stripe).

## 6. Plano de Escalabilidade
Quando a plataforma migrar para um plano pago da Odds API (ex: 10.000 req/mês):
- Instanciar múltiplos workers em paralelo.
- Implementar WebSockets (Socket.io) para push de surebets em tempo real para o frontend, eliminando a necessidade de polling pelo cliente.
- Expandir para +50 casas de apostas.
