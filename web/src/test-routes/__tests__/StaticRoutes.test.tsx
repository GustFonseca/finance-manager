import React from 'react';
import { render, screen } from '@testing-library/react';
import Root from '../../../app/+html';
import NotFoundScreen from '../../../app/+not-found';

const { renderToStaticMarkup } = require('react-dom/server.node') as {
  renderToStaticMarkup: (element: React.ReactElement) => string;
};

describe('+html', () => {
  it('builds a Portuguese page with the XP desktop background and font', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const html = renderToStaticMarkup(
      <Root>
        <div id="app">conteúdo</div>
      </Root>
    );

    expect(html).toContain('<html lang="pt-BR">');
    expect(html).toContain('<meta charSet="utf-8"/>');
    expect(html).toContain('background-color: #3A6EA5');
    expect(html).toContain('font-family: Tahoma');
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
