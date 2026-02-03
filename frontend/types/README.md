# Types Directory - TypeScript Type Definitions

Direktori `types/` berisi semua TypeScript type definitions dan interfaces yang digunakan di seluruh aplikasi Statify untuk type safety dan developer experience.

## 📁 Struktur

```
types/
├── Chart.ts              # Chart and visualization types
├── Data.ts               # Data management types
├── Meta.ts               # Metadata types
├── modalTypes.ts         # Modal system types
├── RepositoryError.ts    # Error handling types
├── Result.ts             # Analysis result types
├── SavUploadResponse.ts  # SAV file upload types
├── Table.ts              # Table component types
├── tourTypes.ts          # Tour guide types
├── ui.ts                 # UI component types
└── Variable.ts           # Variable management types
```

## 🎯 Type System Philosophy

### Design Principles
- **Type Safety**: Strict typing untuk prevent runtime errors
- **Developer Experience**: IntelliSense dan auto-completion support
- **Maintainability**: Clear type definitions yang mudah di-maintain
- **Consistency**: Consistent naming conventions dan patterns
- **Documentation**: Self-documenting types dengan JSDoc

### Type Categories

#### 📊 Data Types (`Data.ts`)
**Purpose**: Core data structures dan operations

```typescript
// Basic data types
export type DataValue = string | number | boolean | null | undefined;

export interface TableRow {
  [key: string]: DataValue;
}

export type TableData = TableRow[];

export interface DataColumn {
  name: string;
  type: DataType;
  nullable: boolean;
  defaultValue?: DataValue;
}

export type DataType = 
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time';

// Data operations
export interface DataFilter {
  column: string;
  operator: FilterOperator;
  value: DataValue | DataValue[];
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

export interface DataSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface DataTransformation {
  type: TransformationType;
  column: string;
  parameters: Record<string, any>;
}

export type TransformationType =
  | 'convert_type'
  | 'fill_missing'
  | 'normalize'
  | 'standardize'
  | 'encode_categorical'
  | 'create_dummy'
  | 'bin_numeric'
  | 'extract_date_part';
```

#### 🔧 Variable Types (`Variable.ts`)
**Purpose**: Variable metadata dan properties

```typescript
export interface Variable {
  id: string;
  name: string;
  label?: string;
  type: VariableType;
  measure: MeasureType;
  format?: VariableFormat;
  width?: number;
  decimals?: number;
  labels: ValueLabel[];
  missingValues: MissingValue[];
  notes?: string;
  role?: VariableRole;
}

export type VariableType = 'numeric' | 'string' | 'date' | 'time' | 'datetime';

export type MeasureType = 'scale' | 'ordinal' | 'nominal';

export interface VariableFormat {
  type: FormatType;
  pattern?: string;
  width?: number;
  decimals?: number;
}

export type FormatType = 
  | 'number'
  | 'currency'
  | 'percent'
  | 'scientific'
  | 'date'
  | 'time'
  | 'datetime'
  | 'custom';

export interface ValueLabel {
  value: DataValue;
  label: string;
}

export interface MissingValue {
  value: DataValue;
  type: MissingValueType;
}

export type MissingValueType = 
  | 'system'
  | 'user'
  | 'range'
  | 'discrete';

export type VariableRole = 
  | 'input'
  | 'target'
  | 'both'
  | 'none'
  | 'partition'
  | 'split'
  | 'frequency'
  | 'weight';

// Variable operations
export interface VariableUpdate {
  id: string;
  updates: Partial<Omit<Variable, 'id'>>;
}

export interface VariableValidation {
  isValid: boolean;
  errors: VariableError[];
  warnings: string[];
}

export interface VariableError {
  field: keyof Variable;
  message: string;
  severity: 'error' | 'warning';
}
```

#### 📈 Chart Types (`Chart.ts`)
**Purpose**: Visualization dan chart definitions

