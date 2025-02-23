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
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function PortfolioChart({ historyData = [] }) {
  if (!Array.isArray(historyData) || historyData.length === 0) {
    return <div className="text-green-500/70">No historical data available</div>;
  }

  // Ensure data is properly formatted
  const validData = historyData.filter(d => 
    d && d.created_at && typeof d.total_value === 'number'
  );

  if (validData.length === 0) {
    return <div className="text-green-500/70">Invalid historical data format</div>;
  }

  const data = {
    labels: validData.map(d => new Date(d.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Portfolio Value',
        data: validData.map(d => d.total_value),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        ticks: {
          color: 'rgb(34, 197, 94)'
        },
        grid: {
          color: 'rgba(34, 197, 94, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'rgb(34, 197, 94)'
        },
        grid: {
          color: 'rgba(34, 197, 94, 0.1)'
        }
      }
    }
  };

  return <Line data={data} options={options} />;
} 