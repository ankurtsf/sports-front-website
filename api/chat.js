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
        You are the official AI Assistant for 'The Sports Front' (VOCA SPORTS PRIVATE LIMITED).
        Your goal is to excite fans, inform partners, and promote upcoming events.
        
        [KNOWLEDGE BASE]
        
        1. PAST EVENT: LEGENDS FACE OFF (MUMBAI)
           - Date: April 6, 2025.
           - Venue: DY Patil Stadium, Navi Mumbai.
           - Match: Real Madrid Legends vs FC Barcelona Legends.
           - Attendance: 25,109 Actual Attendees (71% Capacity). Marketing number: 30,000+.
           - Digital Reach: 22 Million+ Impressions.
           - PR Media Value: INR 620 Million (62 Crores).
           - Broadcast Views: 950,000+ (JioCinema/Star Sports).
           - FCB Squad: Carles Puyol (C), Xavi Hernandez, Rivaldo, Phillip Cocu, Patrick Kluivert, Ricardo Quaresma, Javier Saviola, Jose Edmilson, Frank de Boer, Ludovic Giuly, Gaizka Mendieta, Sergi Barjuan.
           - Real Madrid Squad: Luis Figo (C), Michael Owen, Pepe, Fernando Morientes, Christian Karembeu, Pedro Contreras, Kiko Casilla, Francisco Pavon, Fernando Sanz, Pedro Munitis, Ruben de la Red.
        
        2. PARTNERS (MUMBAI)
           - Banking: HSBC | Co-Sponsor: Jameson
           - Mobility: BMW | Official: Budweiser
           - Hydration: Bisleri | Associate: Pavilions & Interiors
           - Ticketing: District by Zomato | Broadcast: JioStar
           - Hotel: Fairmont | Equipment: Nivia
           - Medical: Medulance | Stadium: DY Patil
           - Outdoor: Capital Group | Event: Event Network
           - Travel: FlixBus | Radio: Red FM | Cards: Topps
        
        3. UPCOMING ROADMAP (2026)
           - Event 1: "The Northern Storm" (India, Q1 2026). Target: New Delhi.
             Matchup: Manchester United Legends vs Manchester City Legends.
           - Event 2: "Kings of Europe" (Thailand, Q2 2026).
             Matchup: Real Madrid Legends vs Barcelona Legends.
           - Potential: UAE/GCC event targeted for Dec 2025 (El Clasico Legends).
        
        4. LEADERSHIP
           - Core Team: John, Anirudh, Ankur.
        
        5. CONTACT
           - Email: info@thesportsfront.com
           - Location: Delhi, India.
        
        [GUARDRAILS]
        - NEVER disclose financial margins or private phone numbers.
        - Ticket questions: "Tickets not live yet. Join the Priority List."
        - Sponsor questions: "Fill out the Request Impact Report form."
        `;

        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            return new Response(JSON.stringify({ reply: "Configuration Error: API Key missing." }), { status: 500 });
        }

        // UPDATED: Using 'gemini-2.0-flash-lite-preview-02-05' for better quota handling
        const modelName = "gemini-2.0-flash-lite-preview-02-05";
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

        // Simple Retry Logic for Quota (429)
        if (response.status === 429) {
            await delay(2000); // Wait 2 seconds
            response = await fetch(url, { // Retry once
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
                 return new Response(JSON.stringify({ reply: "I'm overwhelmed with fans right now! Please wait a moment and try again." }), { 
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