import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { http } from '@/lib/http';
import { useAuth } from '../AuthContext';
import { LoginScreen } from '../LoginScreen';
import { authApi } from '../api';

jest.mock('../AuthContext', () => ({ useAuth: jest.fn() }));

describe('LoginScreen', () => {
  it('starts the Google sign-in when the user tile is clicked', () => {
    const signInWithGoogle = jest.fn();
    jest.mocked(useAuth).mockReturnValue({ signInWithGoogle } as never);
    render(<LoginScreen />);

    expect(screen.getByText('Finance Manager')).toBeTruthy();
    expect(screen.getByText('Para começar, clique no seu nome de usuário')).toBeTruthy();
    expect(screen.getByText('Use sua conta Google')).toBeTruthy();
    expect(screen.getByText(/Depois de fazer logon/)).toBeTruthy();

    const tile = screen.getByLabelText('Entrar com Google');
    const before = tile.className;
    fireEvent.mouseEnter(tile);
    expect(tile.className).not.toBe(before);
    fireEvent.click(tile);
    expect(signInWithGoogle).toHaveBeenCalled();
  });
});

describe('authApi', () => {
  it('posts the Google id token', async () => {
    const post = jest.spyOn(http, 'post').mockResolvedValue({ data: { token: 't' } });
    await expect(authApi.googleLogin('id-tok')).resolves.toEqual({ data: { token: 't' } });
    expect(post).toHaveBeenCalledWith('/auth/google', { idToken: 'id-tok' });
    post.mockRestore();
  });
});
