# 📊 Trading Diary - Instrucciones para Claude Code

## 🎯 Descripción del Proyecto
Aplicación web de diario de trading que permite a los traders registrar sus operaciones manualmente, adjuntar imágenes de referencia, y obtener análisis automático de escenarios "what-if" para identificar oportunidades de mejora.

**🎨 NOVEDAD: Interfaz Completamente Modernizada**
- Dashboard unificado con todas las funcionalidades integradas
- Componentes animados con Framer Motion
- Diseño moderno inspirado en Aceternity UI
- Navegación simplificada a solo 3 páginas principales

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **Animaciones**: Framer Motion
- **Estado Global**: Zustand
- **Routing**: React Router v6
- **Utilidades**: date-fns, axios
- **Validación de Forms**: react-hook-form

### Backend
- **Runtime**: Node.js + Express
- **Lenguaje**: TypeScript
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (preparado para implementación futura)
- **Validación**: express-validator

## 📁 Estructura del Proyecto

### Frontend (`/frontend`)
```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── layout/          # Header, Sidebar, MainLayout (solo 3 páginas)
│   ├── trades/          # TradeForm, TradeTable, TradeDetails
│   ├── dashboard/       # NUEVOS: AnimatedStatsCards, AnimatedPnLChart, etc.
│   ├── analysis/        # WhatIfAnalysis (integrado en Dashboard)
│   ├── economic/        # 🆕 Sistema de Alertas Económicas
│   │   ├── EconomicAlertsBar.tsx    # Barra de alertas en header
│   │   ├── EconomicCalendarModal.tsx # Modal con calendario completo
│   │   ├── ImpactBadge.tsx          # Badge de impacto (HIGH/MEDIUM/LOW)
│   │   └── EventTimeDisplay.tsx     # Componente de tiempo del evento
│   └── shared/          # Componentes reutilizables
├── pages/               # Solo 3 páginas: Dashboard, TradeHistory, TradeForm
├── hooks/               # Custom hooks
├── lib/                 # Configuración shadcn/ui
├── services/           # API calls + economicEvents.service.ts
├── store/              # Zustand stores + economicEventsStore.ts
├── types/              # TypeScript types
└── utils/              # Helpers y cálculos
```

### Backend (`/backend`)
```
src/
├── controllers/        # Controladores de rutas + economicEvents.controller.ts
├── services/          # Lógica de negocio y cálculos + economicEvents.service.ts
├── routes/            # Definición de rutas Express + economicEvents.routes.ts
├── middleware/        # Auth, validation, error handling
├── utils/             # Funciones helper
├── types/             # TypeScript types + economicEvents.ts
└── prisma/
    ├── schema.prisma  # Esquema de base de datos
    └── migrations/    # Migraciones de DB
```

## 🔧 Comandos de Desarrollo

### Frontend
```bash
npm run dev        # Iniciar servidor de desarrollo
npm run build      # Build para producción
npm run preview    # Preview del build
npm run lint       # Linting
npm run typecheck  # Type checking
```

### Backend
```bash
npm run dev              # Servidor de desarrollo con hot reload
npm run build           # Compilar TypeScript
npm run start           # Iniciar servidor producción
npm run prisma:generate # Generar cliente Prisma
npm run prisma:migrate  # Ejecutar migraciones
npm run prisma:studio   # Abrir Prisma Studio
npm run lint            # Linting
npm run typecheck       # Type checking
```

## 🚀 Navegación Simplificada

### 📱 Estructura de la App (Solo 3 Páginas)

1. **🏠 Dashboard** (`/`)
   - **Stats Cards animadas** con métricas principales
   - **Gráficos P&L** con animaciones progresivas
   - **Análisis de eficiencia** integrado
   - **Break-Even Analysis** con efectos visuales
   - **What-If Analysis** para escenarios
   - **Portfolio overview** unificado
   - **🆕 Alertas Económicas** en header con eventos ES/NQ relevantes

2. **📋 Trade History** (`/trades`)
   - **Stats Cards animadas** (mismas que Dashboard)
   - **Tabla de trades** con filtros avanzados
   - **Export a CSV**
   - **Búsqueda y filtros**
   - **🆕 Alertas Económicas** también disponibles en header

