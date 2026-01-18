import React, { useState, useEffect } from 'react';
import { alertService } from '../services/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2 * 60 * 1000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const [alertsRes, unreadRes] = await Promise.all([
        alertService.getAlerts(20),
        alertService.getUnreadCount(),
      ]);
      setAlerts(alertsRes.data);
      setUnreadCount(unreadRes.data.unreadCount);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await alertService.markAsRead(id);
      fetchAlerts();
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await alertService.dismissAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  if (loading && alerts.length === 0) {
    return <div className="text-gray-500">Loading alerts...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
        Error: {error}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded p-4 text-blue-700">
        No price spike alerts detected. Everything looks good!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Price Alerts</h2>
        {unreadCount > 0 && (
          <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-semibold">
            {unreadCount} new
          </span>
        )}
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${alert.read ? 'bg-gray-50' : 'bg-yellow-50 border-yellow-300'
              } ${alert.severity === 'high' ? 'border-red-300' : 'border-yellow-300'}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold capitalize">{alert.productName}</h3>
                <p className="text-sm text-gray-600">{alert.storeName}</p>

                <div className="mt-2 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Previous Price</p>
                    <p className="text-lg font-semibold">${alert.previousPrice?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Price</p>
                    <p className="text-lg font-semibold">${alert.currentPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Change</p>
                    <p className={`text-lg font-semibold ${alert.priceChange > 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {alert.priceChange > 0 ? '+' : ''}{alert.priceChange.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${alert.severity === 'high'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-yellow-200 text-yellow-800'
                    }`}
                >
                  {alert.severity.toUpperCase()} SPIKE
                </span>
              </div>

              <div className="flex gap-2">
                {!alert.read && (
                  <button
                    onClick={() => handleMarkAsRead(alert.id)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
