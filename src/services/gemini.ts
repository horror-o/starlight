import axios from 'axios';

// 1. Setup the Key
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

// 2. Setup the "Modern" Model URL (Gemini 2.5 Flash)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

export interface GeminiCardData {
  passcode?: string;
  setNumber?: string;
  rarity?: string;
  name?: string;
}

export const identifyCardWithGemini = async (base64Image: string): Promise<GeminiCardData> => {
  
  // Safety Check
  if (!GEMINI_API_KEY) {
      console.error('CRITICAL ERROR: API Key is missing. Check your .env file.');
      throw new Error('Gemini API Key is missing.');
  }

  const promptText = `
    Analyze this Yu-Gi-Oh! card image. Extract the following details:
    1. Passcode: The 8-digit number usually at the bottom left.
    2. Set Number: The code like 'LOB-EN001' usually below the artwork on the right.
    3. Rarity: Guess the rarity.
    4. Name: The card name at the top.

    Return the result in strictly valid JSON format. Keys: "passcode", "setNumber", "rarity", "name".
  `;

  const requestBody = {
    contents: [{
        parts: [
          { text: promptText },
          { inline_data: { mime_type: "image/jpeg", data: base64Image } }
        ]
    }]
  };

  try {
    console.log('Sending request to Gemini 2.5 Flash...');
    
    // 3. Send the Request
    const response = await axios.post(GEMINI_URL, requestBody, {
      params: { key: GEMINI_API_KEY },
      headers: { 'Content-Type': 'application/json' }
    });
    
    // 4. Parse & Sanitize the Response
    const candidates = response.data.candidates;
    if (candidates && candidates.length > 0) {
        const textResponse = candidates[0].content.parts[0].text;
        
        // Clean markdown if present
        const cleanText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        // --- NEW: SANITY CHECK LOGIC ---
        
        // A. Clean the Passcode (Remove non-numbers)
        let cleanPasscode = data.passcode ? data.passcode.toString().replace(/\D/g, '') : null;
        
        // B. Validate Passcode Length
        // Real Yu-Gi-Oh! IDs are almost always 8 digits. 
        // If it's too short (garbage like "123"), throw it away so we don't trigger a 400 Error.
        if (cleanPasscode && cleanPasscode.length < 4) { 
            console.log(`Gemini found invalid passcode: ${cleanPasscode} -> Ignoring it.`);
            cleanPasscode = null;
        }

        return {
            passcode: cleanPasscode, 
            setNumber: data.setNumber,
            rarity: data.rarity,
            name: data.name
        };
    } else {
        throw new Error('No candidates returned from Gemini');
    }

  } catch (error: any) {
    console.error('Gemini Scan Error:', error.response?.data || error.message);
    throw error;
  }
};
