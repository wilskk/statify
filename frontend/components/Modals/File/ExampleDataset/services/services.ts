import { uploadSavFile } from "@/services/api";

export const processSavFileFromUrl = async (filePath: string) => {
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`Failed to fetch example file: ${response.statusText}`);
    }
    const fileBlob = await response.blob();
    
    const fileName = filePath.split('/').pop() || 'example.sav';
    const file = new File([fileBlob], fileName, { type: 'application/octet-stream' });
    
    const formData = new FormData();
    formData.append("file", file);
    
    return await uploadSavFile(formData);
}; 