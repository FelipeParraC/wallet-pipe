"use client"

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';
import { Transaction } from "@/types/transaction";
import { format, parseISO } from 'date-fns';

interface DailyTransactionsChartProps {
    transactions: Transaction[];
}

export function DailyTransactionsChart({ transactions }: DailyTransactionsChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const [chart, setChart] = useState<IChartApi | null>(null);

    useEffect(() => {
        if (chartContainerRef.current) {
            const newChart = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: 'rgba(255, 255, 255, 0.9)',
                },
                width: chartContainerRef.current.clientWidth,
                height: 300,
                grid: {
                    vertLines: { visible: false },
                    horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
                },
            });

            setChart(newChart);

            const expenseSeries = newChart.addHistogramSeries({
                color: '#ef4444',
                priceFormat: { type: 'volume' },
            });

            const dailyData = transactions.reduce((acc, transaction) => {
                const date = format(parseISO(transaction.date), 'yyyy-MM-dd');
                if (transaction.amount < 0) {
                    if (!acc[date]) {
                        acc[date] = 0;
                    }
                    acc[date] += Math.abs(transaction.amount);
                }
                return acc;
            }, {} as Record<string, number>);

            const expenseData = Object.entries(dailyData)
                .map(([date, expense]) => ({
                    time: date,
                    value: expense,
                }))
                .sort((a, b) => a.time.localeCompare(b.time));

            expenseSeries.setData(expenseData);

            newChart.timeScale().fitContent();

            newChart.applyOptions({
                leftPriceScale: {
                    visible: true,
                    borderVisible: false,
                },
                rightPriceScale: {
                    visible: true,
                    borderVisible: false,
                },
                timeScale: {
                    borderVisible: false,
                    fixLeftEdge: true,
                    fixRightEdge: true,
                    visible: true,
                },
                grid: {
                    vertLines: { visible: false },
                    horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
                },
            });

            const handleResize = () => {
                newChart.applyOptions({
                    width: chartContainerRef.current!.clientWidth,
                    height: Math.max(300, window.innerHeight * 0.4),
                });
            };

            window.addEventListener('resize', handleResize);
            handleResize();

            return () => {
                window.removeEventListener('resize', handleResize);
                newChart.remove();
            };
        }
    }, [transactions]);

    useEffect(() => {
        const handleResize = () => {
            if (chart && chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: Math.max(300, window.innerHeight * 0.4),
                });
                chart.timeScale().fitContent();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [chart]);

    return (
        <div className="flex justify-center items-center w-full h-full">
            <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}

