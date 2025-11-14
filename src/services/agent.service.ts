import { apiClient } from './api';

export interface AgentRequest {
  question: string;
}

export interface AgentResponse {
  answer: string;
  system_used: string;
  system_id?: string;
  confidence?: number;
}

export const agentService = {
  async process(data: AgentRequest): Promise<AgentResponse> {
    return apiClient.post('/agent/process', data);
  },
};
