// src/App.test.js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders BlockForgeUltimate title', () => {
    render(<App />);
    const titleElement = screen.getByText(/BlockForgeUltimate/i);
    expect(titleElement).toBeInTheDocument();
});
