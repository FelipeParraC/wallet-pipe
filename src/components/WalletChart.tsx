"use client"

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';
import { Transaction, isTransferTransaction } from "@/types/transaction";
import { format } from 'date-fns';

interface WalletChartProps {
    transactions: Transaction[];
    color: string;
    walletId: string;
}

export function WalletChart({ transactions, color, walletId }: WalletChartProps) {
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
                rightPriceScale: {
                    borderVisible: false,
                },
                timeScale: {
                    borderVisible: false,
                },
            });

            setChart(newChart);

            const areaSeries = newChart.addAreaSeries({
                lineColor: color,
                topColor: `${color}80`,
                bottomColor: `${color}10`,
                lineWidth: 2,
                priceLineVisible: false,
                crosshairMarkerVisible: true,
                lineType: 2,
            });

            const data = transactions
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .reduce((acc, transaction) => {
                    const lastBalance = acc.length > 0 ? acc[acc.length - 1].value : 0;
                    const transactionAmount = isTransferTransaction(transaction) && transaction.fromWallet === walletId
                        ? -transaction.amount
                        : transaction.amount;
                    const newBalance = lastBalance + transactionAmount;
                    const existingEntry = acc.find(entry => entry.time === format(new Date(transaction.date), 'yyyy-MM-dd'));

                    if (existingEntry) {
                        existingEntry.value = newBalance;
                    } else {
                        acc.push({ time: format(new Date(transaction.date), 'yyyy-MM-dd'), value: newBalance });
                    }

                    return acc;
                }, [] as { time: string; value: number }[]);

            // Asegurarse de que los datos estén ordenados por tiempo
            data.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

            areaSeries.setData(data);

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
    }, [transactions, color, walletId]);

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

