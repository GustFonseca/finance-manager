import { formatCnpj, isValidCnpj, parseReceiptText } from '../parse';

const NOW = new Date(2026, 9, 19, 20);

const read = (text: string) => {
  const r = parseReceiptText(text, NOW);
  return { total: r.totalCents, day: r.day, time: r.time, cnpj: r.cnpj, name: r.merchantName, pay: r.payment };
};

describe('receipt totals', () => {
  it('prefers the amount to pay over the gross total and ignores cash change', () => {
    const text = [
      'SUPERMERCADO BOM PRECO LTDA',
      'CNPJ: 11.222.333/0001-81 IE: 123.456.789.110',
      'Valor total R$ 34,40',
      'Desconto R$ 4,40',
      'Valor a pagar R$ 30,00',
      'FORMA PAGAMENTO VALOR PAGO R$',
      'Dinheiro 50,00',
      'Troco R$ 20,00',
      'Emissao: 19/10/2026 14:33:12',
    ].join('\n');
    expect(read(text)).toMatchObject({ total: 3000, day: '2026-10-19', time: '14:33', pay: 'CASH' });
  });

  it('ranks TOTAL A PAGAR above VALOR TOTAL', () => {
    const text = 'PADARIA REAL\nCNPJ 11.222.333/0001-81\nVALOR TOTAL R$ 50,00\nDESCONTO R$ 5,00\nTOTAL A PAGAR R$ 45,00\nCARTAO DE CREDITO 45,00\n19/10/2026 10:00';
    expect(read(text)).toMatchObject({ total: 4500, pay: 'CREDIT', name: 'Padaria Real' });
  });

  it('does not take the subtotal for the total', () => {
    const text = 'RESTAURANTE SABOR\nCNPJ 11.222.333/0001-81\nSUBTOTAL 100,00\nTAXA DE SERVICO 10% 10,00\nTOTAL 110,00\nDEBITO 110,00\n19/10/2026 21:00';
    expect(read(text)).toMatchObject({ total: 11000, pay: 'DEBIT' });
    expect(read('LOJA X\nSUBTOTAL 100,00\nDESCONTO 10,00\nVALOR PAGO 90,00\nPIX').total).toBeNull();
  });

  it('reads a total that shares its line with the change', () => {
    const text = 'LOJA Z\nCNPJ 11.222.333/0001-81\nTOTAL R$ 45,00 TROCO R$ 5,00\nDINHEIRO 50,00\n19/10/2026';
    expect(read(text)).toMatchObject({ total: 4500, pay: 'CASH' });
    expect(read('TOTAL TROCO R$ 5,00').total).toBeNull();
    expect(read('TOTAL DESCONTO\n5,00').total).toBeNull();
  });

  it('reads SAT receipts by the TOTAL R$ line', () => {
    const text = [
      'LOJA Y LTDA',
      'CNPJ 11.222.333/0001-81',
      'CUPOM FISCAL ELETRONICO - SAT',
      'Total bruto de itens 50,00',
      'Desconto sobre subtotal -5,00',
      'TOTAL R$ 45,00',
      'Cartao de Debito 45,00',
      '19/10/2026 - 14:33:12',
    ].join('\n');
    expect(read(text)).toMatchObject({ total: 4500, pay: 'DEBIT', day: '2026-10-19' });
  });

  it('reads OCR that glued TOTAL to R$ and skips zero amounts', () => {
    expect(read('TOTALR$ 31,50').total).toBe(3150);
    expect(read('TOTAL 0,00 12,00').total).toBe(1200);
  });
});

describe('receipt CNPJ', () => {
  it('reads the CNPJ on a line that also has IE and IM numbers', () => {
    const text = 'FARMACIA POPULAR LTDA\nCNPJ: 11.222.333/0001-81 IE: 123.456.789.110 IM: 1.234.567-8\nAV PAULISTA 1000\nTOTAL R$ 12,00\n19/10/2026';
    expect(read(text)).toMatchObject({ cnpj: '11222333000181', name: 'Farmacia Popular Ltda', total: 1200 });
  });

  it('validates and reads the alphanumeric CNPJ', () => {
    expect(isValidCnpj('12.ABC.345/01DE-35')).toBe(true);
    expect(isValidCnpj('12.ABC.345/01DE-36')).toBe(false);
    expect(isValidCnpj('AAAAAAAAAAAAAA')).toBe(false);
    expect(formatCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35');
    expect(read('MERCADO NOVO LTDA\nCNPJ: 12.ABC.345/01DE-35\nTOTAL R$ 12,00\n19/10/2026')).toMatchObject({
      cnpj: '12ABC34501DE35',
      name: 'Mercado Novo Ltda',
    });
  });

  it('only accepts letters in a CNPJ on a labelled line', () => {
    expect(read('PADARIA\n12ABC34501DE35\nTOTAL 1,00').cnpj).toBeNull();
  });
});

describe('receipt name, date and payment', () => {
  it('skips greeting taglines when looking for the store name', () => {
    const text = 'BEM VINDO VOLTE SEMPRE\nDROGARIA SAO PAULO S.A.\nCNPJ 11.222.333/0001-81\nTOTAL R$ 12,00\n19/10/2026';
    expect(read(text).name).toBe('Drogaria Sao Paulo S.a.');
  });

  it('prefers the purchase date over lot and expiry dates', () => {
    const text = 'MERCADO X\nCNPJ 11.222.333/0001-81\nLOTE 10/09/2026 VAL\nTOTAL 12,00\nCUPOM 19/10/2026 10:00';
    expect(read(text)).toMatchObject({ day: '2026-10-19', time: '10:00' });
    expect(read('VAL 10/09/2026\nCOMPRA 11/09/2026').day).toBe('2026-09-11');
    expect(read('VALIDADE 10/09/2026').day).toBe('2026-09-10');
  });

  it('takes the payment method nearest after the total, not a banner above it', () => {
    const text = 'LOJA X\nCNPJ 11.222.333/0001-81\nPARCELAMOS NO CREDITO EM ATE 10X\nTOTAL 12,00\nPIX 12,00\n19/10/2026';
    expect(read(text).pay).toBe('PIX');
    expect(read('PIX\nDEBITO\nTOTAL 5,00').pay).toBe('DEBIT');
    expect(read('TOTAL 5,00\nPAGO NO DEBITO SEM CREDITO').pay).toBe('DEBIT');
  });
});
