# Trading Diary Backend

A complete Node.js + Express + TypeScript + Prisma backend for the Trading Diary application.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with bcrypt password hashing
- **Trading Management**: Complete CRUD operations for trades with automatic metric calculations
- **Strategy Management**: Create and manage trading strategies
- **Statistics & Analytics**: Comprehensive trading statistics including:
  - Dashboard metrics (win rate, P&L, Sharpe ratio)
  - Profit/Loss charts with different time periods
  - Efficiency analysis
  - What-if scenarios
  - Strategy performance comparison
- **Data Validation**: Input validation with express-validator
- **Type Safety**: Full TypeScript implementation with strict mode
- **Database**: PostgreSQL with Prisma ORM

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcryptjs
- **Validation**: express-validator
- **CORS**: cors middleware

## 📁 Project Structure

```
src/
├── controllers/     # Request handlers
│   ├── auth.controller.ts
│   ├── trade.controller.ts
│   ├── strategy.controller.ts
│   ├── user.controller.ts
│   └── stats.controller.ts
├── middleware/      # Express middleware
│   ├── auth.ts
│   ├── errorHandler.ts
│   ├── notFound.ts
│   └── validation.ts
├── routes/          # API route definitions
│   ├── auth.routes.ts
│   ├── trade.routes.ts
│   ├── strategy.routes.ts
│   ├── user.routes.ts
│   └── stats.routes.ts
├── services/        # Business logic
│   ├── trade.service.ts
│   └── stats.service.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── utils/           # Helper functions
│   └── index.ts
└── server.ts        # Main application file

prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Database seeding
```

## ⚙️ Setup & Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file with:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `PORT`: Server port (default: 3001)

3. **Setup database**:
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # (Optional) Seed with demo data
   npm run prisma:seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio GUI
- `npm run prisma:push` - Push schema changes to database
- `npm run prisma:seed` - Seed database with demo data
- `npm run lint` - Run TypeScript type checking
- `npm run typecheck` - Check TypeScript types

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update user profile

### Trades
- `GET /api/trades` - Get trades (with filters & pagination)
- `POST /api/trades` - Create new trade
- `GET /api/trades/:id` - Get single trade
- `PUT /api/trades/:id` - Update trade
- `DELETE /api/trades/:id` - Delete trade
- `POST /api/trades/bulk-delete` - Delete multiple trades

### Strategies
- `GET /api/strategies` - Get all strategies
- `POST /api/strategies` - Create strategy
- `GET /api/strategies/:id` - Get single strategy
- `PUT /api/strategies/:id` - Update strategy
- `DELETE /api/strategies/:id` - Delete strategy

### Statistics
- `GET /api/stats/dashboard` - Get dashboard statistics
- `GET /api/stats/profit-loss` - Get P&L chart data
- `GET /api/stats/efficiency` - Get efficiency analysis
- `GET /api/stats/what-if` - Get what-if scenario analysis
- `GET /api/stats/strategies` - Get strategy performance

### User Management
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/settings` - Update user settings
- `POST /api/users/change-password` - Change password
- `DELETE /api/users/account` - Delete account

## 🗄️ Database Schema

### User
- Authentication and profile information
- Trading preferences (commission, timezone)
- Relationships to trades and strategies

### Trade
- Complete trade information (entry/exit prices, dates)
- Risk management (stop loss, take profit)
- Performance tracking (max favorable/adverse prices)
- Calculated metrics (P&L, efficiency, R-multiple)

### Strategy
- User-defined trading strategies
- Relationship to trades for performance analysis

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Comprehensive validation on all endpoints
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Multi-tenancy**: Users can only access their own data
- **Error Handling**: Secure error responses without sensitive data leaks

## 📊 Trading Metrics

The system automatically calculates:
- **P&L**: Profit and loss in absolute and percentage terms
- **Efficiency**: How much of the potential profit was captured
- **R-Multiple**: Risk-adjusted returns
- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Ratio of gross profits to gross losses
- **Sharpe Ratio**: Risk-adjusted performance metric

## 🚀 Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

3. Ensure PostgreSQL is running and accessible
4. Set production environment variables
5. Run database migrations in production

## 🔧 Configuration

Key environment variables:
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port
- `DATABASE_URL`: PostgreSQL connection
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Token expiration time
- `FRONTEND_URL`: Frontend URL for CORS

## 📈 Performance Considerations

- Database indexes on frequently queried fields
- Pagination for large datasets
- Calculated fields stored for performance
- Connection pooling via Prisma
- Graceful error handling and logging

## 🧪 Testing

Ready for testing implementation with:
- Unit tests for services and utilities
- Integration tests for API endpoints
- Database testing with test database

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)