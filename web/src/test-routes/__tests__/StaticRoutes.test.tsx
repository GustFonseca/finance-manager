import React from 'react';
import { render, screen } from '@testing-library/react';
import Root from '../../../app/+html';
import NotFoundScreen from '../../../app/+not-found';

const { renderToStaticMarkup } = require('react-dom/server.node') as {
  renderToStaticMarkup: (element: React.ReactElement) => string;
};

describe('+html', () => {
  it('builds a Portuguese page with the teal desktop background, fonts and theme color', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const html = renderToStaticMarkup(
      <Root>
        <div id="app">conteúdo</div>
      </Root>
    );

    expect(html).toContain('<html lang="pt-BR">');
    expect(html).toContain('<meta charSet="utf-8"/>');
    expect(html).toContain('background-color: #306666');
    expect(html).toContain('font-family: Tahoma');
    expect(html).toContain('<meta name="theme-color" content="#22423F"/>');
    expect(html).toContain('family=Pixelify+Sans');
    expect(html).toContain('<link rel="manifest" href="/manifest.json"/>');
    expect(html).toContain('<link rel="apple-touch-icon" href="/icon.png"/>');
    expect(html).toContain('<body><div id="app">conteúdo</div></body>');
  });
});

describe('+not-found', () => {
  it('tells the user the screen does not exist and links home', () => {
    render(<NotFoundScreen />);

    expect(screen.getByText('Esta tela não existe.')).toBeTruthy();
    expect(screen.getByText('Voltar para o início')).toBeTruthy();
  });
});
