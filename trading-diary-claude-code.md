# 📊 Trading Diary - Documento de Desarrollo para Claude Code

## 🎯 Visión General del Proyecto

### Descripción
Aplicación web de diario de trading que permite a los traders registrar sus operaciones manualmente, adjuntar imágenes de referencia, y obtener análisis automático de escenarios "what-if" para identificar oportunidades de mejora.

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **Estado**: Zustand para estado global
- **Routing**: React Router v6
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT (implementación futura)
- **Storage**: Archivos locales (desarrollo) / S3 (futuro)

## 🏗️ Arquitectura y Consideraciones Transversales

### Estructura de Carpetas Frontend
```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── layout/          # Header, Sidebar, Layout principal
│   ├── trades/          # Componentes relacionados a trades
│   ├── dashboard/       # Componentes del dashboard
│   └── shared/          # Componentes reutilizables
├── pages/               # Páginas principales de la app
├── hooks/               # Custom hooks
├── lib/                 # Utilidades y configuraciones
├── services/            # API calls y lógica de negocio
├── store/              # Estado global con Zustand
├── types/              # TypeScript types e interfaces
└── utils/              # Funciones helper
```

### Estructura de Carpetas Backend
```
src/
├── controllers/         # Controladores de rutas
├── services/           # Lógica de negocio
├── models/             # Modelos Prisma
├── routes/             # Definición de rutas
├── middleware/         # Auth, validation, etc.
├── utils/              # Helpers y utilidades
├── types/              # TypeScript types
└── config/             # Configuraciones
```

### Tipos Base (types/index.ts)
```typescript
// Tipos fundamentales que usaremos en todo el proyecto
export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryDate: Date;
  exitDate: Date;
  stopLoss: number;
  takeProfit?: number;
  maxFavorablePrice?: number;
  maxAdversePrice?: number;
  commission?: number;
  strategy?: string;
  timeframe?: string;
  emotionalState?: number;
  notes?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  // Campos calculados
  pnl?: number;
  pnlPercentage?: number;
  rMultiple?: number;
  efficiency?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  defaultCommission: number;
  favoriteSymbols: string[];
  strategies: Strategy[];
  timezone: string;
  currency: string;
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface DashboardStats {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnl: number;
  averageWin: number;
  averageLoss: number;
  bestTrade: Trade;
  worstTrade: Trade;
  currentStreak: number;
}
```

### Schema Prisma Base
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // Hash
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  trades      Trade[]
  strategies  Strategy[]
  preferences Json      @default("{}")
}

model Trade {
  id                String   @id @default(cuid())
  userId            String
  symbol            String
  direction         String   // LONG | SHORT
  entryPrice        Float
  exitPrice         Float
  quantity          Float
  entryDate         DateTime
  exitDate          DateTime
  stopLoss          Float
  takeProfit        Float?
  maxFavorablePrice Float?
  maxAdversePrice   Float?
  commission        Float?
  strategy          String?
  timeframe         String?
  emotionalState    Int?
  notes             String?
  imageUrl          String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId, symbol])
  @@index([userId, entryDate])
}

model Strategy {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  color       String?
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, name])
}
```

## 📋 FASE 1: Setup Inicial y Estructura Base

### 1.1 Inicialización del Proyecto

#### Frontend Setup
```bash
# Crear proyecto con Vite
npm create vite@latest trading-diary-frontend -- --template react-ts
cd trading-diary-frontend

# Instalar dependencias base
npm install react-router-dom zustand axios date-fns
npm install -D @types/react @types/react-dom tailwindcss postcss autoprefixer

# Configurar Tailwind CSS
npx tailwindcss init -p

