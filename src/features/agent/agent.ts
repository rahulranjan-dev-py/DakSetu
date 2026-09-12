import { useLocalStorage } from '@/hooks/useLocalStorage.ts'

export interface AgentProfile {
  name: string
  designation: string
  mobile: string
  office: string
}

export const EMPTY_AGENT: AgentProfile = { name: '', designation: '', mobile: '', office: '' }

export function useAgentProfile() {
  return useLocalStorage<AgentProfile>('postal-mitra:agent', EMPTY_AGENT)
}

export function agentContactLine(agent: AgentProfile): string {
  const parts = [agent.name, agent.designation, agent.office].filter(Boolean)
  const line = parts.join(', ')
  return agent.mobile ? (line ? `${line} – ${agent.mobile}` : agent.mobile) : line
}
