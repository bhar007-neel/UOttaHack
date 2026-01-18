/**
 * Normalize prices to common units (e.g., $/kg, $/item)
 */

class PriceNormalizer {
  /**
   * Parse a price string and extract numeric value
   * @param {string} priceStr - Price string (e.g., "$5.99", "€3,50")
   * @returns {number} Numeric price value
   */
  static parsePrice(priceStr) {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return null;

    // Remove currency symbols and commas, replace common decimal separators
    const normalized = priceStr
      .replace(/[^\d.,]/g, '') // Remove non-numeric characters except . and ,
      .replace(/,(\d{3})/g, '$1') // Handle 1,000 format
      .replace(',', '.'); // Handle European decimal

    return parseFloat(normalized);
  }

  /**
   * Extract weight from a unit string
   * @param {string} unitStr - Unit string (e.g., "500g", "2 lbs", "1 kg")
   * @returns {Object} {value: number, unit: string}
   */
  static parseUnit(unitStr) {
    if (!unitStr) return { value: 1, unit: 'item' };

    const match = unitStr.match(/(\d+\.?\d*)\s*([a-zA-Z]+)/i);
    if (!match) return { value: 1, unit: 'item' };

    return {
      value: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
    };
  }

  /**
   * Convert weight to kilograms
   * @param {number} value - Numeric value
   * @param {string} unit - Original unit (g, kg, lb, oz, etc.)
   * @returns {number} Weight in kilograms
   */
  static toKilograms(value, unit) {
    const conversions = {
      'kg': 1,
      'g': 0.001,
      'mg': 0.000001,
      'lb': 0.453592,
      'lbs': 0.453592,
      'oz': 0.0283495,
      'ml': 0.001, // Assume 1:1 with grams for liquids
      'l': 1,
      'liters': 1,
    };

    const factor = conversions[unit.toLowerCase()] || 1;
    return value * factor;
  }

  /**
   * Normalize a product price to $/kg or $/item
   * @param {number} price - Price in dollars
   * @param {string} unit - Unit string (e.g., "500g", "2.5 kg", "item")
   * @returns {Object} {normalizedPrice: number, unit: string}
   */
  static normalizePrice(price, unit = 'item') {
    const parsed = this.parseUnit(unit);

    if (parsed.unit === 'item') {
      return {
        normalizedPrice: price,
        unit: 'item',
        originalPrice: price,
        originalUnit: unit,
      };
    }

    const weightInKg = this.toKilograms(parsed.value, parsed.unit);
    if (weightInKg === 0) {
      return {
        normalizedPrice: price,
        unit: 'item',
        originalPrice: price,
        originalUnit: unit,
      };
    }

    return {
      normalizedPrice: price / weightInKg,
      unit: '/kg',
      originalPrice: price,
      originalUnit: unit,
    };
  }

  /**
   * Extract discount percentage
   * @param {number|string} originalPrice - Original price
   * @param {number|string} salePrice - Sale/current price
   * @returns {number} Discount percentage (0-100)
   */
  static calculateDiscount(originalPrice, salePrice) {
    const orig = this.parsePrice(originalPrice);
    const sale = this.parsePrice(salePrice);

    if (!orig || !sale || orig === 0) return 0;

    return Math.round(((orig - sale) / orig) * 100);
  }

  /**
   * Normalize a complete product listing
   * @param {Object} product - Product object with price, unit, original_price
   * @returns {Object} Normalized product
   */
  static normalizeProduct(product) {
    const price = this.parsePrice(product.price);
    const originalPrice = product.original_price
      ? this.parsePrice(product.original_price)
      : price;

    const normalized = this.normalizePrice(price, product.unit);
    const discount = this.calculateDiscount(originalPrice, price);

    return {
      title: product.title,
      originalPrice: originalPrice,
      currentPrice: price,
      normalizedPrice: normalized.normalizedPrice,
      normalizedUnit: normalized.unit,
      discount: discount,
      availability: product.availability || 'unknown',
      unit: product.unit,
      url: product.url,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = PriceNormalizer;
