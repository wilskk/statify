# Design Standards for File Guide Components

## Overview
This document outlines the standardized design and structure for all file guide components in Statify to ensure consistency, maintainability, and better user experience.

## Component Structure

### 1. Imports
```tsx
/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { [Icons] } from 'lucide-react';
```

### 2. Sections Structure

#### Section IDs and Titles
- **Import/Export Steps**: `'[action]-steps'` → `'Cara [Action]'`
  - Examples: `'import-steps'` → `'Cara Impor File CSV'`
  - Examples: `'export-steps'` → `'Cara Ekspor ke Excel'`

- **Features/Information**: `'features'` → `'Fitur & [Context]'`
  - Examples: `'Fitur & Manfaat'`, `'Fitur & Informasi'`

- **Formats/Types**: `'formats'` → `'Format Yang Didukung'`
  - For components that need to describe supported file formats

- **Options/Settings**: `'options'` → `'Opsi & Pengaturan'`

**⚠️ Important**: Ensure all section IDs within a single component are unique to avoid React key conflicts.

#### Section Descriptions
- Import: "Panduan langkah demi langkah untuk mengimpor data [Type] ke Statify"
- Export: "Panduan langkah demi langkah untuk menyimpan data Anda sebagai file [Type]"
- Features: "Informasi penting tentang [context]"
- Options: "Pengaturan yang dapat Anda sesuaikan saat [action] file"

### 3. Icons Mapping

#### Actions
- **Upload** (📤): For import processes
- **Download** (📥): For export processes
- **Printer** (🖨️): For printing operations

#### Features/Information
- **Lightbulb** (💡): For tips and information sections
- **Database** (🗄️): For data management
- **Settings** (⚙️): For configuration options

#### Content Types
- **FileSpreadsheet** (📊): For spreadsheet formats (CSV, Excel)
- **FileText** (📄): For text-based formats
- **Zap** (⚡): For quick/fast operations
- **Tags** (🏷️): For metadata/labeling features

### 4. Steps Structure

#### Standard Step Patterns

**Import Steps:**
1. "Buka Menu File" → "Klik 'File' di bilah menu atas aplikasi."
2. "Pilih [Action]" → "Klik File → [Menu Path]."
3. "Pilih File Anda" → "Telusuri komputer Anda dan pilih file [type] yang ingin Anda gunakan."
4. "Lanjut ke Konfigurasi" → "Klik 'Continue' untuk membuka [action] konfigurasi." (if applicable)
5. "Atur Opsi [Action]" → Configuration details
6. "Tinjau Data Preview" → Preview validation (if applicable)
7. "[Action]" → "Klik tombol '[Action]' untuk menyelesaikan proses."

**Export Steps:**
1. "Periksa Data Anda" → "Pastikan data yang ingin diekspor sudah dimuat di editor data."
2. "Buka Menu File" → "Klik File → Export → [Type]."
3. "Pilih Pengaturan" → Configuration options
4. "Beri Nama File" → File naming and location
5. "Simpan Data" → Final export action

### 5. Tips Structure

#### Types and Usage
- **`'tip'`**: General helpful advice
- **`'info'`**: Informational content
- **`'warning'`**: Important limitations or cautions
- **`'success'`**: Positive features or advantages

#### Content Guidelines
- Always include 3 tips minimum
- Make tips specific and actionable
- Use consistent language and tone
- Focus on practical value for users

### 6. Related Topics

#### Standard Order
1. Related import methods (for import pages)
2. Related export methods (for export pages)
3. Complementary operations
4. General guides (Management, Getting Started)

#### Standard Links
- Import guides: `/help/file-guide/import-[type]`
- Export guides: `/help/file-guide/export-[type]`
- General guides: `/help/[guide-name]`

### 7. Language Standards

#### Terminology
- Use "Statify" consistently (not "aplikasi" alone)
- Use "mengimpor" for import, "mengekspor" for export
- Use "file" for file types, "data" for content
- Use "klik" for click actions

#### Tone
- Professional but approachable
- Clear and concise
- Action-oriented
- Consistent across all components

#### Descriptions
- Start with purpose/goal
- Include context about the feature
- Be specific about file types and capabilities

## Example Implementation

```tsx
export const ExampleComponent = () => {
  const sections = [
    {
      id: 'import-steps',
      title: 'Cara Impor File CSV',
      description: 'Panduan langkah demi langkah untuk mengimpor data CSV ke Statify',
      icon: Upload,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Buka Menu File"
            description="Klik 'File' di bilah menu atas aplikasi."
          />
          // ... more steps
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fitur & Informasi',
      description: 'Informasi penting tentang format CSV',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpCard title="Format Universal" icon={FileSpreadsheet} variant="feature">
            <p className="text-sm text-muted-foreground">
              CSV adalah format yang didukung oleh hampir semua aplikasi.
            </p>
          </HelpCard>
          // ... more content
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Practical Tip',
      content: 'Specific, actionable advice for users.'
    },
    {
      type: 'info' as const,
      title: 'Information',
      content: 'Important information about the feature.'
    },
    {
      type: 'success' as const,
      title: 'Advantage',
      content: 'Positive aspect or benefit.'
    }
  ];

  const relatedTopics = [
    { title: 'Related Import', href: '/help/file-guide/import-[type]' },
    { title: 'Related Export', href: '/help/file-guide/export-[type]' },
    { title: 'Management Guide', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Clear, Descriptive Title"
      description="Comprehensive description of what this guide covers"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};
```

## Quality Checklist

- [ ] All section IDs follow naming convention
- [ ] **All section IDs within a component are unique (no duplicates)**
- [ ] All titles use "Cara [Action]" pattern
- [ ] Descriptions are comprehensive and consistent
- [ ] Icons are appropriate and meaningful
- [ ] Steps follow standard patterns
- [ ] Tips include at least 3 items with varied types
- [ ] Related topics are relevant and properly linked
- [ ] Language is consistent and professional
- [ ] No lint errors or warnings
- [ ] Component follows React best practices
- [ ] No console errors for duplicate keys

## Maintenance

This document should be updated whenever:
- New patterns emerge
- User feedback suggests improvements
- Additional file types are supported
- UI components change

Last updated: January 15, 2024
