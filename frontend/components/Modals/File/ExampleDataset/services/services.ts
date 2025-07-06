import { uploadSavFile } from "@/services/api";

/**
 * Fetches an example .sav file from a public path,
 * then uploads it for processing.
 */
export const processSavFileFromUrl = async (filePath: string) => {
    // Fetch the file from the public folder
    const response = await fetch(filePath);
    if (!response.ok) {
        throw new Error(`Failed to fetch example file: ${response.statusText}`);
    }
    const fileBlob = await response.blob();
    
    // Get the file name from the path
    const fileName = filePath.split('/').pop() || 'example.sav';

    // Create a File object from the blob
    const file = new File([fileBlob], fileName, { type: 'application/octet-stream' });

    // Use FormData to send the file to the backend
    const formData = new FormData();
    formData.append("file", file);

    // Call the existing API service for uploading .sav files
    return await uploadSavFile(formData);
}; 