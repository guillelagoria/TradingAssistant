function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your trading performance and recent activity.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total P&L</h3>
          </div>
          <div className="text-2xl font-bold">$0.00</div>
          <p className="text-xs text-muted-foreground">
            No trades recorded yet
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Win Rate</h3>
          </div>
          <div className="text-2xl font-bold">0%</div>
          <p className="text-xs text-muted-foreground">
            No completed trades
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Trades</h3>
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">
            Start by adding your first trade
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Avg R-Multiple</h3>
          </div>
          <div className="text-2xl font-bold">0.0R</div>
          <p className="text-xs text-muted-foreground">
            Risk-reward ratio
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold mb-4">P&L Over Time</h3>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Chart will appear here when trades are added
          </div>
        </div>
        
        <div className="col-span-3 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold mb-4">Recent Trades</h3>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground text-center py-8">
              No trades recorded yet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;