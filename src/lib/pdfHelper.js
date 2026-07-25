export const openPdfInNewTab = (base64Data, filename = 'document.pdf') => {
  try {
    if (!base64Data) return;
    
    // Extract base64 part if it's a data URI
    const base64Str = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
    
    // Convert base64 to raw binary data held in a string
    const byteCharacters = atob(base64Str);
    
    // Convert to ArrayBuffer
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    // Create a Blob from the ArrayBuffer
    const file = new Blob([byteArray], { type: 'application/pdf' });
    
    // Create an object URL (blob:...) which browsers allow opening in a new tab safely
    const fileURL = URL.createObjectURL(file);
    
    // Open in new tab
    window.open(fileURL, '_blank');
  } catch (error) {
    console.error("Failed to open PDF:", error);
    alert("Could not open PDF file. The file might be corrupted or missing.");
  }
};
