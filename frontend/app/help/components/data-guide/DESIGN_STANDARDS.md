# Design Standards for Data Guide Components

## Overview
This document outlines the standardized design and structure for all data guide components in Statify to ensure consistency, maintainability, and better user experience across the data management section.

## Component Structure

### 1. Imports
```tsx
/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep, HelpSection } from '../../ui/HelpLayout';
import { [Icons] } from 'lucide-react';
```

### 2. Sections Structure

#### Section IDs and Titles
- **How-to Steps**: `'how-to-steps'` → `'Cara [Action]'`
  - Examples: `'how-to-steps'` → `'Cara Menggunakan Agregasi Data'`
  - Examples: `'how-to-steps'` → `'Cara Mendefinisikan Properti Variabel'`

- **Features/Information**: `'features'` → `'Fitur & [Context]'`
  - Examples: `'Fitur & Konsep'`, `'Fitur & Manfaat'`, `'Fitur & Proses'`

- **Configuration/Workflow**: `'configuration'` or `'workflow'` → `'Konfigurasi [Context]'` or `'Alur Kerja [Context]'`

- **Interface Elements**: `'ui-[element]'` → `'Tab: [Element Name]'`
  - Examples: `'ui-variables'` → `'Tab: Variabel (Variables)'`

#### Section Descriptions
- How-to: "Panduan langkah demi langkah untuk [action] dalam Statify"
- Features: "Memahami [concept] dan manfaat [feature]"
- Configuration: "Cara mengatur [element] untuk [purpose]"
- Interface: "Kontrol utama dalam tab [TabName] untuk [purpose]"

### 3. Icons Mapping

#### Actions
- **Database** (🗄️): For data aggregation and data operations
- **Settings** (⚙️): For configuration and setup processes
- **Calendar** (📅): For date/time operations
- **Filter** (🔽): For case selection and filtering

#### Features/Information
- **Calculator** (🧮): For statistical functions and calculations
- **FileText** (📄): For documentation and workflow processes
- **Clock** (🕐): For time-based operations
- **Search** (🔍): For finding and identifying data

#### Content Types
- **Copy** (📋): For duplicate operations
- **RefreshCw** (🔄): For data restructuring
- **ArrowUpDown** (⬇️⬆️): For sorting operations
- **Scale** (⚖️): For weighting operations

### 4. Steps Structure

#### Standard Step Patterns

**Data Operation Steps:**
1. "Buka Menu Data" → "Klik 'Data' di bilah menu atas aplikasi."
2. "Pilih [Feature]" → "Klik Data → [Feature Name] untuk membuka dialog/wizard."
3. "Konfigurasi [Element]" → Configuration details specific to the feature
4. "Tinjau/Validasi" → Review and validation steps (if applicable)
5. "Terapkan/Jalankan" → "Klik 'OK' untuk [action description]."

### 5. Content Guidelines

#### HelpStep Usage
- Use numbered steps for sequential procedures
- Keep step titles concise but descriptive
- Include specific UI elements (button names, menu paths)
- Use consistent navigation patterns

#### HelpSection Usage
- Use for logical groupings within content
- Good for organizing complex information
- Use descriptive titles that indicate content type

#### HelpCard Usage
- `variant="feature"` for highlighting key features
- `variant="step"` for process explanations
- Include relevant icons when appropriate

#### HelpAlert Usage
- `variant="info"` for important information
- `variant="tip"` for helpful suggestions
- `variant="warning"` for cautions and limitations
- `variant="success"` for positive outcomes

### 6. Tips Structure

#### Types and Usage
- **`'tip'`**: Practical advice for better usage
- **`'info'`**: Important contextual information
- **`'warning'`**: Limitations, cautions, or validation reminders
- **`'success'`**: Positive features or successful outcomes

#### Content Guidelines
- Always include 3 tips minimum
- Focus on practical value and user guidance
- Use action-oriented language
- Address common user concerns or optimization

### 7. Related Topics

