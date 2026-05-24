import type { TripFormData, Itinerary } from '../types/itinerary';

const OPENAI_API_KEY = "YOUR_API_KEY_HERE";

function buildPrompt(form: TripFormData): string {
  return `Generate a detailed travel itinerary for the following trip. Return ONLY valid JSON matching the exact structure below — no markdown, no explanation, no wrapping.

Trip Details:
- Destination: ${form.destination}
- Duration: ${form.duration}
- Budget Level: ${form.budget}
- Trip Type: ${form.tripType}
- Travelers: ${form.travelers}
${form.notes ? `- Special Notes: ${form.notes}` : ''}

Return this JSON structure:
{
  "destination": "string",
  "summary": "2-3 sentence overview of the trip",
  "days": [
    {
      "day": 1,
      "title": "Day title/theme",
      "morning": [{"time": "8:00 AM", "activity": "Activity name", "description": "Brief description", "cost": "$XX"}],
      "afternoon": [{"time": "1:00 PM", "activity": "Activity name", "description": "Brief description", "cost": "$XX"}],
      "evening": [{"time": "7:00 PM", "activity": "Activity name", "description": "Brief description", "cost": "$XX"}],
      "meals": ["Breakfast: restaurant/suggestion", "Lunch: restaurant/suggestion", "Dinner: restaurant/suggestion"],
      "accommodation": "Hotel/hostel suggestion with price range",
      "transport": "How to get around this day",
      "estimatedCost": "$XXX total for the day"
    }
  ],
  "packingTips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
  "travelAdvice": ["advice 1", "advice 2", "advice 3", "advice 4", "advice 5"],
  "totalEstimatedCost": "$X,XXX for the entire trip"
}

Generate ${getDayCount(form.duration)} days. Include 2-3 activities per time period. Make recommendations specific and realistic for the destination, budget level, and trip type. Include actual restaurant names and place names where possible.`;
}

function getDayCount(duration: string): number {
  const map: Record<string, number> = {
    '1 day': 1,
    '2 days': 2,
    '3 days': 3,
    '5 days': 5,
    '1 week': 7,
    '2 weeks': 14,
  };
  return map[duration] || 3;
}

export async function generateItinerary(form: TripFormData): Promise<Itinerary> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner. You generate detailed, realistic travel itineraries as pure JSON. Never wrap your response in markdown code blocks. Return only the raw JSON object.',
        },
        {
          role: 'user',
          content: buildPrompt(form),
        },
      ],
      max_tokens: 4000,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check the OpenAI API key in the code.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(err.error?.message || `API request failed (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response received from the AI model.');
  }

  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned) as Itinerary;
  } catch {
    throw new Error('Failed to parse the itinerary response. Please try again.');
  }
}
