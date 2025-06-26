document.addEventListener('DOMContentLoaded', () => {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const amount = parseFloat(urlParams.get('amount'));
  const fromCurrency = urlParams.get('from') || 'USD';

  // Get elements
  const sourceAmountEl = document.getElementById('source-amount');
  const sourceCurrencyEl = document.getElementById('source-currency');
  const targetCurrencyEl = document.getElementById('target-currency');
  const convertBtn = document.getElementById('convert-btn');
  const resultEl = document.getElementById('result');

  // State
  let exchangeRates = {};
  let isLoading = false;

  // Initialize the popup
  async function init() {
    try {
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please select a valid amount to convert');
      }

      if (!fromCurrency) {
        throw new Error('Source currency not specified');
      }

      // Display source amount and currency
      sourceAmountEl.textContent = formatNumber(amount);
      sourceCurrencyEl.textContent = `${getCurrencyName(fromCurrency)} (${fromCurrency})`;

      // Load user's saved settings
      await loadUserSettings();
      
      // Load exchange rates
      await loadExchangeRates();
      
      // Enable convert button if we have exchange rates
      convertBtn.disabled = !Object.keys(exchangeRates).length;
    } catch (error) {
      console.error('Initialization error:', error);
      showResult(`Error: ${error.message}`, 'error');
      convertBtn.disabled = true;
    }
  }

  // Load user settings from chrome.storage
  async function loadUserSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['settings'], (result) => {
        const defaultCurrency = result.settings?.defaultCurrency || 'USD';
        
        // Set default currency in dropdown if it exists
        if (defaultCurrency && defaultCurrency !== fromCurrency) {
          const option = Array.from(targetCurrencyEl.options).find(
            opt => opt.value === defaultCurrency
          );
          if (option) {
            option.selected = true;
          }
        }
        resolve();
      });
    });
  }

  // Load exchange rates from API
  async function loadExchangeRates() {
    try {
      if (!fromCurrency) {
        throw new Error('Source currency not specified');
      }

      isLoading = true;
      convertBtn.disabled = true;
      showResult('Loading exchange rates...', 'info');
      
      // Get all available currencies for the dropdown
      const response = await fetch(`https://api.frankfurter.app/latest?from=${fromCurrency}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error || 'Failed to load exchange rates');
      }
      
      if (!data.rates || typeof data.rates !== 'object') {
        throw new Error('Invalid exchange rate data received');
      }
      
      exchangeRates = data.rates;
      // Add the base currency with rate 1 for consistency
      exchangeRates[fromCurrency] = 1;
      updateCurrencyDropdown();
      
      // Clear any previous messages if everything is successful
      resultEl.style.display = 'none';
      
      // Auto-convert if we have all required fields
      if (targetCurrencyEl.value) {
        performConversion();
      }
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      throw error; // Re-throw to be caught by the caller
    } finally {
      isLoading = false;
      convertBtn.disabled = false;
    }
  }

  // Update currency dropdown with available currencies
  function updateCurrencyDropdown() {
    // Clear existing options except the first one
    while (targetCurrencyEl.options.length > 1) {
      targetCurrencyEl.remove(1);
    }
    
    // Add available currencies to dropdown
    const currencies = Object.keys(exchangeRates)
      .filter(code => code !== fromCurrency) // Exclude source currency
      .sort();
    
    currencies.forEach(code => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${getCurrencyName(code)} (${code})`;
      targetCurrencyEl.appendChild(option);
    });
    
    // If we have a default currency, select it
    chrome.storage.sync.get(['settings'], (result) => {
      const defaultCurrency = result.settings?.defaultCurrency || 'USD';
      if (defaultCurrency !== fromCurrency && currencies.includes(defaultCurrency)) {
        targetCurrencyEl.value = defaultCurrency;
      }
    });
  }

  // Handle convert button click
  convertBtn.addEventListener('click', async () => {
    const toCurrency = targetCurrencyEl.value;
    
    if (!toCurrency) {
      showResult('Please select a target currency', 'error');
      return;
    }
    
    try {
      convertBtn.disabled = true;
      convertBtn.textContent = 'Converting...';
      
      // Get conversion rate
      const rate = exchangeRates[toCurrency];
      if (!rate) {
        throw new Error('Exchange rate not available');
      }
      
      // Calculate converted amount
      const convertedAmount = amount * rate;
      
      // Format the result
      const formattedSource = formatCurrency(amount, fromCurrency);
      const formattedTarget = formatCurrency(convertedAmount, toCurrency);
      
      showResult(
        `${formattedSource} = ${formattedTarget}\n` +
        `1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}`,
        'success'
      );
    } catch (error) {
      console.error('Conversion error:', error);
      showResult(`Error: ${error.message}`, 'error');
    } finally {
      convertBtn.disabled = false;
      convertBtn.textContent = 'Convert';
    }
  });

  // Helper function to format currency amount
  function formatCurrency(amount, currency) {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  // Helper function to format number with 2 decimal places
  function formatNumber(num) {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  }

  // Get currency name from code
  function getCurrencyName(code) {
    const currencyNames = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      JPY: 'Japanese Yen',
      AUD: 'Australian Dollar',
      CAD: 'Canadian Dollar',
      CHF: 'Swiss Franc',
      CNY: 'Chinese Yuan',
      INR: 'Indian Rupee'
    };
    return currencyNames[code] || code;
  }

  // Show result message
  function showResult(message, type = 'info') {
    resultEl.textContent = message;
    resultEl.className = type;
    resultEl.style.display = 'block';
    
    // Auto-hide info messages after 3 seconds
    if (type === 'info') {
      setTimeout(() => {
        if (resultEl.textContent === message) {
          resultEl.style.display = 'none';
        }
      }, 3000);
    }
  }

  // Perform the currency conversion
  async function performConversion() {
    const toCurrency = targetCurrencyEl.value;
    
    if (!toCurrency) {
      showResult('Please select a target currency', 'error');
      return;
    }
    
    try {
      convertBtn.disabled = true;
      convertBtn.textContent = 'Converting...';
      
      // Get conversion rate
      const rate = exchangeRates[toCurrency];
      if (!rate) {
        throw new Error('Exchange rate not available');
      }
      
      // Calculate converted amount
      const convertedAmount = amount * rate;
      
      // Format the result
      const formattedSource = formatCurrency(amount, fromCurrency);
      const formattedTarget = formatCurrency(convertedAmount, toCurrency);
      
      showResult(
        `${formattedSource} = ${formattedTarget}\n` +
        `1 ${fromCurrency} = ${rate.toFixed(6)} ${toCurrency}`,
        'success'
      );
    } catch (error) {
      console.error('Conversion error:', error);
      showResult(`Error: ${error.message}`, 'error');
    } finally {
      convertBtn.disabled = false;
      convertBtn.textContent = 'Convert';
    }
  }

  // Handle convert button click
  convertBtn.addEventListener('click', performConversion);
  
  // Auto-convert when target currency changes
  targetCurrencyEl.addEventListener('change', () => {
    if (targetCurrencyEl.value) {
      performConversion();
    }
  });
  
  // Initial conversion if we have all required fields
  if (targetCurrencyEl.value) {
    performConversion();
  }

  // Initialize the popup when the page loads
  init();
});

// Add CSS for the loading state
const style = document.createElement('style');
style.textContent = `
  .loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(0,0,0,.1);
    border-radius: 50%;
    border-top-color: #4CAF50;
    animation: spin 1s ease-in-out infinite;
    margin-left: 8px;
    vertical-align: middle;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
