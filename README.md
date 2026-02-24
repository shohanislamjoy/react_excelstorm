# ⚡ ExcelStorm

A high-performance React-based application for efficiently uploading, parsing, and rendering large Excel datasets. Designed to handle heavy DOM manipulation while maintaining excellent responsiveness.

## 🎯 Features

- **📁 Excel File Upload**: Support for XLSX, XLS, and CSV file formats
- **⚡ High-Performance Rendering**: Virtual scrolling for handling thousands of rows without performance degradation
- **🔍 Real-time Search**: Instantly search across all columns and rows
- **📊 Sorting**: Click column headers to sort data in ascending/descending order
- **💾 Data Export**: Export parsed data as CSV format
- **📈 Statistics**: Display file metrics (row count, column count, file size)
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **React 19.2**: Latest React version for modern UI development
- **Vite**: Next-generation frontend build tool for lightning-fast development
- **XLSX**: Powerful Excel parsing library
- **CSS3**: Modern styling with CSS variables and Grid/Flexbox

## 📋 Data Format

The application transforms Excel data into the following format:

```javascript
{
  "CHALLAN_NO": "Challan Number (max 11 chars)",
  "A_BANCD": "Bank Code",
  "A_BANKL": "Branch Code",
  "CHALL_DATE": "Date in MM/DD/YYYY format",
  "ACCOUNT_CODE": "Account Code",
  "CHAN_AMT": "Amount",
  "NOTES": "Notes (max 255 chars)"
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd react_excelstorm
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5174`

### Sample Data

A sample Excel file is included in the `public` folder for testing. You can:

1. Download `sample-data.xlsx` from the public folder
2. Use the file upload feature in the app to test functionality

To generate new sample data:
```bash
node generate-sample.mjs
```

## 📖 Usage

### Uploading a File

1. Click the upload area or the "📁 Click to upload Excel file" button
2. Select an Excel file (XLSX, XLS, or CSV)
3. The file will be parsed and displayed in the data table

### Searching Data

- Use the search input at the top of the data table
- The search is case-insensitive and searches across all columns
- Results update in real-time as you type

### Sorting Data

- Click any column header to sort by that column
- Click again to reverse the sort order
- Sort indicators (▲/▼) show the current sort direction

### Exporting Data

1. After uploading and parsing a file, click the "💾 Export CSV" button
2. The parsed data will be downloaded as a CSV file

### Clearing Data

- Click the "🗑️ Clear" button to reset the application and upload a new file

## 🎨 Customization

### Colors and Styling

Edit the CSS variables in `src/App.css` under `:root`:

```css
:root {
  --primary-color: #3b82f6;
  --primary-dark: #1e40af;
  --secondary-color: #10b981;
  --danger-color: #ef4444;
  /* ... more variables */
}
```

### Data Transformation

Modify the parsing logic in `src/utils/excelParser.js` to customize how Excel data is transformed:

```javascript
return {
  CHALLAN_NO: (item['Challan Number'] || '').toString().substring(0, 11),
  A_BANCD: item['Bank Code'] || '',
  A_BANKL: item['Branch Code'] || '',
  // ... add or modify fields here
};
```

## ⚙️ Virtual Scrolling

The app uses virtual scrolling to efficiently render large datasets:

- **Visible Items**: 15 rows displayed at a time
- **Item Height**: 40px per row
- **Performance**: Can handle 10,000+ rows smoothly

Adjust these values in `src/components/VirtualizedDataTable.jsx`:

```javascript
const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 15;
```

## 📁 Project Structure

```
react_excelstorm/
├── src/
│   ├── components/
│   │   └── VirtualizedDataTable.jsx    # Virtual scrolling table component
│   ├── styles/
│   │   └── DataTable.css               # Table component styles
│   ├── utils/
│   │   └── excelParser.js              # Excel parsing utilities
│   ├── App.jsx                         # Main application component
│   ├── App.css                         # Application styles
│   ├── index.css                       # Global styles
│   └── main.jsx                        # Application entry point
├── public/
│   └── sample-data.xlsx                # Sample Excel file
├── vite.config.js                      # Vite configuration
├── package.json                        # Project dependencies
└── generate-sample.mjs                 # Sample data generator
```

## 🔧 Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## ⚙️ Building for Production

```bash
npm run build
```

The production build will be optimized and ready for deployment in the `dist` folder.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Performance Tips

1. **Large Datasets**: Use virtual scrolling (already implemented)
2. **Memory Management**: The app efficiently manages memory by only rendering visible rows
3. **Search Optimization**: Search is optimized for real-time performance
4. **Export**: Use CSV export for large datasets to avoid browser memory issues

## 🐛 Troubleshooting

### File Upload Not Working

- Ensure the file format is supported (XLSX, XLS, CSV)
- Check browser console for error messages
- Try with the sample data file first

### Slow Performance

- For very large files (>50MB), consider splitting into smaller files
- Close other browser tabs to free up memory
- Use the latest version of your browser

### Data Not Displaying

- Verify the Excel file has headers in the first row
- Check that required columns are present in the Excel file
- Review browser console for parsing errors

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**📧 Email**: [shohanislamjoy@gmail.com](mailto:shohanislamjoy@gmail.com)  
**🌐 GitHub**: [@shohanislamjoy](https://github.com/shohanislamjoy)

---

