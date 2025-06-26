// Import currency utilities
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
  'p.': 'BYN',
  'сом': 'KGS',
  '₾': 'GEL',
  '֏': 'AMD',
  '؋': 'AFN',
  'Lek': 'ALL',
  'ƒ': 'AWG',
  'BZ$': 'BZD',
  '$b': 'BOB',
  'P': 'BWP',
  'FC': 'CDF',
  '₡': 'CRC',
  'RD$': 'DOP',
  '¢': 'GHC',
  'Q': 'GTQ',
  'L': 'HNL',
  'Rp': 'IDR',
  '﷼': 'IRR',
  'J$': 'JMD',
  '₭': 'LAK',
  'L': 'LSL',
  'Lt': 'LTL',
  'Ls': 'LVL',
  'RM': 'MYR',
  '₨': ['MUR', 'NPR', 'LKR'],
  'C$': 'NIO',
  '₦': 'NGN',
  'S/.': 'PEN',
  'zł': 'PLN',
  'lei': ['RON', 'MDL'],
  'S': ['SOS', 'SZL'],
  'TT$': 'TTD',
  '$U': 'UYU',
  'Bs': 'VEF',
  'Z$': 'ZWD'
};

// Common currency codes for quick lookup
const CURRENCY_CODES = new Set(
  Object.values(CURRENCY_SYMBOLS).flatMap(code => 
    Array.isArray(code) ? code : [code]
  )
);

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
          currencyCode: Array.isArray(code) ? code[0] : code
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

// Default settings
const DEFAULT_SETTINGS = {
  defaultCurrency: 'USD',
  apiKey: '' // In a real app, you'd want to get this from a secure source
};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    }
  });

  // Create context menu item
  chrome.contextMenus.create({
    id: 'convertPrice',
    title: 'Convert price to...',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'convertPrice') {
    const selectedText = info.selectionText.trim();
    
    // Extract currency and amount from selection
    const currencyInfo = extractCurrencyAndAmount(selectedText);
    
    if (!currencyInfo || isNaN(currencyInfo.amount)) {
      showNotification('Invalid selection', 'Please select a valid price to convert');
      return;
    }

    // Get user settings
    const { settings } = await chrome.storage.sync.get('settings');
    const { defaultCurrency } = settings || DEFAULT_SETTINGS;
    
    // If we couldn't detect the currency, prompt the user
    let fromCurrency = currencyInfo.currencyCode;
    if (!fromCurrency) {
      try {
        // Inject the prompt script into the active tab
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (amount) => {
            // This function runs in the context of the web page
            const promptForCurrency = async (amount) => {
              return new Promise((resolve) => {
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
                
                const dialog = document.createElement('div');
                dialog.style.backgroundColor = 'white';
                dialog.style.padding = '20px';
                dialog.style.borderRadius = '8px';
                dialog.style.width = '300px';
                dialog.style.maxWidth = '90%';
                
                dialog.innerHTML = `
                  <h3 style="margin-top: 0;">Select Currency</h3>
                  <p>Please select the currency for ${amount}</p>
                  <select id="currency-select" style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">-- Select Currency --</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                    <option value="JPY">Japanese Yen (JPY)</option>
                    <option value="AUD">Australian Dollar (AUD)</option>
                    <option value="CAD">Canadian Dollar (CAD)</option>
                    <option value="CHF">Swiss Franc (CHF)</option>
                    <option value="CNY">Chinese Yuan (CNY)</option>
                    <option value="INR">Indian Rupee (INR)</option>
                  </select>
                  <div style="display: flex; justify-content: flex-end; margin-top: 15px; gap: 10px;">
                    <button id="cancel-btn" style="padding: 8px 16px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button id="convert-btn" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Convert</button>
                  </div>
                `;
                
                return new Promise((resolve) => {
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
                  
                  modal.appendChild(dialog);
                  document.body.appendChild(modal);
                });
              });
            };
            
            return await promptForCurrency(amount);
          },
          args: [currencyInfo.amount]
        });
        
        fromCurrency = results[0].result;
        
        if (!fromCurrency) {
          showNotification('Conversion cancelled', 'No currency selected');
          return;
        }
      } catch (error) {
        console.error('Error showing currency prompt:', error);
        showNotification('Error', 'Could not show currency selection. Using USD as default.');
        fromCurrency = 'USD';
      }
    }

    // Show popup with the amount and detected/prompted currency
    chrome.windows.create({
      url: `popup.html?amount=${currencyInfo.amount}&from=${fromCurrency}`,
      type: 'popup',
      width: 320,
      height: 300
    });
  }
});

// Function to show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: title,
    message: message
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convert') {
    convertCurrency(request.amount, request.from, request.to)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async sendResponse
  }
});

// Function to convert currency using exchangerate.host API
async function convertCurrency(amount, from, to) {
  try {
    const response = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to convert currency');
    }
    
    return {
      amount: data.query.amount,
      from: data.query.from,
      to: data.query.to,
      result: data.result,
      rate: data.info.rate,
      date: data.date
    };
  } catch (error) {
    console.error('Conversion error:', error);
    throw new Error('Failed to convert currency. Please try again later.');
  }
}
