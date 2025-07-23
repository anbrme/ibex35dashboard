import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Ibex35MetricsProps {
    totalMarketCap: number;
    avgPrice: number;
    totalVolume: number;
}

const formatNumber = (num: number): string => {
    if (num >= 1e12) return `€${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `€${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `€${(num / 1e6).toFixed(2)}M`;
    return `€${num.toFixed(2)}`;
};


export function Ibex35Metrics({ totalMarketCap, avgPrice, totalVolume }: Ibex35MetricsProps) {
    // Mock data for trend
    const trend = Math.random() - 0.4;
    const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
    const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500';

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">IBEX 35 Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-card border">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">IBEX 35</p>
                        <TrendIcon className={`w-5 h-5 ${trendColor}`} />
                    </div>
                    <p className={`text-2xl font-bold ${trendColor}`}>9,234.50</p>
                </div>
                <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm text-muted-foreground">Total Market Cap</p>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(totalMarketCap)}</p>
                </div>
                <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm text-muted-foreground">Average Price</p>
                    <p className="text-2xl font-bold text-foreground">€{avgPrice.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm text-muted-foreground">Total Volume</p>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(totalVolume)}</p>
                </div>
            </div>
        </div>
    );
}
