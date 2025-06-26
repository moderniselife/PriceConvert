// Currency symbols and their ISO codes
const CURRENCY_SYMBOLS = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₹': 'INR',
  'A$': 'AUD',
  'C$': 'CAD',
  'CHF': 'CHF',
  'CN¥': 'CNY',
  'HK$': 'HKD',
  'NZ$': 'NZD',
  '₩': 'KRW',
  '₽': 'RUB',
  'R$': 'BRL',
  'R': 'ZAR',
  'S$': 'SGD',
  'kr': ['SEK', 'NOK', 'DKK'],
  'zł': 'PLN',
  '₪': 'ILS',
  '₺': 'TRY',
  'د.إ': 'AED',
  'د.ب': 'BHD',
  'د.ك': 'KWD',
  'د.ع': 'IQD',
  'د.ج': 'DZD',
  'د.م.': 'MAD',
  'ر.س': 'SAR',
  'ر.ق': 'QAR',
  'ر.ي': 'YER',
  'ر.ع.': 'OMR',
  'ل.ل': 'LBP',
  'ل.س': 'SYP',
  'د.أ': 'JOD',
  '៛': 'KHR',
  '₫': 'VND',
  '฿': 'THB',
  '₴': 'UAH',
  '₸': 'KZT',
  '₱': 'PHP',
  '₲': 'PYG',
  '₼': 'AZN',
  'L': 'RON',
  'Kč': 'CZK',
  'Ft': 'HUF',
  'kn': 'HRK',
  'лв': 'BGN',
  'ден': 'MKD',
  'KM': 'BAM',
  'zł': 'PLN',
  'lei': 'MDL',
  'лв': 'BGN',
  'p.': 'BYN',
  'сом': 'KGS',
  'лв': 'BGN',
  '₾': 'GEL',
  '֏': 'AMD',
  '₼': 'AZN',
  '₸': 'KZT',
  'сом': 'KGS',
  '₽': 'RUB',
  '₴': 'UAH',
  '₸': 'KZT',
  '₺': 'TRY',
  '₼': 'AZN',
  '₾': 'GEL',
  '₴': 'UAH',
  '₸': 'KZT',
  '₺': 'TRY',
  '₼': 'AZN',
  '₾': 'GEL',
  '؋': 'AFN',
  'Lek': 'ALL',
  '֏': 'AMD',
  'ƒ': 'AWG',
  'BZ$': 'BZD',
  '$b': 'BOB',
  'P': 'BWP',
  'R$': 'BRL',
  'BZ$': 'BZD',
  'FC': 'CDF',
  '₡': 'CRC',
  '₡': 'SVC',
  'Kč': 'CZK',
  'kr': 'DKK',
  'RD$': 'DOP',
  '£': 'EGP',
  '€': 'EUR',
  '¢': 'GHC',
  'Q': 'GTQ',
  'L': 'HNL',
  'Ft': 'HUF',
  'Rp': 'IDR',
  '﷼': 'IRR',
  'J$': 'JMD',
  '₭': 'LAK',
  'L': 'LSL',
  'Lt': 'LTL',
  'Ls': 'LVL',
  'RM': 'MYR',
  '₨': 'MUR',
  '₨': 'NPR',
  'C$': 'NIO',
  '₦': 'NGN',
  'S/.': 'PEN',
  '₱': 'PHP',
  'zł': 'PLN',
  'Gs': 'PYG',
  'lei': 'RON',
  '₽': 'RUB',
  'S': 'SOS',
  'R': 'ZAR',
  '₨': 'LKR',
  'S': 'SZL',
  '฿': 'THB',
  'TT$': 'TTD',
  '₴': 'UAH',
  '$U': 'UYU',
  'Bs': 'VEF',
  '₫': 'VND',
  'Z$': 'ZWD'
};

