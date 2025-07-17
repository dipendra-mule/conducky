import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '../../pages/login';
import { UserContext } from '../../pages/_app';
import '@testing-library/jest-dom';

// Mock the Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    asPath: '/',
  }),
}));

describe('Login page', () => {
  it('renders email and password fields and login button', () => {
    render(
      <UserContext.Provider value={{ user: null, setUser: jest.fn(), sessionLoading: false }}>
        <LoginPage />
      </UserContext.Provider>
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
}); 