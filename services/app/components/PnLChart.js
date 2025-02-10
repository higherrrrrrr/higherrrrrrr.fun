'use client';
import { Line } from 'react-chartjs-2';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PnLChart({ data }) {
  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#22c55e'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: 'rgba(34, 197, 94, 0.1)',
        },
        ticks: {
          color: '#22c55e',
          callback: (value) => `$${value.toFixed(2)}`
        }
      },
      x: {
        grid: {
          color: 'rgba(34, 197, 94, 0.1)',
        },
        ticks: {
          color: '#22c55e'
        }
      }
    },
  };

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: 'Realized P&L',
        data: data.realizedPnL,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Unrealized P&L',
        data: data.unrealizedPnL,
        borderColor: '#eab308',
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        yAxisID: 'y',
      }
    ],
  };

  return (
    <div className="bg-black border border-green-500/30 rounded-lg p-6">
      <Line options={options} data={chartData} />
    </div>
  );
} 