#### Standard Order for Data Guide
1. Related data management operations
2. Variable/property configuration tools
3. Data transformation operations
4. Statistical analysis guides
5. General management guides

#### Standard Links
- Data operations: `/help/data-guide/[operation-name]`
- File operations: `/help/file-guide/[operation-name]`
- Statistics: `/help/statistics-guide/[analysis-type]`
- General guides: `/help/[guide-name]`

### 8. Language Standards

#### Terminology
- Use "Statify" consistently for the application name
- Use specific action verbs: "mengagregasi", "mendefinisikan", "mengatur"
- Use "data/dataset" for data content, "variabel" for variables
- Use "klik" for click actions, "seret" for drag actions

#### Tone
- Professional and instructional
- Clear step-by-step guidance
- Helpful and supportive
- Technically accurate but accessible

#### Descriptions
- Lead with the purpose/goal
- Include context about when to use the feature
- Be specific about requirements and outcomes

## Data Guide Specific Patterns

### Feature Categories

#### Data Management
- Aggregation, Sort Cases, Sort Variables, Select Cases
- Pattern: Focus on data organization and preparation

#### Data Transformation  
- Restructure, Transpose, Weight Cases
- Pattern: Focus on changing data structure or presentation

#### Data Quality
- Duplicate Cases, Unusual Cases, Define Variable Properties
- Pattern: Focus on data validation and quality assurance

#### Data Configuration
- Define Date/Time, Set Measurement Level
- Pattern: Focus on data setup and preparation for analysis

### Common Workflows
1. **Data Preparation**: Import → Define Properties → Set Levels → Validate
2. **Data Transformation**: Select → Transform → Validate → Apply
3. **Data Analysis Prep**: Organize → Configure → Weight → Analyze

## Example Implementation

```tsx
export const ExampleDataGuide = () => {
  const sections = [
    {
      id: 'how-to-steps',
      title: 'Cara [Action] Data',
      description: 'Panduan langkah demi langkah untuk [action] dalam Statify',
      icon: Database,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Buka Menu Data"
            description="Klik 'Data' di bilah menu atas aplikasi."
          />
          // ... more steps
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fitur & Konsep',
      description: 'Memahami konsep dan manfaat [feature]',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Feature Title" variant="feature">
            <p className="text-sm text-muted-foreground">
              Description of the feature and its benefits.
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
      title: 'Practical Advice',
      content: 'Specific, actionable guidance for users.'
    },
    {
      type: 'info' as const,
      title: 'Important Information',
      content: 'Key contextual information users should know.'
    },
    {
      type: 'success' as const,
      title: 'Positive Outcome',
      content: 'Benefits or successful results users can expect.'
    }
  ];

  const relatedTopics = [
    { title: 'Related Data Operation', href: '/help/data-guide/[operation]' },
    { title: 'Variable Management', href: '/help/data-guide/[variable-op]' },
    { title: 'Statistical Analysis', href: '/help/statistics-guide/[analysis]' },
    { title: 'General Data Guide', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Clear Feature Name"
      description="Comprehensive description of the feature and its purpose in Statify"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};
```

## Quality Checklist

- [ ] All section IDs follow data guide naming conventions
- [ ] All section IDs within a component are unique (no duplicates)
- [ ] Titles use "Cara [Action]" pattern for how-to sections
- [ ] Descriptions are comprehensive and context-specific
- [ ] Icons are appropriate for the data operation type
- [ ] Steps follow standard data operation patterns
- [ ] Tips include at least 3 items with varied types
- [ ] Related topics are relevant to data management workflow
- [ ] Language is consistent with data management terminology
- [ ] No lint errors or compilation issues
- [ ] Component follows React best practices
- [ ] HelpStep, HelpSection, HelpCard, HelpAlert are used appropriately

## Maintenance

This document should be updated whenever:
- New data operation patterns emerge
- User feedback suggests workflow improvements
- Additional data management features are added
- UI components or interaction patterns change

Last updated: January 15, 2024
