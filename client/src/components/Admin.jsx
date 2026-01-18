import React, { useEffect, useState } from 'react';
import { adminService, scraperService } from '../services/api';

export default function Admin() {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Scraper states
    const [scrapingStatus, setScrapingStatus] = useState({
        isActive: false,
        progress: 0,
        message: '',
        productsScraped: 0,
    });
    const [scrapingEnabled, setScrapingEnabled] = useState(false);

    // Form states
    const [newProduct, setNewProduct] = useState({ name: '', unit: 'item' });
    const [editingProduct, setEditingProduct] = useState(null);
    const [newStore, setNewStore] = useState({ name: '', url: '' });
    const [editingStore, setEditingStore] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    // Poll for scraping status
    useEffect(() => {
        if (!scrapingEnabled) return;

        const interval = setInterval(async () => {
            try {
                const res = await scraperService.getStatus();
                setScrapingStatus(res.data);
                if (!res.data.isActive) {
                    setScrapingEnabled(false);
                }
            } catch (err) {
                console.error('Failed to get scraping status:', err);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [scrapingEnabled]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [productsRes, storesRes] = await Promise.all([
                adminService.getProducts(),
                adminService.getStores(),
            ]);
            setProducts(productsRes.data.products || []);
            setStores(storesRes.data.stores || []);
            setError(null);
        } catch (err) {
            setError('Failed to load data: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Product handlers
    const handleAddProduct = async () => {
        if (!newProduct.name.trim()) {
            setError('Product name is required');
            return;
        }

        try {
            const res = await adminService.addProduct(newProduct.name, newProduct.unit || 'item');
            setProducts([...products, res.data]);
            setNewProduct({ name: '', unit: 'item' });
            setError(null);

            // Start scraping after product is added
            setScrapingStatus({ isActive: true, progress: 0, message: 'Starting price collection...', productsScraped: 0 });
            setScrapingEnabled(true);

            try {
                await scraperService.startScraping(res.data.id);
            } catch (scraperErr) {
                console.error('Failed to start scraping:', scraperErr);
                setError('Product added but scraping failed to start: ' + scraperErr.message);
            }
        } catch (err) {
            setError('Failed to add product: ' + err.message);
        }
    };

    const handleUpdateProduct = async () => {
        if (!editingProduct.name.trim()) {
            setError('Product name is required');
            return;
        }

        try {
            const res = await adminService.updateProduct(editingProduct.id, editingProduct.name, editingProduct.unit);
            setProducts(products.map(p => p.id === editingProduct.id ? res.data : p));
            setEditingProduct(null);
            setError(null);
        } catch (err) {
            setError('Failed to update product: ' + err.message);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Delete this product?')) return;

        try {
            await adminService.deleteProduct(id);
            setProducts(products.filter(p => p.id !== id));
            setError(null);
        } catch (err) {
            setError('Failed to delete product: ' + err.message);
        }
    };

    // Store handlers
    const handleAddStore = async () => {
        if (!newStore.name.trim()) {
            setError('Store name is required');
            return;
        }

        try {
            const res = await adminService.addStore(newStore.name, newStore.url);
            setStores([...stores, res.data]);
            setNewStore({ name: '', url: '' });
            setError(null);
        } catch (err) {
            setError('Failed to add store: ' + err.message);
        }
    };

    const handleUpdateStore = async () => {
        if (!editingStore.name.trim()) {
            setError('Store name is required');
            return;
        }

        try {
            const res = await adminService.updateStore(editingStore.id, editingStore.name, editingStore.url);
            setStores(stores.map(s => s.id === editingStore.id ? res.data : s));
            setEditingStore(null);
            setError(null);
        } catch (err) {
            setError('Failed to update store: ' + err.message);
        }
    };

    const handleDeleteStore = async (id) => {
        if (!window.confirm('Delete this store?')) return;

        try {
            await adminService.deleteStore(id);
            setStores(stores.filter(s => s.id !== id));
            setError(null);
        } catch (err) {
            setError('Failed to delete store: ' + err.message);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold">Manage Your Tracking</h1>
            <p className="text-gray-600 text-lg">Add or edit the products and stores you want to track for price monitoring.</p>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Scraping Progress Display */}
            {scrapingStatus.isActive || scrapingStatus.progress === 100 ? (
                <div className={`rounded-lg p-6 shadow border ${scrapingStatus.progress === 100
                    ? 'bg-green-50 border-green-200'
                    : 'bg-blue-50 border-blue-200'
                    }`}>
                    <h3 className="text-lg font-semibold mb-2">
                        {scrapingStatus.progress === 100 ? '✓ Collection Complete!' : 'Price Collection in Progress'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">{scrapingStatus.message}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                            className={`h-2 rounded-full transition-all ${scrapingStatus.progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                                }`}
                            style={{ width: `${scrapingStatus.progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                        {scrapingStatus.progress}% complete • Products scraped: {scrapingStatus.productsScraped}
                    </p>
                </div>
            ) : null}

            {/* Tabs */}
            <div className="flex gap-4 border-b">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`px-4 py-2 font-semibold ${activeTab === 'products'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Products ({products.length})
                </button>
                <button
                    onClick={() => setActiveTab('stores')}
                    className={`px-4 py-2 font-semibold ${activeTab === 'stores'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Stores ({stores.length})
                </button>
            </div>

            {loading && <div className="text-gray-500">Loading...</div>}

            {/* Products Tab */}
            {activeTab === 'products' && !loading && (
                <div className="space-y-8">
                    {/* Add new product */}
                    <div className="bg-white rounded-lg p-6 shadow">
                        <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
                        <p className="text-sm text-gray-600 mb-4">Unit defaults to "item" if not specified</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Product name (e.g., milk)"
                                value={newProduct.name}
                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                className="px-3 py-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Unit (e.g., L, kg, dozen)"
                                value={newProduct.unit}
                                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                className="px-3 py-2 border rounded"
                            />
                            <button
                                onClick={handleAddProduct}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Add Product
                            </button>
                        </div>
                    </div>

                    {/* Edit product */}
                    {editingProduct && (
                        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                            <h3 className="text-xl font-bold mb-4">Edit Product</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="px-3 py-2 border rounded"
                                />
                                <input
                                    type="text"
                                    value={editingProduct.unit}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                                    className="px-3 py-2 border rounded"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUpdateProduct}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex-1"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingProduct(null)}
                                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products list */}
                    <div className="bg-white rounded-lg p-6 shadow">
                        <h3 className="text-xl font-bold mb-4">Tracked Products</h3>
                        {products.length === 0 ? (
                            <p className="text-gray-500">No products yet</p>
                        ) : (
                            <div className="space-y-2">
                                {products.map((product) => (
                                    <div key={product.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                                        <div>
                                            <p className="font-semibold capitalize">{product.name}</p>
                                            <p className="text-sm text-gray-500">Unit: {product.unit}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingProduct(product)}
                                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stores Tab */}
            {activeTab === 'stores' && !loading && (
                <div className="space-y-8">
                    {/* Add new store */}
                    <div className="bg-white rounded-lg p-6 shadow">
                        <h2 className="text-2xl font-bold mb-4">Add New Store</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Store name (e.g., Loblaws)"
                                value={newStore.name}
                                onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                                className="px-3 py-2 border rounded"
                            />
                            <input
                                type="url"
                                placeholder="Website URL (e.g., https://www.loblaws.ca)"
                                value={newStore.url}
                                onChange={(e) => setNewStore({ ...newStore, url: e.target.value })}
                                className="px-3 py-2 border rounded"
                            />
                            <button
                                onClick={handleAddStore}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Add Store
                            </button>
                        </div>
                    </div>

                    {/* Edit store */}
                    {editingStore && (
                        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                            <h3 className="text-xl font-bold mb-4">Edit Store</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    value={editingStore.name}
                                    onChange={(e) => setEditingStore({ ...editingStore, name: e.target.value })}
                                    className="px-3 py-2 border rounded"
                                />
                                <input
                                    type="url"
                                    value={editingStore.url}
                                    onChange={(e) => setEditingStore({ ...editingStore, url: e.target.value })}
                                    className="px-3 py-2 border rounded"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUpdateStore}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex-1"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingStore(null)}
                                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex-1"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stores list */}
                    <div className="bg-white rounded-lg p-6 shadow">
                        <h3 className="text-xl font-bold mb-4">Monitored Stores</h3>
                        {stores.length === 0 ? (
                            <p className="text-gray-500">No stores yet</p>
                        ) : (
                            <div className="space-y-2">
                                {stores.map((store) => (
                                    <div key={store.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                                        <div>
                                            <p className="font-semibold">{store.name}</p>
                                            <p className="text-sm text-gray-500 break-all">{store.url || 'No URL'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingStore(store)}
                                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStore(store.id)}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