```typescript
export interface ChartConfig {
  type: ChartType;
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  responsive?: boolean;
  animation?: AnimationConfig;
  theme?: ChartTheme;
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  axes?: AxesConfig;
  series: SeriesConfig[];
}

export type ChartType = 
  | 'bar'
  | 'column'
  | 'line'
  | 'area'
  | 'pie'
  | 'doughnut'
  | 'scatter'
  | 'bubble'
  | 'histogram'
  | 'box_plot'
  | 'heatmap'
  | 'treemap';

export interface SeriesConfig {
  name: string;
  data: ChartDataPoint[];
  type?: ChartType; // For mixed charts
  color?: string;
  visible?: boolean;
  showInLegend?: boolean;
  marker?: MarkerConfig;
  line?: LineConfig;
  fill?: FillConfig;
}

export interface ChartDataPoint {
  x: DataValue;
  y: DataValue;
  z?: DataValue; // For bubble charts
  category?: string;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: EasingFunction;
  delay?: number;
}

export type EasingFunction = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic';

export interface ChartTheme {
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  colors: string[];
  font: FontConfig;
}

export interface FontConfig {
  family: string;
  size: number;
  weight: number | string;
  style: 'normal' | 'italic';
}

export interface LegendConfig {
  show: boolean;
  position: LegendPosition;
  align: AlignmentType;
  orientation: 'horizontal' | 'vertical';
  itemStyle?: CSSProperties;
}

export type LegendPosition = 'top' | 'bottom' | 'left' | 'right';
export type AlignmentType = 'start' | 'center' | 'end';

export interface TooltipConfig {
  enabled: boolean;
  format?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  formatter?: (dataPoint: ChartDataPoint) => string;
}

export interface AxesConfig {
  x: AxisConfig;
  y: AxisConfig;
  y2?: AxisConfig; // Secondary y-axis
}

export interface AxisConfig {
  show: boolean;
  title?: string;
  min?: number;
  max?: number;
  tickInterval?: number;
  tickFormat?: string;
  gridLines?: GridLineConfig;
  labels?: AxisLabelConfig;
}

export interface GridLineConfig {
  show: boolean;
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface AxisLabelConfig {
  show: boolean;
  rotation?: number;
  format?: string;
  formatter?: (value: DataValue) => string;
}

export interface MarkerConfig {
  enabled: boolean;
  shape: MarkerShape;
  size: number;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
}

export type MarkerShape = 
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'cross'
  | 'x';

export interface LineConfig {
  width: number;
  color?: string;
  style: LineStyle;
  smooth?: boolean;
}

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface FillConfig {
  enabled: boolean;
  color?: string;
  opacity: number;
  gradient?: GradientConfig;
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  stops: GradientStop[];
  angle?: number; // For linear gradients
}

export interface GradientStop {
  offset: number; // 0-1
  color: string;
}
```

#### 📊 Result Types (`Result.ts`)
**Purpose**: Analysis results dan outputs

```typescript
export interface AnalysisResult {
  id: string;
  type: AnalysisType;
  name: string;
  description?: string;
  timestamp: number;
  duration?: number;
  input: AnalysisInput;
  output: AnalysisOutput;
  metadata: ResultMetadata;
  status: ResultStatus;
  error?: string;
}

export type AnalysisType = 
  | 'descriptive'
  | 'frequency'
  | 'crosstabs'
  | 'correlation'
  | 'regression'
  | 'anova'
  | 't_test'
  | 'chi_square'
  | 'normality'
  | 'explore';

export interface AnalysisInput {
  variables: string[];
  filters?: DataFilter[];
  options: Record<string, any>;
  sampleSize?: number;
}

export interface AnalysisOutput {
  tables: ResultTable[];
  charts: ChartConfig[];
  statistics: Record<string, StatisticValue>;
  notes: string[];
  warnings: string[];
}

export interface ResultTable {
  id: string;
  title: string;
  subtitle?: string;
  columns: TableColumn[];
  rows: TableRow[];
  footnotes?: string[];
  format?: TableFormat;
}

export interface TableColumn {
  id: string;
  name: string;
  label: string;
  type: DataType;
  format?: ColumnFormat;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  summary?: SummaryFunction;
}

export interface ColumnFormat {
  type: FormatType;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  pattern?: string;
}

export type SummaryFunction = 
  | 'sum'
  | 'mean'
  | 'median'
  | 'min'
  | 'max'
  | 'count'
  | 'std'
  | 'var';

export interface TableFormat {
  showBorders: boolean;
  alternateRows: boolean;
  fontSize: number;
  fontFamily: string;
  headerStyle: CSSProperties;
  cellStyle: CSSProperties;
}

export interface StatisticValue {
  value: number;
  label: string;
  description?: string;
  significance?: number;
  confidenceInterval?: [number, number];
  pValue?: number;
  testStatistic?: number;
  degreesOfFreedom?: number;
}

export interface ResultMetadata {
  variablesUsed: string[];
  casesUsed: number;
  totalCases: number;
  missingCases: number;
  executionTime: number;
  memoryUsage?: number;
  warnings: string[];
  notes: string[];
}

export type ResultStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Result operations
export interface ResultExport {
  format: ExportFormat;
  options: ExportOptions;
}

export type ExportFormat = 
  | 'pdf'
  | 'html'
  | 'docx'
  | 'xlsx'
  | 'csv'
  | 'json'
  | 'xml';

export interface ExportOptions {
  includeTables: boolean;
  includeCharts: boolean;
  includeStatistics: boolean;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: MarginConfig;
  header?: string;
  footer?: string;
}

export interface MarginConfig {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
```

