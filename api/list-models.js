export const config = { runtime: 'edge' };

export default async function handler(req) {
    const apiKey = "AIzaSyB1DHHZ2FbOSFOH2ilJ1q4jXOk02cHxpNY";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return new Response(JSON.stringify(data, null, 2), {
        headers: { 'Content-Type': 'application/json' }
    });
}