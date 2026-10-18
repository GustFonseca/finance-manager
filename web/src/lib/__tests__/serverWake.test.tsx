import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { isServerWaking, SLOW_REQUEST_MS, trackRequest, useServerWaking } from '../serverWake';

function Probe() {
  return <span>{useServerWaking() ? 'acordando' : 'pronto'}</span>;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('serverWake', () => {
  it('does not flag requests that finish quickly', () => {
    const done = trackRequest();
    jest.advanceTimersByTime(SLOW_REQUEST_MS - 1);
    done();
    jest.advanceTimersByTime(SLOW_REQUEST_MS);

    expect(isServerWaking()).toBe(false);
  });

  it('flags a request as slow after the delay and clears it when done', () => {
    const done = trackRequest();
    jest.advanceTimersByTime(SLOW_REQUEST_MS);
    expect(isServerWaking()).toBe(true);

    done();
    expect(isServerWaking()).toBe(false);
    done();
    expect(isServerWaking()).toBe(false);
  });

  it('stays waking while any slow request is pending', () => {
    const first = trackRequest();
    const second = trackRequest();
    jest.advanceTimersByTime(SLOW_REQUEST_MS);

    first();
    expect(isServerWaking()).toBe(true);
    second();
    expect(isServerWaking()).toBe(false);
  });

  it('re-renders subscribers when the state changes', () => {
    const { unmount } = render(<Probe />);
    expect(screen.getByText('pronto')).toBeTruthy();

    let done = () => {};
    act(() => {
      done = trackRequest();
      jest.advanceTimersByTime(SLOW_REQUEST_MS);
    });
    expect(screen.getByText('acordando')).toBeTruthy();

    act(() => done());
    expect(screen.getByText('pronto')).toBeTruthy();
    unmount();
  });
});
