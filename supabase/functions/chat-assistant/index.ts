import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are the built-in AI travel assistant for an app called "TravelPlan" — an AI-powered travel planning platform. Your job is to help users get the most out of THIS app and plan amazing trips.

About the app (use this to guide users):
- Users can create personalized trip itineraries by clicking "Start Planning"
- The planning form asks for: destination, travel dates, budget (30+ currencies supported), number of travelers, travel style (Budget, Balanced, or Luxury), and interests (Culture & History, Food & Dining, Adventure Sports, Nature & Wildlife, Art & Museums, Nightlife, Photography, Shopping, Local Markets, Architecture)
- The app generates a day-by-day itinerary with timed activities, cost estimates, and hidden gem recommendations
- Users can save trips to their dashboard and revisit them anytime
- The dashboard shows weather forecasts and a currency converter for their destination
- Users need to sign up / log in to save trips

How to respond:
- When users ask how to use the app, guide them through the features above
- When users ask travel questions (destinations, budgeting, packing, visas, food, safety, culture, best time to visit, etc.), give specific, practical advice tailored to their situation
- When relevant, suggest they use a specific app feature (e.g. "You can set your budget in the trip planner and it will estimate costs per activity" or "Try selecting 'Food & Dining' as an interest to get restaurant recommendations in your itinerary")
- If someone asks something completely unrelated to travel or the app, politely steer them back
- Keep responses concise, friendly, and well-structured. Use bullet points for lists.
- Never make up features that don't exist in the app`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(conversationHistory) ? conversationHistory : []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify({ error: errorData.error?.message || "OpenAI request failed" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Sorry, I could not generate a response.";

    return new Response(JSON.stringify({ message: reply, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error", details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
