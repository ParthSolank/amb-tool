'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  labels: number[];
  data: number[];
  target: number;
  color: string;
}

export default function TrendChart({ labels, data, target, color }: ChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1c1c26',
        titleColor: '#a0a0ba',
        bodyColor: '#f8f8fc',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        display: false,
        suggestedMin: 0,
      },
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          color: '#6a6a8a',
          font: { size: 10 },
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Balance',
        data,
        borderColor: color,
        backgroundColor: color + '22',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Target',
        data: labels.map(() => target),
        borderColor: 'rgba(52, 211, 153, 0.4)',
        borderDash: [6, 3],
        fill: false,
        pointRadius: 0,
        borderWidth: 1.5,
      }
    ],
  };

  return (
    <div className="chart-container">
      <Line options={options} data={chartData} />
    </div>
  );
}
