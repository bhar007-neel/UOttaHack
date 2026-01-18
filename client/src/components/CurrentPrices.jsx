import React, { useState, useEffect } from 'react';
import { priceService } from '../services/api';
import { getRelativeTime } from '../utils/formatTime';

export default function CurrentPrices() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await priceService.getCurrentPrices();
      setPrices(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && Object.keys(prices).length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading prices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
        Error loading prices: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Current Prices</h2>
        <button
          onClick={fetchPrices}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {Object.entries(prices).map(([productName, listings]) => (
        <div key={productName} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-4 border-b">
            <h3 className="text-lg font-semibold capitalize">{productName}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Store</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Discount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listings.map((listing, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{listing.storeName}</td>
                    <td className="px-6 py-4 text-sm font-semibold">${listing.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      {listing.discount > 0 ? (
                        <span className="text-green-700 font-semibold">{listing.discount}% OFF</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-sm ${listing.availability === 'in_stock'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {listing.availability === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {getRelativeTime(listing.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
