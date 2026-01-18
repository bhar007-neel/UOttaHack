import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CurrentPrices from './components/CurrentPrices';
import CheapestStores from './components/CheapestStores';
import Alerts from './components/Alerts';
import Reports from './components/Reports';
import Admin from './components/Admin';
import api from './services/api';
import './App.css';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🛒</div>
              <h1 className="text-2xl font-bold text-gray-800">Food Price Dashboard</h1>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded"
            >
              ☰
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex gap-6">
              <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link to="/prices" className="text-gray-600 hover:text-gray-900 font-medium">
                Prices
              </Link>
              <Link to="/alerts" className="text-gray-600 hover:text-gray-900 font-medium">
                Alerts
              </Link>
              <Link to="/reports" className="text-gray-600 hover:text-gray-900 font-medium">
                Reports
              </Link>
              <Link to="/admin" className="text-gray-600 hover:text-gray-900 font-medium">
                Manage Tracking
              </Link>
            </nav>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden border-t bg-gray-50 p-4 space-y-2">
              <Link
                to="/"
                className="block py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/prices"
                className="block py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Prices
              </Link>
              <Link
                to="/alerts"
                className="block py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Alerts
              </Link>
              <Link
                to="/reports"
                className="block py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Reports
              </Link>
              <Link
                to="/admin"
                className="block py-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Manage Tracking
              </Link>
            </nav>
          )}
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/prices" element={<CurrentPrices />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600 text-sm">
            <p>Food Price Dashboard • Helping low-income households save on groceries</p>
            <p className="mt-2">Powered by Yellowcake API</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function Dashboard() {
  const [productCount, setProductCount] = useState(0);
  const [storeCount, setStoreCount] = useState(0);

  React.useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await api.get('/admin/counts');
        setProductCount(res.data.productCount);
        setStoreCount(res.data.storeCount);
      } catch (err) {
        console.error('Failed to fetch counts:', err);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-4">Find the Best Grocery Deals</h2>
        <p className="text-xl text-blue-100 mb-6">
          Track prices across stores and save money on essentials like milk, rice, flour, and eggs.
        </p>
        <Link
          to="/prices"
          className="inline-block bg-white text-blue-600 font-bold py-3 px-6 rounded hover:bg-blue-50"
        >
          View Current Prices →
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 border-l-4 border-blue-600">
          <h3 className="text-gray-600 text-sm font-semibold">Tracked Products</h3>
          <p className="text-3xl font-bold mt-2">{productCount}</p>
          <p className="text-xs text-gray-500 mt-1">currently tracking</p>
        </div>
        <div className="bg-white rounded-lg p-6 border-l-4 border-green-600">
          <h3 className="text-gray-600 text-sm font-semibold">Stores Monitored</h3>
          <p className="text-3xl font-bold mt-2">{storeCount}</p>
          <p className="text-xs text-gray-500 mt-1">across your city</p>
        </div>
        <div className="bg-white rounded-lg p-6 border-l-4 border-orange-600">
          <h3 className="text-gray-600 text-sm font-semibold">Updated</h3>
          <p className="text-3xl font-bold mt-2">Every 6h</p>
          <p className="text-xs text-gray-500 mt-1">real-time pricing</p>
        </div>
      </div>

      {/* Dashboard sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cheapest stores */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold mb-4">💰 Best Deals Today</h3>
          <CheapestStores />
        </div>

        {/* Recent alerts */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold mb-4">🚨 Price Alerts</h3>
          <Alerts />
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
        <h3 className="text-2xl font-bold mb-6">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl mb-2">🔍</div>
            <h4 className="font-semibold mb-2">We Search</h4>
            <p className="text-gray-600">Our system scans grocery store websites daily using advanced web scraping technology.</p>
          </div>
          <div>
            <div className="text-3xl mb-2">📊</div>
            <h4 className="font-semibold mb-2">We Analyze</h4>
            <p className="text-gray-600">Prices are normalized to common units and compared across all stores.</p>
          </div>
          <div>
            <div className="text-3xl mb-2">💡</div>
            <h4 className="font-semibold mb-2">You Save</h4>
            <p className="text-gray-600">Get alerts on spikes, see where to shop, and track long-term savings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
