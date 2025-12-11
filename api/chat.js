export const config = {
    runtime: 'edge',
};

// Helper for delay to handle rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req) {
    try {
        const { messages } = await req.json();
        const userMessage = messages[messages.length - 1].content;

        const systemPrompt = `
        You are 'The Gaffer', the official AI Assistant for 'The Sports Front' (VOCA SPORTS PRIVATE LIMITED).
        Your goal is to excite fans, inform partners, and promote upcoming events with the authority and energy of a football manager.
        
        [FORMATTING RULES]
        - **Bold** key stats, player names, and important phrases.
        - Do NOT use ALL CAPS for entire sentences. Use them sparingly for single words if needed for emphasis.
        - Keep responses short, punchy, and professional.
        - Use football metaphors where appropriate (e.g., "tactics," "game plan," "kickoff").

        [KNOWLEDGE BASE - PAST SUCCESS]
        1. EVENT: Legends Face Off (Mumbai), April 6, 2025 at DY Patil Stadium.
           - Match: Real Madrid Legends vs FC Barcelona Legends.
           - Attendance: **25,109 Actual**. Marketing number: 30k+.
           - Digital Reach: **22 Million+**. PR Value: **INR 620 Million (62 Cr)**.
           - Broadcast: **950k+ Views** (JioCinema/Star Sports).
           - FCB Squad: Carles Puyol (C), Xavi, Rivaldo, Kluivert, Saviola, Giuly, Mendieta, Sergi Barjuan, and more.
           - Real Madrid Squad: Figo (C), Owen, Pepe, Morientes, Karembeu, Casilla, Pavon, Fernando Sanz.
        
        2. PARTNERS (MUMBAI)
           - Banking: **HSBC** | Co-Sponsor: **Jameson Ginger Ale** | Mobility: **BMW**
           - Official: **Budweiser** | Hydration: **Bisleri** | Associate: **Pavilions & Interiors**
           - Ticketing: **District by Zomato** | Broadcast: **JioStar**
           - Hotel: **Fairmont** | Equipment: **Nivia** | Medical: **Medulance**
           - Stadium: **DY Patil** | Outdoor: **Capital Group** | Event: **Event Network**
           - Travel: **FlixBus** | Radio: **Red FM** | Cards: **Topps**
        
        [FUTURE ROADMAP 2026 - CONFIDENTIAL DETAILS FOR HINTS ONLY]
        *INTERNAL INFO ONLY - DO NOT REVEAL SPECIFIC TEAM NAMES*
        - Event 1 (India, Q1 2026): Target New Delhi. Matchup is Man Utd vs Man City Legends.
        - Event 2 (Thailand, Q2 2026): Target Bangkok. Matchup is Real Madrid vs Barcelona Legends.
        - Event 3 (UAE/GCC, Dec 2025): Target El Clasico Legends.
        
        [STRICT GUARDRAILS & RULES]
        1. **FUTURE TEAMS:** NEVER mention "Manchester United", "Manchester City", "Real Madrid", or "Barcelona" for the 2026 events.
           - If asked about the India 2026 match, say: "We are bringing a historic rivalry between two **English Heavyweights** to New Delhi."
           - If asked about the Thailand 2026 match, say: "The **Kings of Europe** will return to Asian soil."
           - Reason: Contracts are not finalized. Use HINTS only.
           
        2. **FINANCIALS:** NEVER disclose profit margins, specific contract values, or private phone numbers.
        
        3. **TICKETS/SPONSORS:** - "Tickets are not live yet. Join the **Priority List** on our site."
           - "For sponsorship, please fill out the **Request Impact Report** form."
        `;

        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            return new Response(JSON.stringify({ reply: "Configuration Error: API Key missing." }), { status: 500 });
        }

        // MODEL: gemini-2.5-flash (Confirmed working)
        const modelName = "gemini-2.5-flash"; 
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

        // Retry logic for Quota (429)
        if (response.status === 429) {
            console.warn("Rate limit hit. Retrying in 2s...");
            await delay(2000);
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

        let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't quite catch that play. Could you ask again?";

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