#### 🪟 Modal Types (`modalTypes.ts`)
**Purpose**: Modal system type definitions

```typescript
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalConfig<T = any> {
  type: ModalType;
  props: T;
  options?: ModalOptions;
}

export interface ModalOptions {
  size?: ModalSize;
  closable?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  destroyOnClose?: boolean;
  centered?: boolean;
  className?: string;
  style?: CSSProperties;
  zIndex?: number;
}

export type ModalType = 
  | 'import-csv'
  | 'import-excel'
  | 'import-clipboard'
  | 'export-csv'
  | 'export-excel'
  | 'open-sav-file'
  | 'example-dataset'
  | 'print'
  | 'goto'
  | 'variable-type'
  | 'value-labels'
  | 'missing-values'
  | 'chart-builder'
  | 'descriptive-analysis'
  | 'frequency-analysis'
  | 'crosstabs-analysis'
  | 'correlation-analysis';

// Modal state management
export interface ModalState {
  id: string;
  type: ModalType;
  isOpen: boolean;
  props: any;
  options: ModalOptions;
  zIndex: number;
}

export interface ModalAction {
  type: ModalActionType;
  payload?: any;
}

export type ModalActionType = 
  | 'OPEN_MODAL'
  | 'CLOSE_MODAL'
  | 'CLOSE_ALL_MODALS'
  | 'UPDATE_MODAL_PROPS'
  | 'SET_MODAL_OPTIONS';

// Specific modal props
export interface ImportCsvModalProps extends BaseModalProps {
  onImport: (data: ImportResult) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
}

export interface ImportExcelModalProps extends BaseModalProps {
  onImport: (data: ImportResult) => void;
  allowMultipleSheets?: boolean;
}

export interface ChartBuilderModalProps extends BaseModalProps {
  data: TableData;
  variables: Variable[];
  onCreateChart: (config: ChartConfig) => void;
  initialConfig?: Partial<ChartConfig>;
}

export interface AnalysisModalProps extends BaseModalProps {
  analysisType: AnalysisType;
  data: TableData;
  variables: Variable[];
  onRunAnalysis: (config: AnalysisConfig) => void;
  defaultOptions?: Record<string, any>;
}
```

#### 🎨 UI Types (`ui.ts`)
**Purpose**: UI component type definitions

```typescript
// Component props
export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ComponentSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'destructive';

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface InputProps {
  type?: InputType;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  style?: CSSProperties;
}

export type InputType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local';

export interface SelectProps<T = any> {
  value?: T;
  defaultValue?: T;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  loading?: boolean;
  error?: boolean;
  helperText?: string;
  onChange?: (value: T | T[]) => void;
  onSearch?: (query: string) => void;
  className?: string;
  style?: CSSProperties;
}

export interface SelectOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumnDef<T>[];
  loading?: boolean;
  selectable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: PaginationConfig;
  rowKey?: keyof T | ((row: T) => string);
  onRowSelect?: (rows: T[]) => void;
  onSort?: (column: string, direction: SortDirection) => void;
  onFilter?: (filters: Record<string, any>) => void;
  className?: string;
  style?: CSSProperties;
}

export interface TableColumnDef<T = any> {
  key: keyof T;
  title: string;
  dataIndex?: keyof T;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
  filter?: FilterConfig;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
}

export interface FilterConfig {
  type: FilterType;
  options?: SelectOption[];
  placeholder?: string;
  operator?: FilterOperator;
}

export type FilterType = 
  | 'text'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'date'
  | 'dateRange';

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  pageSizeOptions?: number[];
  onChange?: (page: number, pageSize: number) => void;
}

export type SortDirection = 'asc' | 'desc' | null;

// Form types
export interface FormProps {
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel?: () => void;
  validationSchema?: ValidationSchema;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface FieldProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  rules?: ValidationRule[];
  children: React.ReactNode;
}

export interface ValidationRule {
  type: ValidationType;
  message: string;
  value?: any;
  validator?: (value: any) => boolean | Promise<boolean>;
}

export type ValidationType = 
  | 'required'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom';

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

// Theme types
export interface Theme {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  shadows: Shadows;
  borders: Borders;
  breakpoints: Breakpoints;
}

export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
  gray: ColorScale;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface Typography {
  fontFamily: {
    sans: string[];
    mono: string[];
  };
  fontSize: Record<ComponentSize, string>;
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: Record<ComponentSize, string>;
  letterSpacing: Record<ComponentSize, string>;
}

export interface Spacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

export interface Shadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface Borders {
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  width: {
    0: string;
    1: string;
    2: string;
    4: string;
    8: string;
  };
}

export interface Breakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}
```

