import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { SLOW_REQUEST_MS, trackRequest } from '@/lib/serverWake';
import { WAKE_MESSAGE, WAKE_TITLE, WakeBalloon } from '../WakeBalloon';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('WakeBalloon', () => {
  it('stays hidden while requests are fast', () => {
    const { container } = render(<WakeBalloon />);

    expect(container.innerHTML).toBe('');
  });

  it('explains that the server is waking up while a request is slow', () => {
    render(<WakeBalloon />);
    let done = () => {};

    act(() => {
      done = trackRequest();
      jest.advanceTimersByTime(SLOW_REQUEST_MS);
    });

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(WAKE_TITLE)).toBeTruthy();
    expect(screen.getByText(WAKE_MESSAGE)).toBeTruthy();
    expect(screen.getByTestId('icon-info-circle')).toBeTruthy();

    act(() => done());
    expect(screen.queryByText(WAKE_TITLE)).toBeNull();
  });
});
