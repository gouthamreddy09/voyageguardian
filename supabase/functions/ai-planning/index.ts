import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ModelConfig {
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  strategic: {
    model: "gpt-4o",
    systemPrompt: `You are a Strategic Travel Planner -- an expert in high-level trip planning, goal setting, and complex travel decision making. You help travelers:
- Define clear trip objectives and priorities
- Evaluate destination choices with pros/cons analysis
- Create high-level trip frameworks before diving into details
- Make complex decisions about multi-city routing, visa requirements, seasonal considerations
- Balance competing priorities (budget vs comfort, packed schedule vs relaxation)
- Identify potential conflicts or issues in travel plans early

Always provide structured, actionable strategic advice. Use bullet points and numbered lists. When analyzing options, present a clear comparison. Be decisive in your recommendations while explaining your reasoning.`,
    maxTokens: 1500,
    temperature: 0.7,
  },
  tasks: {
    model: "gpt-4o",
    systemPrompt: `You are a Task Optimizer for travel planning -- an expert at breaking down travel goals into concrete, actionable tasks. You help travelers:
- Decompose trip planning into manageable steps with clear priorities
- Identify task dependencies (e.g., book flights before hotels in certain cases)
- Create packing lists, booking checklists, and pre-trip preparation lists
- Prioritize tasks by urgency and importance
- Suggest the optimal order for completing travel preparations
- Break down each day's itinerary into specific timed activities

Always output structured task lists with clear priorities (high/medium/low), estimated time to complete, and dependencies. Format tasks clearly with checkboxes or numbered steps.`,
    maxTokens: 1500,
    temperature: 0.5,
  },
  schedule: {
    model: "gpt-4o-mini",
    systemPrompt: `You are a Schedule Analyzer for travel planning -- an expert in time management, calendar optimization, and realistic scheduling. You help travelers:
- Estimate realistic travel times between locations including transit buffer
- Optimize daily schedules to minimize wasted time
- Account for opening hours, peak times, and seasonal availability
- Suggest ideal time slots for activities based on crowd patterns and weather
- Identify scheduling conflicts and propose alternatives
- Create balanced daily itineraries that avoid over-scheduling

Always provide specific times and durations. Flag unrealistic schedules. Include buffer time for meals, rest, and unexpected delays. Consider jet lag for international trips.`,
    maxTokens: 1200,
    temperature: 0.4,
  },
  resources: {
    model: "gpt-4o-mini",
    systemPrompt: `You are a Resource Allocator for travel planning -- an expert in budget planning, resource distribution, and capacity optimization. You help travelers:
- Create detailed budget breakdowns by category (accommodation, food, transport, activities, shopping, emergency fund)
- Suggest money-saving alternatives without sacrificing experience quality
- Optimize spending across trip days (splurge days vs budget days)
- Calculate per-person costs for group trips with fair splitting
- Track spending against budget with variance analysis
- Recommend currency exchange timing and payment methods

Always provide specific dollar amounts or ranges. Include cost comparisons when suggesting alternatives. Factor in tips, taxes, and hidden fees. Present budgets in clear table format when possible.`,
    maxTokens: 1200,
    temperature: 0.4,
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      messages,
      aspect = "strategic",
      stream = false,
      apiKey,
      tripContext,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiKey = apiKey || Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          error: "No API key available. Please configure your OpenAI API key in Settings.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const config = MODEL_CONFIGS[aspect] || MODEL_CONFIGS.strategic;

    let systemPrompt = config.systemPrompt;
    if (tripContext) {
      systemPrompt += `\n\nCurrent trip context:\n- Destination: ${tripContext.destination || "Not set"}\n- Dates: ${tripContext.startDate || "?"} to ${tripContext.endDate || "?"}\n- Budget: ${tripContext.budgetCurrency || "USD"} ${tripContext.budget || "Not set"}\n- Travelers: ${tripContext.travelers || 1}\n- Style: ${tripContext.travelStyle || "balanced"}\n- Interests: ${(tripContext.interests || []).join(", ") || "Not specified"}`;
    }

    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10),
    ];

    if (stream) {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: openaiMessages,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = "OpenAI request failed";
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error?.message || errMsg;
        } catch {
          // use default
        }
        return new Response(JSON.stringify({ error: errMsg }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const readable = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith("data: ")) continue;
                const data = trimmed.slice(6);
                if (data === "[DONE]") {
                  controller.enqueue(
                    new TextEncoder().encode("data: [DONE]\n\n")
                  );
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({ content, model: config.model })}\n\n`
                      )
                    );
                  }
                } catch {
                  // skip malformed chunks
                }
              }
            }
          } catch (err) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ error: String(err) })}\n\n`
              )
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming request
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: openaiMessages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return new Response(
        JSON.stringify({
          error: errData.error?.message || "OpenAI request failed",
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const reply =
      data.choices[0]?.message?.content ||
      "Sorry, I could not generate a response.";
    const usage = data.usage || { total_tokens: 0 };

    return new Response(
      JSON.stringify({
        message: reply,
        model: config.model,
        tokens: usage.total_tokens,
        success: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
