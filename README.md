# Price Converter Chrome Extension

A Chrome extension that allows you to convert prices to different currencies directly from the context menu.

## Features

- Right-click on any selected price to convert it to another currency
- Supports multiple currencies
- Simple and intuitive interface
- Set your preferred default target currency
- No signup required (uses free tier of exchangerate.host API)

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `price-converter-extension` folder

## Usage

1. Highlight any price on a webpage
2. Right-click and select "Convert price to..."
3. Select your target currency from the dropdown
4. The converted amount will be displayed

## Configuration

1. Click on the extension icon in your toolbar
2. Select "Options" to configure your default currency
3. Optionally, add your own API key for higher rate limits

## Permissions

This extension requires the following permissions:

- `contextMenus`: To add the right-click menu item
- `activeTab`: To access the current tab's content
- `storage`: To save your preferences
- `scripting`: To interact with web pages

## Privacy

This extension only makes API calls to exchangerate.host to fetch exchange rates. No personal data is collected or stored.

## License

MIT
