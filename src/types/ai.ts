export type PlanningAspect = 'strategic' | 'tasks' | 'schedule' | 'resources';

export interface ModelConfig {
  id: PlanningAspect;
  name: string;
  description: string;
  model: string;
  icon: string;
  color: string;
}

export const PLANNING_MODELS: ModelConfig[] = [
  {
    id: 'strategic',
    name: 'Strategic Planner',
    description: 'High-level goals, destination analysis, trip frameworks',
    model: 'gpt-4o',
    icon: 'Brain',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'tasks',
    name: 'Task Optimizer',
    description: 'Task breakdown, checklists, prioritization',
    model: 'gpt-4o',
    icon: 'ListChecks',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'schedule',
    name: 'Schedule Analyzer',
    description: 'Time estimation, calendar optimization, daily flow',
    model: 'gpt-4o-mini',
    icon: 'Clock',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'resources',
    name: 'Resource Allocator',
    description: 'Budget planning, cost optimization, spending strategy',
    model: 'gpt-4o-mini',
    icon: 'DollarSign',
    color: 'from-rose-500 to-pink-500',
  },
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model_used: string;
  aspect: PlanningAspect;
  tokens_used: number;
  created_at: string;
  isStreaming?: boolean;
}

export interface AISuggestion {
  id: string;
  suggestion_type: string;
  suggestion_text: string;
  context: string;
  model_used: string;
  accepted: boolean | null;
}

export interface TripContext {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  budgetCurrency: string;
  travelers: number;
  travelStyle: string;
  interests: string[];
}

export interface AIStreamEvent {
  content?: string;
  model?: string;
  error?: string;
}

export interface AIChatResponse {
  message: string;
  model: string;
  tokens: number;
  success: boolean;
  error?: string;
}

export interface QuickAction {
  label: string;
  prompt: string;
  aspect: PlanningAspect;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Review my plan', prompt: 'Review my current trip plan and give me comprehensive feedback on what could be improved.', aspect: 'strategic' },
  { label: 'Break into tasks', prompt: 'Break down my trip preparation into a prioritized task list with deadlines and dependencies.', aspect: 'tasks' },
  { label: 'Optimize schedule', prompt: 'Analyze my trip schedule and suggest optimizations to reduce wasted time and improve the daily flow.', aspect: 'schedule' },
  { label: 'Budget breakdown', prompt: 'Create a detailed budget breakdown for my trip, categorized by accommodation, food, transport, activities, and emergency fund.', aspect: 'resources' },
  { label: 'Risk assessment', prompt: 'Identify potential risks, bottlenecks, or issues with my current trip plan and suggest mitigations.', aspect: 'strategic' },
  { label: 'What-if analysis', prompt: 'What would change if I had to cut my trip short by 2 days? How should I reprioritize?', aspect: 'schedule' },
];
