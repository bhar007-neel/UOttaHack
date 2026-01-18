import React, { useState, useEffect } from 'react';
import { priceService } from '../services/api';

export default function CheapestStores() {
  const [cheapest, setCheapest] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCheapest();
  }, []);

  const fetchCheapest = async () => {
    try {
      setLoading(true);
      const response = await priceService.getCheapestStores();
      setCheapest(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching cheapest stores:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(cheapest).map(([product, data]) => (
        <div key={product} className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold capitalize text-lg">{product}</h3>
          <div className="mt-2 space-y-1">
            <p className="text-2xl font-bold text-green-700">${data.price.toFixed(2)}</p>
            <p className="text-sm text-gray-600">at {data.store}</p>
            {data.discount > 0 && (
              <p className="text-sm text-green-700 font-semibold">{data.discount}% off</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Status: {data.availability === 'in_stock' ? '✓ In Stock' : '✗ Out of Stock'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
