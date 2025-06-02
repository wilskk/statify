# Import Clipboard Module

## Overview

The Import Clipboard module provides functionality similar to Excel's "Text to Columns" feature, allowing users to paste tabular data from the clipboard and import it into the application with customizable parsing options.

## Architecture

The module follows a modular architecture with the following components:

```
ImportClipboard/
├── components/
│   ├── ImportClipboardPasteStep.tsx
│   └── ImportClipboardConfigurationStep.tsx
├── hooks/
│   ├── useImportClipboardLogic.ts
│   └── useImportClipboardProcessor.ts
├── ImportClipboard.tsx           # Main modal container
├── index.ts                      # Barrel file for exports
├── README.md                     # This file
└── types.ts                      # TypeScript interfaces
```

## Workflow

### 1. Initial Data Pasting (ImportClipboardPasteStep)

- User opens the Import Clipboard modal
- System attempts to read from Clipboard API automatically
- User can also manually paste data into the textarea
- Text analysis is performed to detect structure:
  - Line breaks
  - Delimiter patterns (tab, comma, semicolon, etc.)
  - Potential header detection
- Once data is pasted, the user proceeds to configuration

### 2. Data Configuration (ImportClipboardConfigurationStep)


The configuration step provides options for parsing the pasted text:

- **Parser Selection**:
  - Simple parser (basic delimiter-based splitting)
  - Excel-style parser (handles quoted text, consecutive delimiters, etc.)

- **Delimiter Options**:
  - Tab (default)
  - Comma
  - Semicolon
  - Space
  - Custom delimiter

- **Text Qualifier** (Excel-style parser):
  - Double quotes (")
  - Single quotes (')
  - None

- **Additional Options**:
  - First row as headers
  - Trim whitespace
  - Skip empty rows
  - Automatic data type detection

### 3. Data Preview

- Interactive preview using Handsontable
- Column width adjustment (auto or fixed)
- Visual representation of parsed data
- Real-time updates when options change
- Row and column statistics

### 4. Data Processing & Import

Once the user confirms the import:

1. Data is processed through the chosen parser
2. Variables are created based on column data
3. Data type detection is performed:
   - Numeric values
   - Date detection
   - Text fallback
4. Data is loaded into the application's data store
5. Variables are registered in the variable store

## Implementation Details

### Parsing Logic

#### Simple Parser

Basic text splitting based on delimiter:

```typescript
const cells = row.split(delimiter);
```

#### Excel-style Parser

Advanced parsing with state machine approach:

1. Process text character by character
2. Track quoted state to handle delimiters within quotes
3. Support escaped quotes (doubled quotes)
4. Handle consecutive delimiters as one (optional)
5. Convert data types based on pattern detection

```typescript
// Core parsing algorithm for Excel-style parser
for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    // Handle text qualifier
    if (char === textQualifier) {
        if (i < row.length - 1 && row[i + 1] === textQualifier) {
            // Double quote within quoted text is an escape
            currentField += textQualifier;
            i++; // Skip the next quote
        } else {
            // Toggle quote mode
            insideQuotes = !insideQuotes;
        }
    }
    // Handle delimiter
    else if (char === delimiter && !insideQuotes) {
        // Process field when we hit a delimiter
        parsedRow.push(trimWhitespace ? currentField.trim() : currentField);
        currentField = '';
    }
    // Regular character
    else {
        currentField += char;
    }
}
```

### Data Type Detection

The system attempts to infer data types:

1. **Numbers**: Matches patterns like `-123`, `45.67`, `1.2e3`
2. **Dates**: Detects common date formats (MM/DD/YYYY, DD/MM/YYYY)
3. **Text**: Default for non-matching values

### Handsontable Integration

The preview uses Handsontable for:

- Grid-based display of parsed data
- Column headers based on first row (optional)
- Adjustable column widths
- Row headers
- Read-only mode for preview

## Usage

```jsx
import { ImportClipboardModal } from './ImportClipboard';

// In your component
<ImportClipboardModal 
    onClose={handleClose} 
    containerType="modal" 
/>
```

## Error Handling

- Clipboard API failures show user guidance
- Parsing errors display feedback in UI
- Empty data detection
- Malformed data handling 