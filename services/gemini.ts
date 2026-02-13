import { GoogleGenAI } from "@google/genai";
import { BusinessLead } from "../types";

// Helper to validate API Key
export const hasApiKey = (): boolean => {
  return !!process.env.API_KEY;
};

const getClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const findLocalBusinesses = async (niche: string, location: string): Promise<Partial<BusinessLead>[]> => {
  const ai = getClient();
  
  // Prompt engineered to get structured-like text output from the Maps tool
  const prompt = `
    Find 5 ${niche} businesses in ${location}. 
    I am looking for small local businesses that might not have a strong digital presence.
    
    For each business found, please provide the details in this EXACT format per line:
    BUSINESS: [Name] | ADDRESS: [Address] | PHONE: [Phone or "N/A"] | WEBSITE: [Website URL or "None"]
    
    Do not add bolding, markdown lists, or introductory text. Just the lines of data.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || "";
    console.log("Raw Gemini Response:", text);

    // Parse the response
    const leads: Partial<BusinessLead>[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.includes('BUSINESS:') && line.includes('ADDRESS:')) {
        const nameMatch = line.match(/BUSINESS:\s*(.*?)\s*\|/);
        const addressMatch = line.match(/ADDRESS:\s*(.*?)\s*\|/);
        const phoneMatch = line.match(/PHONE:\s*(.*?)\s*\|/);
        const websiteMatch = line.match(/WEBSITE:\s*(.*)/);

        if (nameMatch && addressMatch) {
          const website = websiteMatch ? websiteMatch[1].trim() : "None";
          // We prioritize leads with "None" or N/A website, but we return all for the user to decide
          leads.push({
            name: nameMatch[1].trim(),
            address: addressMatch[1].trim(),
            phone: phoneMatch ? phoneMatch[1].trim() : "N/A",
            website: website,
            niche,
            location
          });
        }
      }
    }

    return leads;
  } catch (error) {
    console.error("Error finding businesses:", error);
    throw error;
  }
};

export const generateOutreachEmail = async (businessName: string, niche: string): Promise<string> => {
  const ai = getClient();
  
  const prompt = `
    Write a short, professional, and friendly cold outreach email to "${businessName}", a ${niche} business.
    
    The goal: Offer to build them a modern, high-converting website to help them get more local customers.
    The price for the complete website service is $67 (one-time fee).
    
    My name is "Dumsani Maphalala" from "DigitalEswatiniservices".
    My contact email is "digitalproductsmaps@gmail.com".
    
    Tone: Helpful, not spammy, and emphasize the affordable $67 price point.
    Structure:
    Subject: [Compelling Subject]
    Body: [Email Body]
    
    Sign off with:
    Dumsani Maphalala
    DigitalEswatiniservices
    digitalproductsmaps@gmail.com
    
    Keep the email body concise (under 150 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using 2.5 flash for speed and quality
      contents: prompt,
    });
    return response.text || "Could not generate email.";
  } catch (error) {
    console.error("Error generating email:", error);
    return "Error generating email template.";
  }
};