# Instalar shadcn/ui
npx shadcn-ui@latest init
```

#### Configuración shadcn/ui (components.json)
```json
{
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### Backend Setup
```bash
# Crear proyecto backend
mkdir trading-diary-backend
cd trading-diary-backend
npm init -y

# Instalar dependencias
npm install express cors dotenv bcryptjs jsonwebtoken
npm install @prisma/client prisma
npm install -D typescript @types/express @types/cors @types/node ts-node-dev
```

### 1.2 Componentes UI Base con shadcn

```bash
# Instalar componentes shadcn necesarios
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add popover
```

### 1.3 Layout Principal

#### src/components/layout/MainLayout.tsx
```typescript
import { Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => {/* Abrir modal de nuevo trade */}}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
```

## 📋 FASE 2: Sistema de Trades

### 2.1 Formulario de Ingreso de Trade

#### src/components/trades/TradeForm.tsx
```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TradeFormData {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss: number;
  entryDate: string;
  exitDate: string;
  // Campos opcionales
  takeProfit?: number;
  maxFavorablePrice?: number;
  maxAdversePrice?: number;
  commission?: number;
  strategy?: string;
  timeframe?: string;
  emotionalState?: number;
  notes?: string;
}

export function TradeForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, watch, setValue } = useForm<TradeFormData>();
  const [imageFile, setImageFile] = useState<File | null>(null);

  const onSubmit = async (data: TradeFormData) => {
    // Calcular métricas automáticamente
    const pnl = calculatePnL(data);
    const metrics = calculateMetrics(data);
    
    // Enviar al backend
    await createTrade({ ...data, ...metrics });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Trade</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="essential">
            <TabsList>
              <TabsTrigger value="essential">Datos Esenciales</TabsTrigger>
              <TabsTrigger value="additional">Datos Adicionales</TabsTrigger>
              <TabsTrigger value="image">Imagen</TabsTrigger>
            </TabsList>

            <TabsContent value="essential" className="space-y-4">
              {/* Campos esenciales del trade */}
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              {/* Campos opcionales */}
            </TabsContent>

            <TabsContent value="image">
              {/* Upload de imagen */}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar Trade</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 2.2 Store Global con Zustand

#### src/store/tradeStore.ts
```typescript
import { create } from 'zustand';
import { Trade } from '@/types';

interface TradeStore {
  trades: Trade[];
  isLoading: boolean;
  filters: TradeFilters;
  
  // Actions
  fetchTrades: () => Promise<void>;
  createTrade: (trade: Partial<Trade>) => Promise<void>;
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TradeFilters>) => void;
}

export const useTradeStore = create<TradeStore>((set, get) => ({
  trades: [],
  isLoading: false,
  filters: {
    dateFrom: null,
    dateTo: null,
    symbol: null,
    strategy: null,
  },

  fetchTrades: async () => {
    set({ isLoading: true });
    try {
      const response = await api.getTrades(get().filters);
      set({ trades: response.data });
    } finally {
      set({ isLoading: false });
    }
  },

  createTrade: async (trade) => {
    const response = await api.createTrade(trade);
    set((state) => ({ trades: [...state.trades, response.data] }));
  },

  // ... más métodos
}));
```

## 📋 FASE 3: Dashboard y Análisis

### 3.1 Dashboard Principal

#### src/pages/Dashboard.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfitChart } from '@/components/dashboard/ProfitChart';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { EfficiencyAnalysis } from '@/components/dashboard/EfficiencyAnalysis';

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Tarjetas de estadísticas principales */}
      <StatsCards />
      
      {/* Gráfico de P&L */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfitChart />
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Análisis de eficiencia */}
        <EfficiencyAnalysis />
        
        {/* Trades recientes */}
        <RecentTrades />
      </div>
    </div>
  );
}
```

### 3.2 Cálculos What-If

#### src/utils/calculations.ts
```typescript
export interface WhatIfScenarios {
  withoutBreakEven: number;
  atMaxFavorable: number;
  withTrailingStop: TrailingStopScenario[];
  withPartialClose: PartialCloseScenario[];
  efficiency: number;
  moneyLeftOnTable: number;
}

export function calculateWhatIfScenarios(trade: Trade): WhatIfScenarios {
  const { entryPrice, exitPrice, direction, maxFavorablePrice, quantity, stopLoss } = trade;
  
  // Calcular eficiencia de salida
  const totalMove = direction === 'LONG' 
    ? maxFavorablePrice - entryPrice 
    : entryPrice - maxFavorablePrice;
  
  const actualMove = direction === 'LONG' 
    ? exitPrice - entryPrice 
    : entryPrice - exitPrice;
  
  const efficiency = (actualMove / totalMove) * 100;
  
  // Calcular dinero dejado en la mesa
  const moneyLeftOnTable = (totalMove - actualMove) * quantity;
  
  // Escenario sin Break Even
  const withoutBreakEven = calculatePnLWithoutBE(trade);
  
  // Más cálculos...
  
  return {
    efficiency,
    moneyLeftOnTable,
    withoutBreakEven,
    // ... más resultados
  };
}
```

## 📋 FASE 4: Historial y Filtros

### 4.1 Página de Historial

