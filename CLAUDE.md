# 📊 Trading Diary - Instrucciones para Claude Code

## 🎯 Descripción del Proyecto
Aplicación web de diario de trading que permite a los traders registrar sus operaciones manualmente, adjuntar imágenes de referencia, y obtener análisis automático de escenarios "what-if" para identificar oportunidades de mejora.

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Tailwind CSS
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
│   ├── layout/          # Header, Sidebar, MainLayout
│   ├── trades/          # TradeForm, TradeTable, TradeDetails
│   ├── dashboard/       # StatsCards, ProfitChart, EfficiencyAnalysis
│   └── shared/          # Componentes reutilizables
├── pages/               # Dashboard, TradeHistory, Settings
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

## 🚀 Fases de Implementación

### FASE 1: Setup Inicial ✅
- Inicializar proyectos con Vite (frontend) y Express (backend)
- Configurar TypeScript en ambos proyectos
- Instalar y configurar shadcn/ui
- Setup de Tailwind CSS
- Configurar Prisma y PostgreSQL

### FASE 2: Sistema de Trades
- Formulario de ingreso de trades con tabs
- Store global con Zustand
- CRUD completo de trades
- Cálculos automáticos de métricas

### FASE 3: Dashboard y Análisis
- Dashboard con estadísticas principales
- Gráficos de evolución P&L
- Análisis de eficiencia
- Cálculos What-If

### FASE 4: Historial y Filtros
- Tabla de trades con paginación
- Sistema de filtros avanzados
- Vista detallada de trades
- Export de datos

### FASE 5: Configuración
- Gestión de estrategias personalizadas
- Preferencias de trading
- Configuración de comisiones
- Símbolos favoritos

### FASE 6: Backend API
- Implementar todas las rutas CRUD
- Servicio de cálculos avanzados
- Validación de datos
- Manejo de errores

## 📊 Modelos de Datos Principales

### Trade
- Información básica: symbol, direction, prices, dates
- Risk management: stopLoss, takeProfit
- Métricas: maxFavorable/AdversePrice
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

## 📝 Notas Importantes
1. **Estado del Proyecto**: Iniciando desde cero
2. **Prioridad**: Funcionalidad core antes que features avanzadas
3. **Testing**: Preparar estructura pero implementar tests después del MVP
4. **Autenticación**: Estructura preparada pero implementación posterior
5. **Upload de imágenes**: Inicialmente almacenamiento local
6. **Base de datos**: PostgreSQL local para desarrollo

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
**Última actualización**: Proyecto iniciando - Fase 1 pendiente