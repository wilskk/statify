export const EXCEL_FORMATS = [
    { value: "xlsx", label: "Excel (.xlsx)" },
    { value: "xls", label: "Excel 97-2003 (.xls)" },
    { value: "csv", label: "CSV (.csv) - Use Export CSV menu", disabled: true },
    { value: "ods", label: "OpenDocument Spreadsheet (.ods)" },
];

export const EXCEL_OPTIONS_CONFIG = [
    {
        id: "includeHeaders",
        label: "Include variable names as headers",
        tooltip: "Adds variable names as the first row in the 'Data' sheet."
    },
    {
        id: "includeVariableProperties",
        label: "Include 'Variable Definitions' sheet",
        tooltip: "Adds a separate sheet detailing variable properties (type, label, measure, etc.)."
    },
    {
        id: "includeDataLabels",
        label: "Apply value labels to data",
        tooltip: "Replaces raw values with their defined labels (e.g., 1 becomes 'Yes') in the 'Data' sheet. Affects data cells only."
    },
    {
        id: "includeMetadataSheet",
        label: "Include 'Metadata' sheet",
        tooltip: "Adds a separate sheet with project metadata (name, creation date, etc.)."
    },
    {
        id: "applyHeaderStyling",
        label: "Apply basic header styling",
        tooltip: "Applies bold font and a light background fill to header rows in the sheets."
    },
];

export const DEFAULT_FILENAME = "statify-export"; 