#### src/pages/TradeHistory.tsx
```typescript
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TradeTable } from '@/components/trades/TradeTable';
import { TradeFilters } from '@/components/trades/TradeFilters';
import { TradeDetails } from '@/components/trades/TradeDetails';

export function TradeHistory() {
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Historial de Trades</h1>
      
      {/* Filtros */}
      <Card className="p-4">
        <TradeFilters />
      </Card>
      
      {/* Tabla de trades */}
      <TradeTable onSelectTrade={setSelectedTrade} />
      
      {/* Modal de detalles */}
      {selectedTrade && (
        <TradeDetails 
          tradeId={selectedTrade} 
          onClose={() => setSelectedTrade(null)} 
        />
      )}
    </div>
  );
}
```

## 📋 FASE 5: Configuración y Personalización

### 5.1 Página de Configuración

#### src/pages/Settings.tsx
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { StrategySettings } from '@/components/settings/StrategySettings';
import { TradingSettings } from '@/components/settings/TradingSettings';
import { PreferencesSettings } from '@/components/settings/PreferencesSettings';

export function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="strategies">Estrategias</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        
        <TabsContent value="strategies">
          <StrategySettings />
        </TabsContent>
        
        <TabsContent value="trading">
          <TradingSettings />
        </TabsContent>
        
        <TabsContent value="preferences">
          <PreferencesSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## 📋 FASE 6: Backend API

### 6.1 Rutas Principales

#### src/routes/trade.routes.ts
```typescript
import { Router } from 'express';
import { TradeController } from '../controllers/trade.controller';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new TradeController();

// Todas las rutas requieren autenticación (preparado para futuro)
router.use(authenticate);

router.get('/', controller.getTrades);
router.get('/stats', controller.getStats);
router.get('/:id', controller.getTrade);
router.post('/', validateRequest('createTrade'), controller.createTrade);
router.put('/:id', validateRequest('updateTrade'), controller.updateTrade);
router.delete('/:id', controller.deleteTrade);

export default router;
```

### 6.2 Servicio de Cálculos

#### src/services/calculation.service.ts
```typescript
export class CalculationService {
  static calculateTradeMetrics(trade: TradeInput): TradeMetrics {
    const { entryPrice, exitPrice, quantity, direction, commission = 0 } = trade;
    
    // P&L básico
    const grossPnL = direction === 'LONG' 
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity;
    
    const netPnL = grossPnL - commission;
    const pnlPercentage = (netPnL / (entryPrice * quantity)) * 100;
    
    // R-Multiple
    const risk = Math.abs(entryPrice - trade.stopLoss) * quantity;
    const rMultiple = netPnL / risk;
    
    // Eficiencia
    const efficiency = this.calculateEfficiency(trade);
    
    // What-If Scenarios
    const whatIf = this.calculateWhatIfScenarios(trade);
    
    return {
      grossPnL,
      netPnL,
      pnlPercentage,
      rMultiple,
      efficiency,
      whatIf
    };
  }
}
```

## 🔐 Consideraciones de Seguridad (Para Implementar)

```typescript
// Middleware para multi-tenancy
export const multiTenancy = async (req: Request, res: Response, next: NextFunction) => {
  // Asegurar que cada usuario solo accede a sus propios datos
  req.userId = req.user.id; // Viene del JWT
  next();
};

// En todos los queries de Prisma
const trades = await prisma.trade.findMany({
  where: {
    userId: req.userId, // Siempre filtrar por usuario
    ...otherFilters
  }
});
```

## 🚀 Scripts de Desarrollo

### package.json (Frontend)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### package.json (Backend)
```json
{
  "scripts": {
    "dev": "ts-node-dev src/server.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

## 📝 Instrucciones de Inicio

1. **Clonar y setup inicial**:
```bash
# Terminal 1 - Backend
cd trading-diary-backend
npm install
npx prisma migrate dev
npm run dev

# Terminal 2 - Frontend
cd trading-diary-frontend
npm install
npm run dev
```

2. **Desarrollo incremental**:
- Fase 1: Setup y layout base
- Fase 2: CRUD de trades funcional
- Fase 3: Dashboard con cálculos
- Fase 4: Historial y filtros
- Fase 5: Configuración de usuario
- Fase 6: Pulir y optimizar

3. **Próximas features a agregar**:
- Autenticación real con JWT
- Upload de imágenes a S3/Cloudinary
- Export a CSV/PDF
- Gráficos más avanzados
- Notificaciones y alertas
- PWA para móvil