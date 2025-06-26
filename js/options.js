document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('save').addEventListener('click', saveOptions);

// Load saved options
function loadOptions() {
  chrome.storage.sync.get(['settings'], (result) => {
    const settings = result.settings || {};
    
    // Set default currency
    const defaultCurrency = settings.defaultCurrency || 'USD';
    const currencySelect = document.getElementById('default-currency');
    const apiKeyInput = document.getElementById('api-key');
    
    // Set the selected currency
    if (currencySelect) {
      currencySelect.value = defaultCurrency;
    }
    
    // Set API key if exists
    if (apiKeyInput && settings.apiKey) {
      apiKeyInput.value = settings.apiKey;
    }
  });
}

// Save options
async function saveOptions() {
  const defaultCurrency = document.getElementById('default-currency').value;
  const apiKey = document.getElementById('api-key').value.trim();
  const status = document.getElementById('status');
  
  try {
    // Get current settings
    const { settings: currentSettings } = await chrome.storage.sync.get('settings');
    
    // Update settings
    const settings = {
      ...currentSettings,
      defaultCurrency,
      ...(apiKey && { apiKey }) // Only include API key if provided
    };
    
    // Save to storage
    await chrome.storage.sync.set({ settings });
    
    // Show success message
    status.textContent = 'Options saved successfully!';
    status.className = 'success';
    status.style.display = 'block';
    
    // Hide status after 3 seconds
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
    
  } catch (error) {
    console.error('Error saving options:', error);
    status.textContent = 'Error saving options. Please try again.';
    status.className = 'error';
    status.style.display = 'block';
  }
}
