import { VariableType } from "@/types/Variable";

/**
 * Maps SPSS format type string to a VariableType.
 */
export const mapSPSSTypeToInterface = (formatType: string): VariableType => {
    const typeMap: { [key: string]: VariableType } = {
        "F": "NUMERIC", "COMMA": "COMMA", "E": "SCIENTIFIC", "DATE": "DATE",
        "ADATE": "ADATE", "EDATE": "EDATE", "SDATE": "SDATE", "JDATE": "JDATE",
        "QYR": "QYR", "MOYR": "MOYR", "WKYR": "WKYR", "DATETIME": "DATETIME",
        "TIME": "TIME", "DTIME": "DTIME", "WKDAY": "WKDAY", "MONTH": "MONTH",
        "DOLLAR": "DOLLAR", "A": "STRING", "CCA": "CCA", "CCB": "CCB",
        "CCC": "CCC", "CCD": "CCD", "CCE": "CCE"
    };
    return typeMap[formatType] || "NUMERIC"; // Default to NUMERIC if unknown
}; 