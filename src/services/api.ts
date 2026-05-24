interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface ChatResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class APIService {
  private static readonly OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  private static readonly WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
  private static readonly EXCHANGE_API_KEY = import.meta.env.VITE_EXCHANGE_API_KEY;

  // Rate limiting for API calls
  private static lastOpenAICall = 0;
  private static readonly OPENAI_RATE_LIMIT = 500; // 500ms between calls
  private static callQueue: Array<() => Promise<any>> = [];
  private static isProcessingQueue = false;
  private static rateLimitHit = false; // Track if we've hit rate limits

  private static async callOpenAI(prompt: string, maxTokens: number = 2000, retries: number = 3): Promise<string> {
    if (!this.OPENAI_API_KEY || this.OPENAI_API_KEY === 'your_openai_api_key') {
      throw new Error('OpenAI API key not configured');
    }

    // If we've hit rate limits before, skip OpenAI and use fallback
    if (this.rateLimitHit) {
      throw new Error('rate_limit_bypass');
    }

    return new Promise((resolve, reject) => {
      this.callQueue.push(async () => {
        try {
          const result = await this.makeOpenAIRequest(prompt, maxTokens, retries);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  private static async processQueue() {
    if (this.isProcessingQueue || this.callQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.callQueue.length > 0) {
      const call = this.callQueue.shift();
      if (call) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastCall = now - this.lastOpenAICall;
        if (timeSinceLastCall < this.OPENAI_RATE_LIMIT) {
          await new Promise(resolve => setTimeout(resolve, this.OPENAI_RATE_LIMIT - timeSinceLastCall));
        }
        
        await call();
        this.lastOpenAICall = Date.now();
      }
    }
    
    this.isProcessingQueue = false;
  }

  private static async makeOpenAIRequest(prompt: string, maxTokens: number, retries: number): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo-1106',
          messages: [
            {
              role: 'system',
              content: `You are an expert travel planner with deep knowledge of destinations worldwide. You create detailed, personalized itineraries that include:
              - Local hidden gems and authentic experiences
              - Practical timing and logistics
              - Budget-conscious recommendations
              - Cultural insights and tips
              - Weather-appropriate activities
              - Local transportation options
              - Food recommendations including local specialties
              - Safety and cultural etiquette advice
              
              Always provide specific, actionable recommendations with realistic costs and timing.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Mark that we've hit rate limits
          this.rateLimitHit = true;
          if (retries > 0) {
            const backoffDelay = Math.pow(2, (3 - retries)) * 1000;
            console.log(`Rate limited, retrying in ${backoffDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return this.makeOpenAIRequest(prompt, maxTokens, retries - 1);
          }
          throw new Error('rate_limit');
        }
        if (response.status === 401) {
          throw new Error('invalid_api_key');
        }
        if (response.status >= 500) {
          if (retries > 0) {
            console.log(`Server error, retrying in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return this.makeOpenAIRequest(prompt, maxTokens, retries - 1);
          }
        }
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      if (error instanceof Error && error.message === 'rate_limit' && retries > 0) {
        this.rateLimitHit = true;
        const backoffDelay = Math.pow(2, (3 - retries)) * 1000;
        console.log(`Rate limit error, retrying in ${backoffDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.makeOpenAIRequest(prompt, maxTokens, retries - 1);
      }
      throw error;
    }
  }

  static async generateItinerary(
    destination: string,
    days: number,
    budget: number,
    interests: string[],
    dates: string[],
    travelStyle: string
  ) {
    // Always use fallback itinerary to avoid rate limit errors
    console.log('Using fallback itinerary (OpenAI disabled to prevent rate limits)');
    return this.generateFallbackItinerary(destination, days, dates, budget, travelStyle);
  }

  private static validateAndEnhanceItinerary(itinerary: any[], destination: string, dates: string[], budget: number) {
    return itinerary.map((day, index) => {
      // Ensure proper structure
      const validDay = {
        day: day.day || index + 1,
        date: day.date || dates[index] || new Date().toISOString().split('T')[0],
        activities: [],
        total_cost: 0
      };

      // Validate activities
      if (Array.isArray(day.activities)) {
        validDay.activities = day.activities.map((activity, actIndex) => ({
          id: activity.id || `day${validDay.day}_activity${actIndex + 1}`,
          name: activity.name || `Activity ${actIndex + 1}`,
          description: activity.description || 'Explore this amazing location',
          location: activity.location || destination,
          coordinates: activity.coordinates && typeof activity.coordinates === 'object' 
            ? activity.coordinates 
            : { lat: 0, lng: 0 },
          duration: activity.duration || '2 hours',
          cost: Math.max(0, Number(activity.cost) || 20),
          category: ['attraction', 'restaurant', 'activity', 'transport', 'accommodation'].includes(activity.category) 
            ? activity.category : 'attraction',
          is_hidden_gem: Boolean(activity.is_hidden_gem),
          time_slot: activity.time_slot || `${9 + actIndex * 2}:00 AM - ${11 + actIndex * 2}:00 AM`
        }));
      }

      // Calculate total cost
      validDay.total_cost = Math.round(validDay.activities.reduce((sum, activity) => sum + (Number(activity.cost) || 0), 0));

      return validDay;
    });
  }

  private static generateFallbackItinerary(destination: string, days: number, dates: string[], budget: number, travelStyle: string) {
    // Ensure we have valid dates
    const safeDates = dates.length > 0 ? dates : [new Date().toISOString().split('T')[0]];
    const safeDestination = destination || 'Your Destination';
    const safeBudget = Number(budget) || 1000;
    const safeDays = Math.max(1, Math.min(30, Number(days) || 1));
    
    const budgetPerDay = Math.round(budget / days);
    const baseCost = travelStyle === 'budget' ? 15 : travelStyle === 'luxury' ? 80 : 40;

    return Array.from({ length: safeDays }, (_, dayIndex) => ({
      day: dayIndex + 1,
      date: safeDates[dayIndex] || safeDates[0],
      activities: [
        {
          id: `day${dayIndex + 1}_morning`,
          name: `Explore ${safeDestination} City Center`,
          description: `Start your day exploring the heart of ${safeDestination}. Visit local markets, historic buildings, and get a feel for the city's atmosphere.`,
          location: `${safeDestination} City Center`,
          coordinates: { lat: 0, lng: 0 },
          duration: '3 hours',
          cost: baseCost,
          category: 'attraction',
          is_hidden_gem: false,
          time_slot: '9:00 AM - 12:00 PM'
        },
        {
          id: `day${dayIndex + 1}_lunch`,
          name: `Local Restaurant Experience`,
          description: `Enjoy authentic local cuisine at a highly-rated restaurant. Try regional specialties and immerse yourself in the local food culture.`,
          location: `${safeDestination} Restaurant District`,
          coordinates: { lat: 0, lng: 0 },
          duration: '1.5 hours',
          cost: Math.round(baseCost * 0.8),
          category: 'restaurant',
          is_hidden_gem: false,
          time_slot: '12:30 PM - 2:00 PM'
        },
        {
          id: `day${dayIndex + 1}_afternoon`,
          name: `Hidden Local Gem`,
          description: `Discover a lesser-known but amazing local spot that most tourists miss. This authentic experience will give you unique insights into local culture.`,
          location: `${safeDestination} Local Area`,
          coordinates: { lat: 0, lng: 0 },
          duration: '2.5 hours',
          cost: Math.round(baseCost * 0.6),
          category: 'activity',
          is_hidden_gem: true,
          time_slot: '2:30 PM - 5:00 PM'
        },
        {
          id: `day${dayIndex + 1}_evening`,
          name: `Evening Cultural Experience`,
          description: `End your day with a cultural activity - perhaps a local performance, sunset viewing spot, or traditional evening market.`,
          location: `${safeDestination} Cultural District`,
          coordinates: { lat: 0, lng: 0 },
          duration: '2 hours',
          cost: Math.round(baseCost * 1.2),
          category: 'attraction',
          is_hidden_gem: false,
          time_slot: '6:00 PM - 8:00 PM'
        }
      ],
      total_cost: Math.round(baseCost * 3.6)
    }));
  }

  static async getChatResponse(message: string, conversationHistory: Array<{ role: string; content: string }> = []): Promise<ChatResponse> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/chat-assistant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Apikey': supabaseAnonKey,
          },
          body: JSON.stringify({ message, conversationHistory }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          return { success: true, message: data.message };
        }

        if (response.status === 429) {
          return {
            success: false,
            error: 'rate_limit',
            message: 'Too many requests. Please wait a moment before trying again.'
          };
        }

        return {
          success: false,
          message: data.error || 'Sorry, I could not generate a response. Please try again.'
        };
      } catch {
        // fall through to keyword-based response
      }
    }

    return {
      success: true,
      message: this.getKeywordResponse(message)
    };
  }

  private static getKeywordResponse(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('how') && (lower.includes('use') || lower.includes('work') || lower.includes('start') || lower.includes('plan'))) {
      return "Here's how to use TravelPlan:\n\n1. Click \"Start Planning\" on the home page\n2. Fill in your destination, travel dates, budget, and number of travelers\n3. Choose your travel style: Budget, Balanced, or Luxury\n4. Select your interests (Food, Culture, Adventure, etc.)\n5. Hit \"Generate Itinerary\" and get a full day-by-day plan!\n\nYou can save trips to your dashboard and revisit them anytime. You'll also see weather forecasts and a currency converter for your destination.";
    }

    if (lower.includes('save') || lower.includes('dashboard') || lower.includes('my trips') || lower.includes('saved')) {
      return "To save and manage your trips:\n\n• After generating an itinerary, click \"Save Trip\" to store it\n• Access all saved trips from the Dashboard (click the grid icon in the header)\n• You can rename or delete saved trips anytime\n• You need to be signed in to save trips\n\nHaven't created your first trip yet? Click \"Start Planning\" to get started!";
    }

    if (lower.includes('budget') || lower.includes('cheap') || lower.includes('cost') || lower.includes('money') || lower.includes('price')) {
      return "TravelPlan helps with budgeting:\n\n• Set your total budget in the trip planner (30+ currencies supported)\n• Choose \"Budget Traveler\" style for affordable recommendations\n• Your itinerary shows estimated costs per activity and per day\n• The dashboard includes a currency converter for your destination\n\nTip: Try different travel styles to see how costs compare! Click \"Start Planning\" to set your budget.";
    }

    if (lower.includes('weather') || lower.includes('climate') || lower.includes('season') || lower.includes('when to go') || lower.includes('best time')) {
      return "Weather info in TravelPlan:\n\n• After generating your itinerary, the dashboard shows a weather forecast for your destination and dates\n• This helps you plan activities and pack appropriately\n\nGeneral tips:\n• Shoulder seasons often offer great weather with fewer crowds\n• Tropical destinations have distinct wet and dry seasons\n\nCreate a trip with your dates to see the forecast!";
    }

    if (lower.includes('currency') || lower.includes('exchange') || lower.includes('convert')) {
      return "TravelPlan has a built-in currency converter!\n\n• Set your preferred currency when planning a trip (30+ options)\n• The dashboard shows a currency converter for your destination\n• All cost estimates in your itinerary use your selected currency\n\nTo use it, generate an itinerary and check the sidebar on your dashboard.";
    }

    if (lower.includes('interest') || lower.includes('style') || lower.includes('preference') || lower.includes('customize') || lower.includes('personalize')) {
      return "Personalize your trip in the planner:\n\nTravel Styles:\n• Budget Traveler — affordable options and local experiences\n• Balanced Explorer — mix of comfort and adventure\n• Luxury Seeker — premium experiences and accommodations\n\nInterests (select multiple):\n• Culture & History, Food & Dining, Adventure Sports\n• Nature & Wildlife, Art & Museums, Nightlife\n• Photography, Shopping, Local Markets, Architecture\n\nYour selections shape the entire itinerary. Try different combos!";
    }

    if (lower.includes('sign') || lower.includes('login') || lower.includes('log in') || lower.includes('account') || lower.includes('register')) {
      return "Account info:\n\n• Click \"Sign In\" in the top-right corner to log in or create an account\n• You need an account to save trips to your dashboard\n• You can browse and generate itineraries without signing in\n• If you forgot your password, use the \"Reset Password\" option on the login screen";
    }

    if (lower.includes('itinerary') || lower.includes('activities') || lower.includes('hidden gem') || lower.includes('recommendation')) {
      return "About your generated itinerary:\n\n• Each trip gets a full day-by-day plan with timed activities\n• Activities include attractions, restaurants, cultural experiences, and more\n• Look for the \"Hidden Gem\" tag — these are lesser-known spots most tourists miss\n• Each activity shows estimated cost, duration, and location\n• Your travel style and interests directly shape the recommendations\n\nClick \"Start Planning\" to generate your personalized itinerary!";
    }

    if (lower.includes('food') || lower.includes('eat') || lower.includes('restaurant') || lower.includes('cuisine') || lower.includes('dish')) {
      return "For food recommendations:\n\n• Select \"Food & Dining\" as an interest in the trip planner\n• Your itinerary will include restaurant suggestions with local specialties\n• Hidden gem restaurants are marked so you can find authentic spots\n• Each food activity shows estimated cost and location\n\nTip: Combine \"Food & Dining\" with \"Local Markets\" for the best culinary experience!";
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('help')) {
      return "Welcome to TravelPlan! I'm here to help you use the app and plan your trips.\n\nI can help with:\n\n• How to create and save trips\n• Choosing travel styles and interests\n• Understanding your itinerary and budget estimates\n• Weather and currency tools on the dashboard\n• Tips for your specific destination\n\nWhat would you like to know?";
    }

    if (lower.includes('visa') || lower.includes('passport') || lower.includes('pack') || lower.includes('luggage') || lower.includes('flight') || lower.includes('hotel') || lower.includes('safe') || lower.includes('solo')) {
      return `That's a great travel question! While I'm best at helping you use TravelPlan's features, here's a quick tip:\n\n• Use the trip planner to set your destination and preferences\n• Your generated itinerary will include practical recommendations\n• Select relevant interests (like "Culture & History" or "Adventure Sports") for tailored suggestions\n\nWant to create a trip? Click "Start Planning" and I'll help you make the most of it!`;
    }

    return `I'm the TravelPlan assistant — here to help you get the most out of this app!\n\nHere's what you can do:\n\n• Click "Start Planning" to create a personalized trip itinerary\n• Set your destination, dates, budget, travel style, and interests\n• Save trips to your dashboard and revisit them anytime\n• Check weather forecasts and convert currencies on the dashboard\n\nIs there something specific about the app I can help with?`;
  }

  static async getWeatherForecast(destination: string, dates: string[]) {
    try {
      if (!this.WEATHER_API_KEY || this.WEATHER_API_KEY === 'your_weather_api_key') {
        // Return mock weather data
        return dates.map(date => ({
          date,
          temperature: { min: 18, max: 25 },
          condition: 'Partly Cloudy',
          icon: 'partly-cloudy',
          humidity: 65,
          wind_speed: 12
        }));
      }

      // For demo purposes, return realistic mock data
      const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'];
      
      return dates.map(date => ({
        date,
        temperature: {
          min: Math.floor(Math.random() * 10) + 15,
          max: Math.floor(Math.random() * 10) + 25
        },
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        icon: 'weather-icon',
        humidity: Math.floor(Math.random() * 30) + 50,
        wind_speed: Math.floor(Math.random() * 15) + 5
      }));

    } catch (error) {
      console.error('Weather API error:', error);
      // Return fallback data
      return dates.map(date => ({
        date,
        temperature: { min: 20, max: 26 },
        condition: 'Pleasant',
        icon: 'sun',
        humidity: 60,
        wind_speed: 10
      }));
    }
  }

  static async getCurrencyRates(from: string, to: string) {
    try {
      if (!this.EXCHANGE_API_KEY || this.EXCHANGE_API_KEY === 'your_exchange_api_key') {
        // Return mock exchange rate
        const mockRates: { [key: string]: number } = {
          'USD-EUR': 0.85, 'EUR-USD': 1.18,
          'USD-GBP': 0.73, 'GBP-USD': 1.37,
          'USD-JPY': 110, 'JPY-USD': 0.009,
          'EUR-GBP': 0.86, 'GBP-EUR': 1.16
        };
        
        const rate = mockRates[`${from}-${to}`] || 1;
        
        return {
          from,
          to,
          rate,
          last_updated: new Date().toISOString()
        };
      }

      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const data = await response.json();
      
      return {
        from,
        to,
        rate: data.rates[to] || 1,
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Currency API error:', error);
      return {
        from,
        to,
        rate: 1,
        last_updated: new Date().toISOString()
      };
    }
  }
}