3. **➕ Add Trade** (`/trades/new` y `/trades/:id/edit`)
   - **Formulario moderno** de trade
   - **Validación en tiempo real**
   - **Cálculos automáticos**
   - **🆕 Alertas Económicas** para contextualizar trades

### ✅ Fases Completadas

#### FASE 1: Setup Inicial ✅
- Inicializar proyectos con Vite (frontend) y Express (backend)
- Configurar TypeScript en ambos proyectos
- Instalar y configurar shadcn/ui + Framer Motion
- Setup de Tailwind CSS
- Configurar Prisma y PostgreSQL

#### FASE 2: Sistema de Trades ✅
- Formulario simplificado de una página (NewTradeForm)
- Store global con Zustand
- CRUD completo de trades
- Cálculos automáticos de métricas
- Campos Break-Even Analysis

#### FASE 3: Dashboard Unificado ✅
- **Componentes animados modernos** con Framer Motion
- **Dashboard all-in-one** con todas las funcionalidades
- **Eliminación de páginas separadas** (Analysis, Portfolio)
- **Navegación simplificada** a 3 páginas principales
- **UI moderna** inspirada en Aceternity UI

#### FASE 4: Sistema de Alertas Económicas ✅ 🆕
- **API de eventos económicos** con integración Finnhub + datos demo
- **Filtrado inteligente** para eventos relevantes a ES/NQ futures
- **Horarios realistas** basados en calendario económico de Estados Unidos
- **Cache inteligente** con TTL de 30 minutos
- **Fallback a datos demo** cuando API no está disponible
- **UI responsiva** con alertas en header y modal detallado

## 📊 Modelos de Datos Principales

### Trade
- Información básica: symbol, direction, prices, dates
- Risk management: stopLoss, takeProfit
- Métricas: maxFavorable/AdversePrice
- Break-Even Analysis: maxPotentialProfit, maxDrawdown, breakEvenWorked
- Metadata: strategy, timeframe, notes, imageUrl
- Cálculos automáticos: PnL, efficiency, R-multiple

### User
- Autenticación: email, password (hash)
- Preferencias: commission, strategies, timezone
- Relaciones: trades, strategies

### EconomicEvent 🆕
- **Información del evento**: event, country, impact (HIGH/MEDIUM/LOW)
- **Timing**: time, date (timestamps UTC)
- **Datos económicos**: actual, estimate, previous values
- **Trading relevance**: relevance description específica para ES/NQ
- **Metadata**: unit, currency

## 🔐 Consideraciones de Seguridad
- Multi-tenancy: Cada usuario solo accede a sus datos
- Validación de inputs en frontend y backend
- Sanitización de datos
- CORS configurado correctamente
- Variables de entorno para configuración sensible
- **🆕 API Keys**: FINNHUB_API_KEY configurada en .env (con fallback a datos demo)

## 🎨 Convenciones de Código
- Usar TypeScript estricto
- Componentes funcionales con hooks
- Nombres descriptivos en inglés
- Comentarios solo cuando sea necesario explicar lógica compleja
- Seguir estructura de carpetas establecida

## ⚙️ MCP Context7 Integration
**IMPORTANTE**: Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.

Utilizar Context7 automáticamente para:
- Documentación de React, TypeScript, Vite
- Configuración de shadcn/ui y Tailwind
- Setup de Prisma y PostgreSQL
- Documentación de Express y Node.js
- Configuración de Zustand
- Cualquier librería del stack cuando se necesite referencia

## 🎨 Componentes Animados Implementados

### Stats Cards
- **AnimatedStatsCards**: Cards con efectos 3D tilt, gradientes animados, contadores con spring animation
- **Efectos hover**: Perspectiva 3D, sparkles, efectos glow
- **Animación stagger**: Aparición secuencial suave

