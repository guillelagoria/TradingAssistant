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
│   └── shared/          # Componentes reutilizables
├── pages/               # Solo 3 páginas: Dashboard, TradeHistory, TradeForm
├── hooks/               # Custom hooks
├── lib/                 # Configuración shadcn/ui
├── services/           # API calls
├── store/              # Zustand stores
├── types/              # TypeScript types
└── utils/              # Helpers y cálculos
```

### Backend (`/backend`)
```
src/
├── controllers/        # Controladores de rutas
├── services/          # Lógica de negocio y cálculos
├── routes/            # Definición de rutas Express
├── middleware/        # Auth, validation, error handling
├── utils/             # Funciones helper
├── types/             # TypeScript types
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

2. **📋 Trade History** (`/trades`)
   - **Stats Cards animadas** (mismas que Dashboard)
   - **Tabla de trades** con filtros avanzados
   - **Export a CSV**
   - **Búsqueda y filtros**

3. **➕ Add Trade** (`/trades/new` y `/trades/:id/edit`)
   - **Formulario moderno** de trade
   - **Validación en tiempo real**
   - **Cálculos automáticos**

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

## 🔐 Consideraciones de Seguridad
- Multi-tenancy: Cada usuario solo accede a sus datos
- Validación de inputs en frontend y backend
- Sanitización de datos
- CORS configurado correctamente
- Variables de entorno para configuración sensible

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

## 📝 Notas Importantes
1. **Estado del Proyecto**: ✅ **COMPLETO** - UI moderna con animaciones implementada
2. **Navegación**: **Solo 3 páginas** - Dashboard, Trade History, Add Trade
3. **Dashboard unificado**: **Todas las funcionalidades** integradas (análisis, portfolio, etc.)
4. **Componentes**: **Versión animada** de todos los elementos principales
5. **Formulario de Trades**: Usa ModernTradeFormPage (formulario unificado)
6. **UI Library**: shadcn/ui + Framer Motion para animaciones modernas

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

---
**Última actualización**: ✅ **APLICACIÓN COMPLETA Y MODERNIZADA**
- UI con animaciones modernas implementada
- Navegación simplificada a 3 páginas principales
- Dashboard unificado con todas las funcionalidades
- Componentes con Framer Motion y diseño inspirado en Aceternity UI