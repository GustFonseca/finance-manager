import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { OFFLINE_MESSAGE, OfflineNotice } from '../OfflineNotice';

function setOnline(online: boolean) {
  jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
}

function goTo(online: boolean) {
  setOnline(online);
  act(() => {
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  });
}

afterEach(() => jest.restoreAllMocks());

describe('OfflineNotice', () => {
  it('stays hidden while online', () => {
    setOnline(true);
    render(<OfflineNotice />);
    expect(screen.queryByText(OFFLINE_MESSAGE)).toBeNull();
  });

  it('warns that the saved data is shown while offline', () => {
    setOnline(false);
    render(<OfflineNotice />);
    expect(screen.getByText('Sem conexão — mostrando os últimos dados salvos')).toBeTruthy();
    expect(screen.getByTestId('icon-plug')).toBeTruthy();
  });

  it('follows the connection changes and stops listening when unmounted', () => {
    setOnline(true);
    const { unmount } = render(<OfflineNotice />);

    goTo(false);
    expect(screen.getByText(OFFLINE_MESSAGE)).toBeTruthy();
    goTo(true);
    expect(screen.queryByText(OFFLINE_MESSAGE)).toBeNull();

    const remove = jest.spyOn(window, 'removeEventListener');
    unmount();
    expect(remove).toHaveBeenCalledWith('online', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
