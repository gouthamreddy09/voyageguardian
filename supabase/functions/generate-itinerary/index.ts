import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TripRequest {
  destination: string;
  days: number;
  budget: number;
  budgetCurrency: string;
  interests: string[];
  dates: string[];
  travelStyle: string;
  travelers: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      destination,
      days,
      budget,
      budgetCurrency,
      interests,
      dates,
      travelStyle,
      travelers,
    }: TripRequest = await req.json();

    if (!destination || !days || !budget || !dates?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const budgetPerDay = Math.round(budget / days);
    const interestsText =
      interests.length > 0 ? interests.join(", ") : "general sightseeing";

    const prompt = `Create a detailed ${days}-day travel itinerary for ${destination}.

Travel details:
- Dates: ${dates[0]} to ${dates[dates.length - 1]}
- Total budget: ${budgetCurrency} ${budget} (approximately ${budgetCurrency} ${budgetPerDay}/day)
- Number of travelers: ${travelers}
- Travel style: ${travelStyle} (${travelStyle === "budget" ? "affordable local experiences" : travelStyle === "luxury" ? "premium upscale experiences" : "balanced mix of comfort and adventure"})
- Interests: ${interestsText}

For EACH day, provide exactly 4-5 activities with realistic timing. Include a mix of:
- Morning activity (attraction or cultural site)
- Lunch (restaurant with local cuisine)
- Afternoon activity (based on interests)
- Evening activity (dining, entertainment, or cultural experience)

For each activity include:
- A specific real place name (not generic)
- A compelling 1-2 sentence description
- The specific neighborhood or area
- Approximate latitude and longitude coordinates
- Realistic duration
- Estimated cost in ${budgetCurrency} appropriate for ${travelStyle} style
- Category: one of "attraction", "restaurant", "activity", "transport", "accommodation"
- Whether it's a hidden gem (lesser-known local favorite) - mark at least 1 per day

IMPORTANT: Return ONLY valid JSON in this exact format, no markdown, no code fences:
[
  {
    "day": 1,
    "date": "${dates[0]}",
    "activities": [
      {
        "id": "day1_1",
        "name": "Place Name",
        "description": "Description of the place and what to do there.",
        "location": "Neighborhood or Area, ${destination}",
        "coordinates": { "lat": 0.0, "lng": 0.0 },
        "duration": "2 hours",
        "cost": 25,
        "category": "attraction",
        "is_hidden_gem": false,
        "time_slot": "9:00 AM - 11:00 AM"
      }
    ]
  }
]

Make sure:
- All costs are realistic for ${destination} and ${travelStyle} style
- Total daily costs stay close to ${budgetCurrency} ${budgetPerDay}
- Activities flow logically by location to minimize travel time
- Include specific real places that exist in ${destination}
- Coordinates are accurate for the actual locations
- Each day has a "date" field matching: ${dates.map((d, i) => `Day ${i + 1}: ${d}`).join(", ")}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert travel planner. You create detailed, accurate travel itineraries with real places, realistic costs, and correct coordinates. Always respond with valid JSON only - no markdown formatting, no code fences, no explanatory text.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({
          error: errorData.error?.message || "OpenAI request failed",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    let itinerary;
    try {
      const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
      itinerary = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response",
          raw: content.substring(0, 500),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validated = itinerary.map((day: any, index: number) => ({
      day: day.day || index + 1,
      date: day.date || dates[index] || dates[0],
      activities: (day.activities || []).map((act: any, actIdx: number) => ({
        id: act.id || `day${index + 1}_${actIdx + 1}`,
        name: act.name || "Activity",
        description: act.description || "",
        location: act.location || destination,
        coordinates:
          act.coordinates && typeof act.coordinates === "object"
            ? { lat: Number(act.coordinates.lat) || 0, lng: Number(act.coordinates.lng) || 0 }
            : { lat: 0, lng: 0 },
        duration: act.duration || "2 hours",
        cost: Math.max(0, Number(act.cost) || 0),
        category: ["attraction", "restaurant", "activity", "transport", "accommodation"].includes(act.category)
          ? act.category
          : "attraction",
        is_hidden_gem: Boolean(act.is_hidden_gem),
        time_slot: act.time_slot || "",
      })),
      total_cost: 0,
    }));

    for (const day of validated) {
      day.total_cost = day.activities.reduce(
        (sum: number, a: any) => sum + a.cost,
        0
      );
    }

    return new Response(JSON.stringify({ itinerary: validated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
