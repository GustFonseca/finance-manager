import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { HelpTopic } from '@/components/xp';
import { HelpWizard, presentHelp } from '../HelpWizard';

const topic: HelpTopic = {
  title: 'Metas',
  icon: 'bullseye',
  summary: 'Acompanhe seus objetivos.',
  howItWorks: ['Cada meta tem um valor alvo.', 'O progresso soma os aportes.'],
  steps: [
    { title: 'Crie a meta', text: 'Clique em Nova meta.' },
    { title: 'Faça aportes', text: 'Registre cada depósito.' },
  ],
  tips: ['Revise todo mês.'],
};

function button(name: string) {
  return screen.getByRole('button', { name });
}

describe('HelpWizard', () => {
  it('walks through the intro, the steps and the tips', () => {
    const onClose = jest.fn();
    render(<HelpWizard topic={topic} onClose={onClose} />);

    expect(screen.getByText('Como funciona: Metas')).toBeTruthy();
    expect(screen.getByText('O que esta janela faz')).toBeTruthy();
    expect(screen.getByText('Acompanhe seus objetivos.')).toBeTruthy();
    expect(screen.getByText('Cada meta tem um valor alvo.')).toBeTruthy();
    expect(screen.getByText('O progresso soma os aportes.')).toBeTruthy();
    expect(screen.getByTestId('icon-bullseye')).toBeTruthy();
    expect(button('< Voltar').getAttribute('aria-disabled')).toBe('true');
    expect(screen.queryByText('Dicas')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Concluir' })).toBeNull();

    fireEvent.click(button('Avançar >'));
    expect(screen.getByText('Crie a meta')).toBeTruthy();
    expect(screen.getByText('Passo 1 de 2')).toBeTruthy();
    expect(screen.getByText('Clique em Nova meta.')).toBeTruthy();
    expect(screen.queryByText('Acompanhe seus objetivos.')).toBeNull();
    expect(screen.queryByText('Dicas')).toBeNull();
    expect(button('< Voltar').getAttribute('aria-disabled')).toBeNull();

    fireEvent.click(button('< Voltar'));
    expect(screen.getByText('O que esta janela faz')).toBeTruthy();

    fireEvent.click(button('Avançar >'));
    fireEvent.click(button('Avançar >'));
    expect(screen.getByText('Passo 2 de 2')).toBeTruthy();
    expect(screen.getByText('Registre cada depósito.')).toBeTruthy();
    expect(screen.getByText('Dicas')).toBeTruthy();
    expect(screen.getByText('Revise todo mês.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Avançar >' })).toBeNull();

    fireEvent.click(button('Concluir'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('omits the tips section when the topic has none', () => {
    render(<HelpWizard topic={{ ...topic, tips: undefined }} onClose={jest.fn()} />);
    fireEvent.click(button('Avançar >'));
    fireEvent.click(button('Avançar >'));
    expect(screen.getByText('Passo 2 de 2')).toBeTruthy();
    expect(screen.queryByText('Dicas')).toBeNull();
  });

  it('omits the tips section when the tips are empty', () => {
    render(<HelpWizard topic={{ ...topic, steps: [], tips: [] }} onClose={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeTruthy();
    expect(screen.queryByText('Dicas')).toBeNull();
  });

  it('finishes right away when the topic has no steps', () => {
    const onClose = jest.fn();
    render(<HelpWizard topic={{ ...topic, steps: [] }} onClose={onClose} />);
    expect(screen.getByText('O que esta janela faz')).toBeTruthy();
    expect(screen.getByText('Dicas')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Avançar >' })).toBeNull();
    fireEvent.click(button('Concluir'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the title bar', () => {
    const onClose = jest.fn();
    render(<HelpWizard topic={topic} onClose={onClose} />);
    fireEvent.click(button('Fechar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('is returned by the presenter', () => {
    const onClose = jest.fn();
    render(<>{presentHelp(topic, onClose)}</>);
    expect(screen.getByText('Como funciona: Metas')).toBeTruthy();
    fireEvent.click(button('Avançar >'));
    fireEvent.click(button('Avançar >'));
    fireEvent.click(button('Concluir'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
