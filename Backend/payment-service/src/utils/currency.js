class CurrencyUtils {
  /**
   * Convert amount to smallest currency unit
   * VND: no decimals (1 VND = 1)
   * USD: 2 decimals (1 USD = 100 cents)
   */
  toSmallestUnit(amount, currency) {
    const multipliers = {
      VND: 1,
      USD: 100,
      EUR: 100,
    };
    return Math.round(amount * (multipliers[currency] || 1));
  }

  /**
   * Convert from smallest unit to standard
   */
  fromSmallestUnit(amount, currency) {
    const divisors = {
      VND: 1,
      USD: 100,
      EUR: 100,
    };
    return amount / (divisors[currency] || 1);
  }

  /**
   * Format amount for display
   */
  format(amount, currency = 'VND') {
    const formatters = {
      VND: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }),
      USD: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
    };

    const formatter = formatters[currency] || formatters.VND;
    return formatter.format(amount);
  }

  /**
   * Convert VND to USD (for international payments)
   */
  convertVndToUsd(amountVnd, exchangeRate = 24000) {
    return Math.round((amountVnd / exchangeRate) * 100) / 100;
  }

  /**
   * Convert USD to VND
   */
  convertUsdToVnd(amountUsd, exchangeRate = 24000) {
    return Math.round(amountUsd * exchangeRate);
  }
}

module.exports = new CurrencyUtils();