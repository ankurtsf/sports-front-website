export const config = {
    runtime: 'edge',
};

// Helper for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req) {
    try {
        const { messages } = await req.json();
        const userMessage = messages[messages.length - 1].content;

        const systemPrompt = `
        You are 'The Gaffer', the official AI Assistant for The Sports Front (VOCA SPORTS).
        Your goal is to excite fans, inform partners, and promote upcoming events with a professional yet sporty tone.
        
        [KNOWLEDGE BASE - PAST EVENTS]
        - EVENT: Legends Face Off (Mumbai), April 6, 2025 at DY Patil Stadium.
        - MATCH: Real Madrid Legends vs FC Barcelona Legends.
        - STATS: 25,109 Attendees, 22M+ Digital Reach, INR 620 Million PR Value.
        - PARTNERS: HSBC, Jameson, BMW, Budweiser, Bisleri, District, JioStar, Fairmont, Nivia, Medulance, Capital Group, Event Network, FlixBus, Red FM, Topps.
        
        [FUTURE ROADMAP 2026 - STRICTLY CONFIDENTIAL DETAILS]
        - India Event (Q1 2026): Target is New Delhi.
        - Thailand Event (Q2 2026): Target is Bangkok.
        
        [GUARDRAILS & RULES]
        1. **FUTURE TEAMS:** DO NOT mention specific team names for 2026 events (e.g., do NOT say Man Utd or Man City). 
           - Instead, say: "We are bringing two English Premier League heavyweights to India" or "A historic rivalry from England."
           - For Thailand, say: "The Kings of Europe return to Asia."
           - Reason: Contracts are not finalized.
           
        2. **FINANCIALS:** NEVER disclose profit margins, specific contract values, or private phone numbers.
        
        3. **TICKETS/SPONSORS:** - "Tickets are not live yet. Join the Priority List on our site."
           - "For sponsorship, please fill out the Request Impact Report form."
        `;

        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            return new Response(JSON.stringify({ reply: "Configuration Error: API Key missing." }), { status: 500 });
        }

        // Using 'gemini-2.0-flash' (or fallback logic)
        const modelName = "gemini-2.0-flash"; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        let response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt + "\n\nUser Question: " + userMessage }] }
                ]
            })
        });

        if (response.status === 429) {
            await delay(2000); // Retry logic
            response = await fetch(url, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: systemPrompt + "\n\nUser Question: " + userMessage }] }
                    ]
                })
            });
        }

        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini API Error:", JSON.stringify(data.error, null, 2));
            if (data.error.code === 429) {
                 return new Response(JSON.stringify({ reply: "The stadium is packed! Give me a moment to clear the queue." }), { 
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            return new Response(JSON.stringify({ reply: "I'm currently updating my tactics board. Please try again in a moment." }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't quite catch that play. Could you ask again?";

        return new Response(JSON.stringify({ reply }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Server Error:", error);
        return new Response(JSON.stringify({ reply: "Connection timeout. The stadium is full!" }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}