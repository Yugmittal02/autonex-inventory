/**
 * AI Engine - Prediction algorithms and analytics
 */

export const AIEngine = {
  // Moving Average for trend prediction - O(n)
  calculateMovingAverage: (data: number[], period: number = 7): number[] => {
    const result: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  },

  // Exponential Smoothing for sales prediction - O(n)
  exponentialSmoothing: (data: number[], alpha: number = 0.3): number => {
    if (data.length === 0) return 0;
    let forecast = data[0];
    for (let i = 1; i < data.length; i++) {
      forecast = alpha * data[i] + (1 - alpha) * forecast;
    }
    return forecast;
  },

  // Linear Regression for price optimization - O(n)
  linearRegression: (
    x: number[],
    y: number[]
  ): { slope: number; intercept: number; predict: (val: number) => number } => {
    const n = x.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n || 0;
    return {
      slope,
      intercept,
      predict: (val: number) => slope * val + intercept,
    };
  },

  // Anomaly Detection using Z-Score - O(n)
  detectAnomalies: (data: number[], threshold: number = 2): number[] => {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);
    return data.map((val, idx) => (Math.abs((val - mean) / std) > threshold ? idx : -1)).filter((i) => i !== -1);
  },

  // Seasonal Decomposition for pattern recognition
  seasonalPattern: (
    data: number[],
    seasonLength: number = 7
  ): { trend: number[]; seasonal: number[]; residual: number[] } => {
    const trend = AIEngine.calculateMovingAverage(data, seasonLength);
    const seasonal: number[] = [];
    const residual: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const trendVal = trend[Math.max(0, i - Math.floor(seasonLength / 2))] || data[i];
      seasonal.push(data[i] - trendVal);
      residual.push(data[i] - trendVal - (seasonal[i % seasonLength] || 0));
    }
    return { trend, seasonal, residual };
  },

  // Product Recommendation using Collaborative Filtering - O(n*m)
  getRecommendations: (purchases: string[][], currentCart: string[]): string[] => {
    const coOccurrence = new Map<string, Map<string, number>>();

    // Build co-occurrence matrix
    purchases.forEach((basket) => {
      basket.forEach((item1) => {
        if (!coOccurrence.has(item1)) coOccurrence.set(item1, new Map());
        basket.forEach((item2) => {
          if (item1 !== item2) {
            const count = coOccurrence.get(item1)!.get(item2) || 0;
            coOccurrence.get(item1)!.set(item2, count + 1);
          }
        });
      });
    });

    // Get recommendations based on current cart
    const scores = new Map<string, number>();
    currentCart.forEach((item) => {
      const related = coOccurrence.get(item);
      if (related) {
        related.forEach((count, relatedItem) => {
          if (!currentCart.includes(relatedItem)) {
            scores.set(relatedItem, (scores.get(relatedItem) || 0) + count);
          }
        });
      }
    });

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([item]) => item);
  },

  // Smart Price Suggestion based on market analysis
  suggestPrice: (
    cost: number,
    competitorPrices: number[],
    demandLevel: 'low' | 'medium' | 'high'
  ): { min: number; optimal: number; max: number } => {
    const avgCompetitor =
      competitorPrices.length > 0
        ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
        : cost * 1.3;

    const demandMultiplier = { low: 0.9, medium: 1.0, high: 1.15 }[demandLevel];
    const minMargin = 1.1; // 10% minimum margin
    const optimalMargin = 1.25; // 25% optimal margin
    const maxMargin = 1.5; // 50% max margin

    return {
      min: Math.max(cost * minMargin, avgCompetitor * 0.85) * demandMultiplier,
      optimal: Math.max(cost * optimalMargin, avgCompetitor) * demandMultiplier,
      max: cost * maxMargin * demandMultiplier,
    };
  },

  // Inventory Reorder Point Calculation
  calculateReorderPoint: (avgDailySales: number, leadTimeDays: number, safetyStock: number = 0): number => {
    return Math.ceil(avgDailySales * leadTimeDays + safetyStock);
  },

  // ABC Analysis for inventory classification - O(n log n)
  abcAnalysis: (items: { id: string; value: number }[]): { A: string[]; B: string[]; C: string[] } => {
    const sorted = [...items].sort((a, b) => b.value - a.value);
    const total = items.reduce((sum, item) => sum + item.value, 0);

    let cumulative = 0;
    const result = { A: [] as string[], B: [] as string[], C: [] as string[] };

    for (const item of sorted) {
      cumulative += item.value;
      const percentage = cumulative / total;
      if (percentage <= 0.7) result.A.push(item.id);
      else if (percentage <= 0.9) result.B.push(item.id);
      else result.C.push(item.id);
    }
    return result;
  },
};