### Gráficos
- **AnimatedPnLChart**: Línea progresiva, área gradiente, tooltips con backdrop blur
- **AnimatedWinRateChart**: Donut con animación circular, contador central typewriter
- **AnimatedDailyPnLChart**: Barras que crecen con spring animation, efectos brillo
- **AnimatedEfficiencyChart**: Scatter plot con puntos animados, efectos glow
- **AnimatedBEStatsCard**: Progress bars animados, gradientes de fondo dinámicos

### Características Visuales
- **Framer Motion**: Todas las animaciones suaves y optimizadas
- **Gradientes modernos**: Colores dinámicos según datos
- **Microinteracciones**: Hover effects, click feedback
- **Loading states**: Skeleton loaders animados
- **Tooltips mejorados**: Backdrop blur, animaciones entrada/salida

### Sistema de Alertas Económicas 🆕
- **EconomicAlertsBar**: Barra compacta en header con contador de eventos y próximo evento
- **EconomicCalendarModal**: Modal completo con pestañas (Today/This Week)
- **ImpactBadge**: Badges de colores para HIGH (rojo), MEDIUM (amarillo), LOW (verde)
- **EventTimeDisplay**: Componente de tiempo relativo ("in 2h", "in 1d")
- **Auto-refresh**: Sistema de actualización automática cada 30 minutos
- **Responsive design**: Adaptado para móvil y escritorio

## 📝 Notas Importantes
1. **Estado del Proyecto**: ✅ **COMPLETO CON ALERTAS ECONÓMICAS** - UI moderna + alertas implementadas
2. **Navegación**: **Solo 3 páginas** - Dashboard, Trade History, Add Trade
3. **Dashboard unificado**: **Todas las funcionalidades** integradas (análisis, portfolio, alertas económicas)
4. **Componentes**: **Versión animada** de todos los elementos principales
5. **Formulario de Trades**: Usa ModernTradeFormPage (formulario unificado)
6. **UI Library**: shadcn/ui + Framer Motion para animaciones modernas
7. **🆕 Alertas Económicas**: Sistema completo con datos en tiempo real + fallback demo

## 🔄 Flujo de Trabajo
1. Implementar frontend y backend en paralelo por features
2. Primero funcionalidad básica, luego refinamientos
3. Validar cada fase antes de continuar
4. Mantener tipos TypeScript sincronizados entre frontend y backend
5. Usar los agentes especializados cuando sea apropiado:
   - **frontend-developer**: Para componentes React y UI
   - **backend-architect**: Para API y lógica de servidor
   - **ui-engineer**: Para diseño de componentes y UX
   - **project-orchestrator**: Para coordinar desarrollo multi-plataforma

## 🧪 Testing (Futuro)
- Frontend: Vitest + React Testing Library
- Backend: Jest + Supertest
- E2E: Playwright (opcional)

## 📚 Recursos y Referencias
- Documentación shadcn/ui: https://ui.shadcn.com
- Prisma Docs: https://www.prisma.io/docs
- Zustand: https://github.com/pmndrs/zustand
- React Hook Form: https://react-hook-form.com
- **🆕 Finnhub API**: https://finnhub.io/docs/api/economic-calendar

## 🚀 API Endpoints Implementados

### Economic Events API 🆕
```bash
GET /api/economic-events/today          # Eventos de hoy
GET /api/economic-events/upcoming       # Próximos 7 días
GET /api/economic-events/high-impact    # Solo eventos HIGH impact
POST /api/economic-events/filter        # Filtros personalizados
POST /api/economic-events/cache/clear   # Limpiar cache (admin)
GET /api/economic-events/cache/stats    # Estadísticas cache (admin)
```

### Variables de Entorno Requeridas 🆕
```bash
# Backend .env
FINNHUB_API_KEY=your_finnhub_api_key_here
```

---
**Última actualización**: ✅ **APLICACIÓN COMPLETA CON ALERTAS ECONÓMICAS**
- UI con animaciones modernas implementada ✅
- Navegación simplificada a 3 páginas principales ✅
- Dashboard unificado con todas las funcionalidades ✅
- Componentes con Framer Motion y diseño inspirado en Aceternity UI ✅
- **🆕 Sistema de Alertas Económicas completo con API + UI** ✅