import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, RefreshCw, Globe } from 'lucide-react';
import { CurrencyRate } from '../../types';
import { APIService } from '../../services/api';
import { motion } from 'framer-motion';

interface CurrencyWidgetProps {
  baseCurrency: string;
}

interface CurrencyOption {
  code: string;
  name: string;
  country: string;
  symbol: string;
}

const currencies: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', country: 'United States', symbol: '$' },
  { code: 'EUR', name: 'Euro', country: 'European Union', symbol: '€' },
  { code: 'GBP', name: 'British Pound', country: 'United Kingdom', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', country: 'Japan', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', country: 'Canada', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', country: 'Australia', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', country: 'Switzerland', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', country: 'China', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', country: 'India', symbol: '₹' },
  { code: 'KRW', name: 'South Korean Won', country: 'South Korea', symbol: '₩' },
  { code: 'SGD', name: 'Singapore Dollar', country: 'Singapore', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', country: 'Hong Kong', symbol: 'HK$' },
  { code: 'NOK', name: 'Norwegian Krone', country: 'Norway', symbol: 'kr' },
  { code: 'SEK', name: 'Swedish Krona', country: 'Sweden', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', country: 'Denmark', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', country: 'Poland', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', country: 'Czech Republic', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', country: 'Hungary', symbol: 'Ft' },
  { code: 'RUB', name: 'Russian Ruble', country: 'Russia', symbol: '₽' },
  { code: 'BRL', name: 'Brazilian Real', country: 'Brazil', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', country: 'Mexico', symbol: '$' },
  { code: 'ARS', name: 'Argentine Peso', country: 'Argentina', symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', country: 'Chile', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', country: 'Colombia', symbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', country: 'Peru', symbol: 'S/' },
  { code: 'ZAR', name: 'South African Rand', country: 'South Africa', symbol: 'R' },
  { code: 'EGP', name: 'Egyptian Pound', country: 'Egypt', symbol: '£' },
  { code: 'MAD', name: 'Moroccan Dirham', country: 'Morocco', symbol: 'DH' },
  { code: 'NGN', name: 'Nigerian Naira', country: 'Nigeria', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', country: 'Kenya', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', country: 'Ghana', symbol: '₵' },
  { code: 'TRY', name: 'Turkish Lira', country: 'Turkey', symbol: '₺' },
  { code: 'AED', name: 'UAE Dirham', country: 'United Arab Emirates', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', country: 'Saudi Arabia', symbol: '﷼' },
  { code: 'QAR', name: 'Qatari Riyal', country: 'Qatar', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', country: 'Kuwait', symbol: 'د.ك' },
  { code: 'BHD', name: 'Bahraini Dinar', country: 'Bahrain', symbol: '.د.ب' },
  { code: 'OMR', name: 'Omani Rial', country: 'Oman', symbol: '﷼' },
  { code: 'JOD', name: 'Jordanian Dinar', country: 'Jordan', symbol: 'د.ا' },
  { code: 'LBP', name: 'Lebanese Pound', country: 'Lebanon', symbol: '£' },
  { code: 'ILS', name: 'Israeli Shekel', country: 'Israel', symbol: '₪' },
  { code: 'THB', name: 'Thai Baht', country: 'Thailand', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', country: 'Malaysia', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', country: 'Indonesia', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', country: 'Philippines', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', country: 'Vietnam', symbol: '₫' },
  { code: 'TWD', name: 'Taiwan Dollar', country: 'Taiwan', symbol: 'NT$' },
  { code: 'NZD', name: 'New Zealand Dollar', country: 'New Zealand', symbol: 'NZ$' },
  { code: 'FJD', name: 'Fijian Dollar', country: 'Fiji', symbol: 'FJ$' }
];

export function CurrencyWidget({ baseCurrency }: CurrencyWidgetProps) {
  const [amount, setAmount] = useState(100);
  const [fromCurrency, setFromCurrency] = useState(baseCurrency);
  const [toCurrency, setToCurrency] = useState('EUR');
  const [rate, setRate] = useState<CurrencyRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  const getSymbol = (currencyCode: string) => {
    return currencies.find(c => c.code === currencyCode)?.symbol || currencyCode;
  };

  const filteredFromCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchFrom.toLowerCase()) ||
    currency.country.toLowerCase().includes(searchFrom.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchFrom.toLowerCase())
  );

  const filteredToCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchTo.toLowerCase()) ||
    currency.country.toLowerCase().includes(searchTo.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTo.toLowerCase())
  );

  const fetchRate = async () => {
    if (fromCurrency === toCurrency) {
      setRate({
        from: fromCurrency,
        to: toCurrency,
        rate: 1,
        last_updated: new Date().toISOString()
      });
      return;
    }
    
    setLoading(true);
    try {
      const rateData = await APIService.getCurrencyRates(fromCurrency, toCurrency);
      setRate(rateData);
    } catch (error) {
      console.error('Failed to fetch currency rate:', error);
      // Set fallback rate on error
      setRate({
        from: fromCurrency,
        to: toCurrency,
        rate: 1,
        last_updated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
  }, [fromCurrency, toCurrency]);

  const convertedAmount = rate ? amount * rate.rate : 0;
  const safeConvertedAmount = isNaN(convertedAmount) ? 0 : convertedAmount;

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
          <Globe className="h-4 w-4 text-green-600" />
          <span>Currency Converter</span>
        </h3>
        <button
          onClick={fetchRate}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base font-medium"
            placeholder="Enter amount"
          />
        </div>

        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search currency..."
              value={searchFrom}
              onChange={(e) => setSearchFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              {filteredFromCurrencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.country} - {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapCurrencies}
            className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-full transition-colors"
            title="Swap currencies"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search currency..."
              value={searchTo}
              onChange={(e) => setSearchTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            >
              {filteredToCurrencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.country} - {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversion Result */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-center">
            <div className="text-base font-bold text-green-800 mb-2">
              {getSymbol(fromCurrency)} {amount.toLocaleString()} = {getSymbol(toCurrency)} {safeConvertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {rate && (
              <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>
                  1 {fromCurrency} = {(rate.rate || 0).toFixed(4)} {toCurrency}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Convert */}
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Convert</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[1, 10, 100, 1000].map(quickAmount => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-center font-medium"
              >
                {getSymbol(fromCurrency)} {quickAmount}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}