## 🧪 Type Testing

### Type Guards
```typescript
// typeGuards.ts
export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: any): value is boolean => {
  return typeof value === 'boolean';
};

export const isDataValue = (value: any): value is DataValue => {
  return value === null || 
         value === undefined || 
         isString(value) || 
         isNumber(value) || 
         isBoolean(value);
};

export const isTableRow = (value: any): value is TableRow => {
  return typeof value === 'object' && 
         value !== null && 
         Object.values(value).every(isDataValue);
};

export const isVariable = (value: any): value is Variable => {
  return typeof value === 'object' &&
         value !== null &&
         typeof value.id === 'string' &&
         typeof value.name === 'string' &&
         ['numeric', 'string', 'date', 'time', 'datetime'].includes(value.type) &&
         ['scale', 'ordinal', 'nominal'].includes(value.measure);
};

export const isChartConfig = (value: any): value is ChartConfig => {
  return typeof value === 'object' &&
         value !== null &&
         typeof value.type === 'string' &&
         Array.isArray(value.series);
};
```

### Type Utilities
```typescript
// typeUtils.ts
// Utility types untuk better type manipulation

// Make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Make all properties required recursively
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

// Extract keys yang have values of specific type
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Make specific properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Union to intersection
export type UnionToIntersection<U> = 
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// Brand types untuk preventing misuse
export type Brand<T, B> = T & { __brand: B };

export type VariableId = Brand<string, 'VariableId'>;
export type ChartId = Brand<string, 'ChartId'>;
export type ResultId = Brand<string, 'ResultId'>;

// Conditional types untuk polymorphic components
export type ComponentProps<T extends keyof JSX.IntrinsicElements> = 
  JSX.IntrinsicElements[T];

export type PolymorphicRef<C extends React.ElementType> = 
  React.ComponentPropsWithRef<C>['ref'];

export type PolymorphicComponentProp<
  C extends React.ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
    Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = 
  keyof (AsProp<C> & P);
```

## 📋 Best Practices

### Type Definition
- **Descriptive Names**: Use clear, descriptive names untuk types
- **Consistent Naming**: Follow consistent naming conventions
- **Documentation**: Add JSDoc comments untuk complex types
- **Generic Types**: Use generics untuk reusable types
- **Union Types**: Prefer union types untuk enumeration-like values

### Type Safety
- **Strict Types**: Use strict TypeScript configuration
- **No Any**: Avoid `any` type, use `unknown` instead
- **Type Guards**: Implement type guards untuk runtime safety
- **Branded Types**: Use branded types untuk domain-specific values
- **Discriminated Unions**: Use discriminated unions untuk polymorphic data

### Organization
- **Logical Grouping**: Group related types dalam same file
- **Re-exports**: Use index files untuk clean exports
- **Dependencies**: Minimize dependencies between type files
- **Shared Types**: Put shared types dalam common files
- **Domain Types**: Organize types by domain/feature

### Performance
- **Type Computation**: Avoid complex type computations
- **Recursive Types**: Be careful dengan recursive types
- **Template Literals**: Use template literal types appropriately
- **Conditional Types**: Use conditional types sparingly

---

Direktori `types/` menyediakan comprehensive type system yang memungkinkan type-safe development dan excellent developer experience dalam aplikasi Statify.
