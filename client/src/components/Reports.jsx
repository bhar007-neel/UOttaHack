import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [reportType, setReportType] = useState('inflation');
  const [selectedProduct, setSelectedProduct] = useState('milk');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const products = ['milk', 'rice', 'flour', 'eggs'];

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedProduct]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (reportType === 'inflation') {
        const res = await reportService.getWeeklyInflation();
        data = res.data;
      } else if (reportType === 'comparison') {
        const res = await reportService.getStoreComparison(selectedProduct);
        data = res.data;
      } else if (reportType === 'trend') {
        const res = await reportService.getMonthlyTrend();
        data = res.data;
      }

      setReport(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reports & Analytics</h2>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="inflation"
              checked={reportType === 'inflation'}
              onChange={(e) => setReportType(e.target.value)}
            />
            <span>Weekly Inflation</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="comparison"
              checked={reportType === 'comparison'}
              onChange={(e) => setReportType(e.target.value)}
            />
            <span>Store Comparison</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="trend"
              checked={reportType === 'trend'}
              onChange={(e) => setReportType(e.target.value)}
            />
            <span>Monthly Trends</span>
          </label>
        </div>

        {reportType === 'comparison' && (
          <div>
            <label className="block text-sm font-semibold mb-2">Select Product:</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="border rounded px-3 py-2 w-full md:w-48"
            >
              {products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && <div className="text-gray-500">Loading report...</div>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          Error: {error}
        </div>
      )}

      {report && reportType === 'inflation' && <InflationReport data={report} />}
      {report && reportType === 'comparison' && <ComparisonReport data={report} />}
      {report && reportType === 'trend' && <TrendReport data={report} />}
    </div>
  );
}

function InflationReport({ data }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Weekly Inflation Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.products.map((product) => (
          <div key={product.name} className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold capitalize mb-2">{product.name}</h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-600">Avg Price:</span>{' '}
                <span className="font-semibold">${product.currentAvg.toFixed(2)}</span>
              </p>
              <p>
                <span className="text-gray-600">Range:</span>{' '}
                <span className="font-semibold">
                  ${product.minPrice.toFixed(2)} - ${product.maxPrice.toFixed(2)}
                </span>
              </p>
              {product.weekOverWeekChange !== null && (
                <p>
                  <span className="text-gray-600">Week-over-Week:</span>{' '}
                  <span
                    className={`font-semibold ${product.weekOverWeekChange > 0 ? 'text-red-700' : 'text-green-700'
                      }`}
                  >
                    {product.weekOverWeekChange > 0 ? '+' : ''}
                    {product.weekOverWeekChange}%
                  </span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonReport({ data }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold capitalize">{data.productName} - Store Comparison</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-green-50">
          <p className="text-sm text-gray-600">Cheapest</p>
          <p className="text-2xl font-bold text-green-700">${data.cheapestStore.avgPrice}</p>
          <p className="text-sm font-semibold">{data.cheapestStore.name}</p>
        </div>
        <div className="border rounded-lg p-4 bg-orange-50">
          <p className="text-sm text-gray-600">Savings Potential</p>
          <p className="text-2xl font-bold text-orange-700">{data.potentialSavings}%</p>
          <p className="text-sm">vs most expensive store</p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">Store</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Avg Price</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Range</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Data Points</th>
            </tr>
          </thead>
          <tbody>
            {data.stores.map((store, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 text-sm">{store.name}</td>
                <td className="px-4 py-2 text-sm font-semibold">${store.avgPrice}</td>
                <td className="px-4 py-2 text-sm">
                  ${store.minPrice} - ${store.maxPrice}
                </td>
                <td className="px-4 py-2 text-sm">{store.dataPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendReport({ data }) {
  const chartData = [];

  // Transform data for charts
  Object.entries(data.products).forEach(([productName, history]) => {
    // Take last 30 days
    history.slice(-30).forEach((point) => {
      let dateEntry = chartData.find((d) => d.date === point.date);
      if (!dateEntry) {
        dateEntry = { date: point.date };
        chartData.push(dateEntry);
      }
      dateEntry[productName] = point.price;
    });
  });

  const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">30-Day Price Trends</h3>

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
            {Object.keys(data.products).map((product, idx) => (
              <Line
                key={product}
                type="monotone"
                dataKey={product}
                stroke={colors[idx % colors.length]}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
