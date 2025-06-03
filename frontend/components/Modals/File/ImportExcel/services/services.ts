export const readExcelFileAsBinary = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error("No file provided."));
            return;
        }
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            reject(new Error("Invalid file type. Please select an Excel file (.xls, .xlsx)."));
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const binaryStr = e.target?.result as string;
                if (binaryStr) {
                    resolve(binaryStr);
                } else {
                    reject(new Error("Failed to read file content: result is null."));
                }
            } catch (err) {
                console.error("File reading error:", err);
                reject(new Error("Failed to read file content. The file might be corrupted."));
            }
        };

        reader.onerror = () => {
            console.error("FileReader error:", reader.error);
            reject(new Error("Error reading file. Please ensure it\'s a valid Excel file and try again."));
        };

        reader.readAsBinaryString(file);
    });
}; 