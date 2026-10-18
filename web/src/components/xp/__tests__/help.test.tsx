import React from 'react';
import { render, screen } from '@testing-library/react';
import { HELP_SEEN_KEY, HelpProvider, HelpTopic, hasSeenHelp, markHelpSeen, useHelp } from '../help';

const topic: HelpTopic = {
  title: 'Metas',
  icon: 'bullseye',
  summary: 'resumo',
  howItWorks: ['funciona'],
  steps: [{ title: 'passo', text: 'texto' }],
};

function Probe({ id }: { id: string }) {
  const help = useHelp(id);
  return <span>{help ? `ajuda ${help.topic.title}` : 'sem ajuda'}</span>;
}

describe('useHelp', () => {
  it('returns null without a provider', () => {
    render(<Probe id="/goals" />);
    expect(screen.getByText('sem ajuda')).toBeTruthy();
  });

  it('returns null without a presenter', () => {
    render(
      <HelpProvider topics={{ '/goals': topic }} present={null}>
        <Probe id="/goals" />
      </HelpProvider>
    );
    expect(screen.getByText('sem ajuda')).toBeTruthy();
  });

  it('returns null when the topic is missing', () => {
    render(
      <HelpProvider topics={{ '/goals': topic }} present={() => null}>
        <Probe id="/accounts" />
      </HelpProvider>
    );
    expect(screen.getByText('sem ajuda')).toBeTruthy();
  });

  it('returns the topic and presenter when both exist', () => {
    render(
      <HelpProvider topics={{ '/goals': topic }} present={() => null}>
        <Probe id="/goals" />
      </HelpProvider>
    );
    expect(screen.getByText('ajuda Metas')).toBeTruthy();
  });
});

describe('help seen storage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts empty and remembers seen ids without duplicates', () => {
    expect(hasSeenHelp('/goals')).toBe(false);
    markHelpSeen('/goals');
    markHelpSeen('/goals');
    markHelpSeen('/accounts');
    expect(hasSeenHelp('/goals')).toBe(true);
    expect(hasSeenHelp('/accounts')).toBe(true);
    expect(JSON.parse(localStorage.getItem(HELP_SEEN_KEY) as string)).toEqual(['/goals', '/accounts']);
  });

  it('does not write again when the id was already seen', () => {
    localStorage.setItem(HELP_SEEN_KEY, JSON.stringify(['/goals']));
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    markHelpSeen('/goals');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('treats invalid json as empty', () => {
    localStorage.setItem(HELP_SEEN_KEY, '{nope');
    expect(hasSeenHelp('/goals')).toBe(false);
    markHelpSeen('/goals');
    expect(JSON.parse(localStorage.getItem(HELP_SEEN_KEY) as string)).toEqual(['/goals']);
  });

  it('treats a non array value as empty', () => {
    localStorage.setItem(HELP_SEEN_KEY, JSON.stringify({ '/goals': true }));
    expect(hasSeenHelp('/goals')).toBe(false);
    markHelpSeen('/goals');
    expect(JSON.parse(localStorage.getItem(HELP_SEEN_KEY) as string)).toEqual(['/goals']);
  });

  it('survives a storage that throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(hasSeenHelp('/goals')).toBe(false);
    expect(() => markHelpSeen('/goals')).not.toThrow();
  });

  it('swallows a failing write', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    expect(() => markHelpSeen('/goals')).not.toThrow();
    expect(hasSeenHelp('/goals')).toBe(false);
  });
});
