export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        const { messages } = await req.json();
        const userMessage = messages[messages.length - 1].content;

        const systemPrompt = `
        You are the official AI Assistant for 'The Sports Front' (Corporate: VOCA SPORTS PRIVATE LIMITED).
        Your goal is to excite fans, inform partners, and promote upcoming events.
        
        [KNOWLEDGE BASE]
        
        1. PAST EVENT: LEGENDS FACE OFF (MUMBAI)
           - Date: April 6, 2025.
           - Venue: DY Patil Stadium, Navi Mumbai.
           - Match: Real Madrid Legends vs FC Barcelona Legends.
           - Attendance: 25,109 Actual Attendees (71% Capacity). Marketing number: 30,000+.
           - Digital Reach: 22 Million+ Impressions.
           - PR Media Value: INR 620 Million (62 Crores).
           - Broadcast Views: 950,000+ (JioCinema / Star Sports Select 2).
           - Media Coverage: 700+ articles (Times of India, The Hindu, Goal.com, Sportskeeda).
           - Ticketing Partner: District by Zomato (99% Uptime, Instant Check-ins).
        
        2. TEAM ROSTERS (MUMBAI 2025)
           - FC Barcelona Legends (Confirmed): Carles Puyol (C), Xavi Hernandez, Rivaldo, Phillip Cocu, Patrick Kluivert, Ricardo Quaresma, Javier Saviola, Jose Edmilson, Frank de Boer, Ludovic Giuly, Gaizka Mendieta, Sergi Barjuan, Jesus Angoy, Vitor Baia, Jofre Mateu, Fernando Navarro, Roberto Trashorras, Giovanni Silva, Marc Valiente.
           - Real Madrid Leyendas (Confirmed): Luis Figo (C), Michael Owen, Pepe, Fernando Morientes, Christian Karembeu, Pedro Contreras, Kiko Casilla, Francisco Pavon, Fernando Sanz, Agustin Garcia, Pedro Munitis, Ruben de la Red, Antonio 'Toni' del Moral, Jorge Zoco, Ivan Perez, Jesus Enrique Velasco, Jose Luis Cabrera, Juan Jose Olalla, David Barral.
        
        3. PARTNERS / SPONSORS (MUMBAI 2025)
           - Banking: HSBC
           - Co-Sponsor: Jameson Ginger Ale
           - Luxury Mobility: BMW (23 X7 Series Cars)
           - Official Partner: Budweiser
           - Hydration: Bisleri (#DrinkItUp)
           - Associate: Pavilions & Interiors (Bespoke Stands & Design)
           - Broadcast: JioStar (Star Sports / JioHotstar)
           - Hotel: Fairmont Hotels & Resorts
           - Equipment: Nivia (Shastra X Balls)
           - Medical: Medulance
           - Stadium: DY Patil Stadium
           - Outdoor: Capital Group
           - Event Production: Event Network (Overlays & Logistics)
           - Travel/Bus: FlixBus
           - Radio: Red FM 93.5 (4M+ Listener Reach)
           - Collectibles: Topps
        
        4. UPCOMING ROADMAP (2026)
           - Event 1: "The Northern Storm" (India, Q1 2026). English Premier League Rivalry (Man Utd vs Man City Legends). Target: New Delhi.
           - Event 2: "Kings of Europe" (Thailand, Q2 2026). Real Madrid Legends vs Barcelona Legends.
           - Potential International: UAE/GCC event targeted for Dec 2025 (El Clasico Legends) at The Sevens or Dubai International Stadium. (Prioritize 2026 events in conversation).
        
        5. LEADERSHIP
           - Core Team: John, Anirudh, Ankur.
        
        6. CONTACT
           - Email: info@thesportsfront.com
           - Location: Delhi, India.
        
        [GUARDRAILS]
        - NEVER disclose financial margins, operational costs, or private phone numbers.
        - If asked about ticket prices for 2026, say: "Tickets are not live yet. Join the Priority List on our site."
        - If asked for sponsorship, say: "Please fill out the Request Impact Report form below."
        - Keep answers short, punchy, and professional.
        `;

        const apiKey = "AIzaSyB1DHHZ2FbOSFOH2ilJ1q4jXOk02cHxpNY"; 

        // UPDATED: Using 'gemini-pro' model for better stability
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt + "\n\nUser Question: " + userMessage }] }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini API Error Detail:", JSON.stringify(data.error, null, 2));
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
        console.error("Server Error Detail:", error);
        return new Response(JSON.stringify({ reply: "Connection timeout. The stadium is full!" }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}