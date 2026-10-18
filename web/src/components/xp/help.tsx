import React, { createContext, useContext } from 'react';
import type { IconName } from './TitleBar';

export type HelpStep = {
  title: string;
  text: string;
};

export type HelpTopic = {
  title: string;
  icon: IconName;
  summary: string;
  howItWorks: string[];
  steps: HelpStep[];
  tips?: string[];
};

export type HelpRegistry = Record<string, HelpTopic>;

export type HelpPresenter = (topic: HelpTopic, onClose: () => void) => React.ReactNode;

type HelpContextValue = {
  topics: HelpRegistry;
  present: HelpPresenter | null;
};

const HelpContext = createContext<HelpContextValue>({ topics: {}, present: null });

export function HelpProvider({ topics, present, children }: HelpContextValue & { children: React.ReactNode }) {
  return <HelpContext.Provider value={{ topics, present }}>{children}</HelpContext.Provider>;
}

export function useHelp(id: string) {
  const { topics, present } = useContext(HelpContext);
  const topic = topics[id];
  return topic && present ? { topic, present } : null;
}

export const HELP_SEEN_KEY = 'fm_help_seen';

function readSeen(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HELP_SEEN_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasSeenHelp(id: string): boolean {
  return readSeen().includes(id);
}

export function markHelpSeen(id: string) {
  try {
    const seen = readSeen();
    if (!seen.includes(id)) localStorage.setItem(HELP_SEEN_KEY, JSON.stringify([...seen, id]));
  } catch {
    return;
  }
}
