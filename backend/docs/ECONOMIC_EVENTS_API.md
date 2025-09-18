# Economic Events API Documentation

## Overview

The Economic Events API provides real-time economic calendar data specifically filtered for events that impact ES (S&P 500) and NQ (NASDAQ) futures trading. The service integrates with Finnhub API and implements intelligent caching to minimize API calls.

## Setup

### 1. Get Finnhub API Key

1. Visit [Finnhub Registration](https://finnhub.io/register)
2. Create a free account
3. Copy your API key from the dashboard
4. Add the key to your `.env` file:

```env
FINNHUB_API_KEY=your_api_key_here
```

### 2. Verify Installation

The required dependencies are already installed:
- `axios` - For HTTP requests
- `node-cache` - For caching API responses

## API Endpoints

### Get Today's Events
**GET** `/api/economic-events/today`

Returns economic events for the current day that are relevant to ES/NQ futures.

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-17",
    "count": 3,
    "events": [
      {
        "id": "US_2025-01-17T13:30:00_Retail_Sales",
        "event": "Retail Sales",
        "time": "2025-01-17T13:30:00",
        "date": "2025-01-17T13:30:00.000Z",
        "impact": "HIGH",
        "actual": null,
        "estimate": 0.5,
        "previous": 0.7,
        "unit": "%",
        "relevance": "Consumer spending drives 70% of US economy",
        "country": "US"
      }
    ]
  }
}
```

### Get Upcoming Events
**GET** `/api/economic-events/upcoming?days=7`

Returns economic events for the next N days (default 7, max 30).

**Query Parameters:**
- `days` (optional): Number of days to look ahead (1-30)

**Response:**
```json
{
  "success": true,
  "data": {
    "startDate": "2025-01-17",
    "endDate": "2025-01-24",
    "days": 7,
    "count": 15,
    "events": [...]
  }
}
```

### Get High Impact Events
**GET** `/api/economic-events/high-impact`

Returns only HIGH impact events for the next 7 days.

### Filter Events
**POST** `/api/economic-events/filter`

Allows custom filtering of economic events.

**Request Body:**
```json
{
  "startDate": "2025-01-17",
  "endDate": "2025-01-24",
  "impact": ["HIGH", "MEDIUM"],
  "events": ["FOMC", "CPI", "NFP"]
}
```

### Cache Management

#### Clear Cache
**POST** `/api/economic-events/cache/clear`

Clears the cached economic events data.

#### Get Cache Statistics
**GET** `/api/economic-events/cache/stats`

Returns cache statistics and currently cached keys.

## Filtered Events

The API automatically filters for events relevant to ES/NQ futures:

### Country Filter
- **USA events only** - Only events from the United States are included

### Impact Filter
- **HIGH impact** - Major market-moving events
- **MEDIUM impact** - Significant but less volatile events
- LOW impact events are excluded

### Event Types Included

#### Federal Reserve Events
- FOMC Meeting
- FOMC Minutes
- Fed Interest Rate Decision
- Federal Reserve Chair Speaks

#### Inflation Indicators
- CPI (Consumer Price Index)
- Core CPI
- PPI (Producer Price Index)
- Core PPI
- Core PCE (Personal Consumption Expenditures)

#### Employment Data
- Non-Farm Payrolls (NFP)
- Unemployment Rate
- Initial Jobless Claims
- Continuing Jobless Claims
- ADP Employment Change
- Average Hourly Earnings

#### GDP & Growth
- GDP Growth Rate
- Advance/Preliminary/Final GDP

#### Manufacturing & Services
- ISM Manufacturing PMI
- ISM Services PMI
- Chicago PMI
- Philadelphia Fed Index

#### Consumer Data
- Retail Sales
- Core Retail Sales
- Consumer Confidence
- Michigan Consumer Sentiment

#### Housing Market
- Building Permits
- Housing Starts
- Existing/New Home Sales
- Case-Shiller Home Price Index

## Relevance Explanations

Each event includes a `relevance` field explaining why it matters for ES/NQ futures:

- **Fed Events**: "Direct impact on interest rates and market liquidity"
- **Inflation Data**: "Inflation data affects Fed policy and market valuations"
- **Employment**: "Employment data influences Fed decisions and economic outlook"
- **GDP**: "Economic growth indicator affects overall market direction"
- **PMI/ISM**: "Leading indicator of economic activity and business confidence"
- **Consumer Data**: "Consumer spending drives 70% of US economy"
- **Housing**: "Housing market health affects broader economic sentiment"

## Caching Strategy

- **TTL**: 30 minutes (1800 seconds)
- **Purpose**: Reduce API calls and improve response times
- **Cache Key Format**: `economic_calendar_{from_date}_{to_date}`

## Error Handling

The API returns appropriate error messages and HTTP status codes:

- `401`: Invalid Finnhub API key
- `429`: Finnhub API rate limit exceeded
- `500`: General server error
- `503`: Service unavailable (API key not configured)

## Rate Limits

- Finnhub Free Tier: 60 requests per minute
- Cache helps minimize API calls
- Multiple users can share cached data

## Example Usage

### JavaScript/TypeScript
```javascript
// Fetch today's events
const response = await fetch('http://localhost:3001/api/economic-events/today');
const data = await response.json();

// Get upcoming high-impact events
const highImpact = await fetch('http://localhost:3001/api/economic-events/high-impact');
const events = await highImpact.json();

// Filter for specific events
const filtered = await fetch('http://localhost:3001/api/economic-events/filter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    impact: ['HIGH'],
    events: ['FOMC', 'NFP', 'CPI']
  })
});
```

## Trading Integration Tips

1. **Pre-Market Check**: Call `/today` endpoint before market open to prepare for the day's events
2. **Weekly Planning**: Use `/upcoming` on weekends to plan the week's trading strategy
3. **Alert System**: Poll `/today` periodically to check for upcoming high-impact events
4. **Risk Management**: Reduce position size or avoid trading during HIGH impact events
5. **Volatility Expectations**: HIGH impact events typically cause increased volatility in ES/NQ

## Notes

- Events are returned in chronological order
- Times are in UTC format (ISO 8601)
- Actual values are null until the data is released
- The service focuses exclusively on US economic data affecting index futures