// Common currency codes for quick lookup
const CURRENCY_CODES = new Set(Object.values(CURRENCY_SYMBOLS).flatMap(code => 
  Array.isArray(code) ? code : [code]
));

/**
 * Extracts the currency symbol and amount from a string
 * @param {string} text - The text to extract from (e.g., "€87.70")
 * @returns {Object} { symbol: string, amount: number, currencyCode: string } or null if no match
 */
function extractCurrencyAndAmount(text) {
  if (!text) return null;
  
  // First, try to find a currency symbol at the start of the string
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.startsWith(symbol)) {
      const amount = parseFloat(text.replace(symbol, '').trim().replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(amount)) {
        return {
          symbol,
          amount,
          currencyCode: Array.isArray(code) ? code[0] : code // Default to first code if multiple
        };
      }
    }
  }
  
  // If no symbol at start, try to find it at the end
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.endsWith(symbol)) {
      const amount = parseFloat(text.replace(symbol, '').trim().replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(amount)) {
        return {
          symbol,
          amount,
          currencyCode: Array.isArray(code) ? code[0] : code
        };
      }
    }
  }
  
  // Try to find a 3-letter currency code (ISO 4217)
  const currencyCodeMatch = text.match(/\b([A-Z]{3})\b/);
  if (currencyCodeMatch && CURRENCY_CODES.has(currencyCodeMatch[1])) {
    const amount = parseFloat(text.replace(currencyCodeMatch[1], '').trim().replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(amount)) {
      return {
        symbol: currencyCodeMatch[1],
        amount,
        currencyCode: currencyCodeMatch[1]
      };
    }
  }
  
  // If we couldn't determine the currency, try to extract just the amount
  const amountMatch = text.match(/[\d.,]+/);
  if (amountMatch) {
    const amount = parseFloat(amountMatch[0].replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!isNaN(amount)) {
      return {
        symbol: '',
        amount,
        currencyCode: ''
      };
    }
  }
  
  return null;
}

/**
 * Prompts the user to select a currency from a list
 * @param {string[]} currencies - Array of currency codes to show in the prompt
 * @returns {Promise<string>} Selected currency code
 */
async function promptForCurrency(amount) {
  return new Promise((resolve) => {
    // Create a modal dialog
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000';
    
    // Create dialog content
    const dialog = document.createElement('div');
    dialog.style.backgroundColor = 'white';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '8px';
    dialog.style.width = '300px';
    dialog.style.maxWidth = '90%';
    
    dialog.innerHTML = `
      <h3>Select Currency</h3>
      <p>Please select the currency for ${amount}</p>
      <select id="currency-select" style="width: 100%; padding: 8px; margin: 10px 0;">
        <option value="">-- Select Currency --</option>
        <option value="USD">US Dollar (USD)</option>
        <option value="EUR">Euro (EUR)</option>
        <option value="GBP">British Pound (GBP)</option>
        <option value="JPY">Japanese Yen (JPY)</option>
        <option value="AUD">Australian Dollar (AUD)</option>
        <option value="CAD">Canadian Dollar (CAD)</option>
        <option value="CHF">Swiss Franc (CHF)</option>
        <option value="CNY">Chinese Yuan (CNY)</option>
      </select>
      <div style="display: flex; justify-content: flex-end; margin-top: 15px;">
        <button id="cancel-btn" style="margin-right: 10px; padding: 5px 10px;">Cancel</button>
        <button id="convert-btn" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px;">Convert</button>
      </div>
    `;
    
    // Add event listeners
    dialog.querySelector('#convert-btn').addEventListener('click', () => {
      const select = dialog.querySelector('#currency-select');
      if (select.value) {
        document.body.removeChild(modal);
        resolve(select.value);
      }
    });
    
    dialog.querySelector('#cancel-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(null);
    });
    
    // Add to document
    dialog.appendChild(modal);
    document.body.appendChild(dialog);
  });
}

export { extractCurrencyAndAmount, promptForCurrency };
