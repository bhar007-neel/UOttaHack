# BargainBasket - Technical Pitch Presentation

---

## **Problem**
Low-income households struggle to find the best grocery deals across multiple stores, wasting time and money on inefficient shopping.

---

## **Solution: BargainBasket**
A real-time price comparison and alert platform that tracks grocery prices across multiple retailers and helps customers find the best deals instantly.

---

## **Key Features**

### 1. **Real-Time Price Tracking**
   - Automated price collection from multiple stores
   - Live pricing dashboard
   - Product availability monitoring

### 2. **Smart Price Comparison**
   - One-click comparison across stores
   - Identifies cheapest retailers per product
   - Store ranking by value

### 3. **Intelligent Alerts**
   - Price drop notifications
   - Stock availability alerts
   - Personalized watchlists

### 4. **Weekly Insights**
   - Price trend analysis
   - Week-over-week comparisons
   - Savings recommendations

### 5. **Admin Dashboard**
   - Product tracking management
   - Data visibility and reporting
   - System health monitoring

---

## **Technology Stack**

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router, TailwindCSS |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite |
| **Data Source** | Yellowcake API |
| **Visualization** | Recharts |

---

## **Architecture Overview**

```
┌─────────────────────────────────────────┐
│     Frontend (React)                    │
│  • Dashboard • Alerts • Reports • Admin │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│     REST API (Express.js)               │
│  • Prices • Alerts • Reports • Admin    │
└─────────────┬───────────────────────────┘
              │
     ┌────────┴────────┐
     │                 │
┌────▼────┐    ┌──────▼──────┐
│ SQLite  │    │ Yellowcake  │
│ Database│    │ API         │
└─────────┘    └─────────────┘
```

---

## **How It Works**

**1. Data Collection**
   - Scheduled jobs scrape prices from Yellowcake API
   - Store data in SQLite database

**2. Price Analysis**
   - Compare prices across retailers
   - Calculate trends and discounts
   - Identify best deals

**3. User Engagement**
   - Display current prices and cheapest stores
   - Send alerts for price drops
   - Generate weekly reports

**4. Admin Management**
   - Track products being monitored
   - View system analytics
   - Manage tracked stores

---

## **Impact**

✅ **Saves customers money** - Find best deals instantly  
✅ **Saves time** - No need to visit multiple stores  
✅ **Data-driven** - Price trends and insights  
✅ **Scalable** - Easily add new stores and products  
✅ **User-friendly** - Simple, intuitive interface  

---

## **Next Steps**

- [ ] Connect additional retail APIs
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and ML-based recommendations
- [ ] Community features (sharing deals)
- [ ] Deployment to production

---

## **Contact**
Questions? Let's talk about how BargainBasket can revolutionize grocery shopping!
