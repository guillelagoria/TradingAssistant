import { WhatIfAnalysis } from '@/components/analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function Analysis() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analysis</h1>
            <p className="text-muted-foreground">
              Advanced trading analysis and performance insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-sm text-muted-foreground">Performance Analytics</span>
          </div>
        </div>

        {/* What-If Analysis Section */}
        <Card>
          <CardHeader>
            <CardTitle>What-If Analysis</CardTitle>
            <CardDescription>
              Explore alternative scenarios and identify opportunities for improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WhatIfAnalysis />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}