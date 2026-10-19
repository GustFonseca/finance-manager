import {
  accessKeyCheckDigit,
  amountsOf,
  formatCnpj,
  isValidCnpj,
  mergeReceipt,
  normalizeLine,
  parseNfceQr,
  parseReceiptText,
  ReceiptText,
  titleCase,
} from '../parse';

const NOW = new Date(2026, 9, 19, 15, 0);
const KEY = '43261011222333000181650010000123451000012343';
const SPACED_KEY = KEY.replace(/(\d{4})/g, '$1 ').trim();

const SUPERMARKET = `
SUPERMERCADO BOM PREÇO LTDA
CNPJ: 11.222.333/0001-81 IE: 096/1234567
RUA DAS FLORES, 123 - CENTRO - PORTO ALEGRE/RS
DOCUMENTO AUXILIAR DA NOTA FISCAL DE CONSUMIDOR ELETRÔNICA
CÓDIGO DESCRIÇÃO QTD UN VL UNIT VL TOTAL
001 ARROZ TIPO 1 5KG 1 UN 24,90 24,90
002 FEIJAO PRETO 1KG 2 UN 8,50 17,00
003 LEITE INTEGRAL 1L 6 UN 4,79 28,74
QTD. TOTAL DE ITENS 3
VALOR TOTAL R$ 70,64
DESCONTO R$ 0,00
VALOR A PAGAR R$ 70,64
FORMA DE PAGAMENTO VALOR PAGO R$
CARTÃO DE DÉBITO 70,64
Valor aprox. dos tributos R$ 12,30 (17,41%) Fonte: IBPT
NFC-e nº 12345 Série 1 Emissão: 18/10/2026 10:35:12
Consulte pela Chave de Acesso em www.sefaz.rs.gov.br/nfce/consulta
${SPACED_KEY}
CONSUMIDOR NÃO IDENTIFICADO
`;

const RESTAURANT = `
Cantina da Nonna
Restaurante e Pizzaria
CNPJ 47508011000140
Av. Paulista, 1000 - São Paulo/SP
Data: 05/10/26 Hora: 21:47
Mesa 12 - Garçom João
2 PIZZA MARGUERITA 89,80
3 REFRIGERANTE LATA 19,50
SUBTOTAL 109,30
SERVIÇO 10% 10,93
TOTAL 120,23
Pagamento: PIX
`;

const PHARMACY = `
DROGARIA SAÚDE & VIDA
61.079.204/0001-54
Tel: (51) 3333-4444
DIPIRONA 500MG 20CP 12,99
PROTETOR SOLAR FPS50 59,90
VAL 10/2027
TOTAL A PAGAR 72,89
DINHEIRO 100,00
TROCO 27,11
EMISSAO 01.09.2026 08:05
`;

const GAS_STATION = `
AUTO POSTO ESTRELA
CNPJ: 33.200.156/0001-75
GASOLINA COMUM 40,000 L X 6,190 247,60
TOTAL R$ 247,60
CREDITO
19-10-2026 07:12:44
`;

const NOISY = `
  ~~ MERCADINHO SÃO JOÃO ~~
CNP J  07 626 242 0001 34
CNPJ: 07.626 .242/0001-34
12/1O/2026 18:4O
ARROZ 1 X 1O,5O
TOTALR$ 31, 50
TOTAL
`;

describe('accessKeyCheckDigit', () => {
  it('computes the mod 11 digit with weights 2..9 from the right', () => {
    expect(accessKeyCheckDigit(KEY.slice(0, 43))).toBe(3);
    expect(accessKeyCheckDigit('0'.repeat(43))).toBe(0);
    expect(accessKeyCheckDigit('0'.repeat(42) + '5')).toBe(1);
  });
});

describe('parseNfceQr', () => {
  it('reads the key from a SEFAZ QR Code url', () => {
    expect(parseNfceQr(`https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=${KEY}|2|1|1|ABCDEF0123`)).toEqual({
      accessKey: KEY,
      cnpj: '11222333000181',
      year: 2026,
      month: 10,
    });
  });

  it('reads a raw or spaced key', () => {
    expect(parseNfceQr(KEY)?.accessKey).toBe(KEY);
    expect(parseNfceQr(SPACED_KEY)?.cnpj).toBe('11222333000181');
    expect(parseNfceQr(`chNFe=${KEY}&nVersao=100`)?.month).toBe(10);
  });

  it('rejects invalid check digits, impossible months and text without a key', () => {
    expect(parseNfceQr(KEY.slice(0, 43) + '4')).toBeNull();
    expect(parseNfceQr(KEY.slice(0, 43))).toBeNull();
    expect(parseNfceQr(`${KEY}1`)).toBeNull();
    const badMonth = '432613' + KEY.slice(6, 43);
    expect(parseNfceQr(badMonth + accessKeyCheckDigit(badMonth))).toBeNull();
    const zeroMonth = '432600' + KEY.slice(6, 43);
    expect(parseNfceQr(zeroMonth + accessKeyCheckDigit(zeroMonth))).toBeNull();
    expect(parseNfceQr('https://example.com/?p=123')).toBeNull();
    expect(parseNfceQr('')).toBeNull();
  });
});

describe('CNPJ helpers', () => {
  it('validates check digits', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11222333000182')).toBe(false);
    expect(isValidCnpj('11222333000191')).toBe(false);
    expect(isValidCnpj('11111111111111')).toBe(false);
    expect(isValidCnpj('1122233300018')).toBe(false);
  });

  it('formats', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('normalization helpers', () => {
  it('strips accents, collapses spaces and fixes digits', () => {
    expect(normalizeLine('  Emissão:   12/1O/2026  ')).toBe('EMISSAO: 12/10/2026');
    expect(normalizeLine('T0TAL R $ 1O,5O')).toBe('TOTAL R$ 10,50');
    expect(normalizeLine('O,99 e BOLO1')).toBe('0,99 E BOLO1');
    expect(normalizeLine('TOTAL 12 , 50')).toBe('TOTAL 12,50');
  });

  it('reads Brazilian and international amounts', () => {
    expect(amountsOf('1.234,56 1234,56 1234.56 1,234.56 R$0,99')).toEqual([123456, 123456, 123456, 123456, 99]);
  });

  it('ignores dates, CNPJs, quantities and percentages', () => {
    expect(amountsOf('19.10.2026 11.222.333/0001-81 1,000 KG 10% 12,345')).toEqual([]);
  });

  it('title-cases names keeping connectors and company suffixes', () => {
    expect(titleCase('SUPERMERCADO SÃO JOÃO DOS PEIXES LTDA')).toBe('Supermercado São João dos Peixes Ltda');
    expect(titleCase('~~ de PAULA comercio s/a ~~')).toBe('De Paula Comercio S/A');
    expect(titleCase('ACME ME')).toBe('Acme ME');
  });
});

describe('parseReceiptText', () => {
  it('reads a supermarket NFC-e', () => {
    expect(parseReceiptText(SUPERMARKET, NOW)).toEqual({
      totalCents: 7064,
      day: '2026-10-18',
      time: '10:35',
      cnpj: '11222333000181',
      merchantName: 'Supermercado Bom Preço Ltda',
      payment: 'DEBIT',
      found: { total: true, date: true, cnpj: true, name: true, payment: true },
      confidence: 1,
    });
  });

  it('reads a restaurant bill', () => {
    const receipt = parseReceiptText(RESTAURANT, NOW);
    expect(receipt).toMatchObject({
      totalCents: 12023,
      day: '2026-10-05',
      time: '21:47',
      cnpj: '47508011000140',
      merchantName: 'Cantina da Nonna',
      payment: 'PIX',
    });
  });

  it('reads a pharmacy receipt with a formatted CNPJ without label', () => {
    expect(parseReceiptText(PHARMACY, NOW)).toMatchObject({
      totalCents: 7289,
      day: '2026-09-01',
      time: '08:05',
      cnpj: '61079204000154',
      merchantName: 'Drogaria Saúde & Vida',
      payment: 'CASH',
    });
  });

  it('reads a gas station receipt', () => {
    expect(parseReceiptText(GAS_STATION, NOW)).toMatchObject({
      totalCents: 24760,
      day: '2026-10-19',
      time: '07:12',
      cnpj: '33200156000175',
      merchantName: 'Auto Posto Estrela',
      payment: 'CREDIT',
    });
  });

  it('reads noisy OCR with broken lines and spaced CNPJ', () => {
    expect(parseReceiptText(NOISY, NOW)).toMatchObject({
      totalCents: 3150,
      day: '2026-10-12',
      time: '18:40',
      cnpj: '07626242000134',
      merchantName: 'Mercadinho São João',
      payment: null,
    });
  });

  it('takes the amount from the line below the label', () => {
    const receipt = parseReceiptText('LOJA EXEMPLO\nVALOR A PAGAR R$\n  R$ 15,90\n', NOW);
    expect(receipt.totalCents).toBe(1590);
  });

  it('does not take the amount from a labelled line below', () => {
    expect(parseReceiptText('VALOR TOTAL R$\nDESCONTO R$ 2,00\n', NOW).totalCents).toBeNull();
    expect(parseReceiptText('TOTAL', NOW).totalCents).toBeNull();
    expect(parseReceiptText('VALOR TOTAL R$\n12\n', NOW).totalCents).toBeNull();
  });

  it('prefers the higher priority label', () => {
    const text = 'TOTAL 99,00\nVALOR TOTAL R$ 50,00\nVALOR A PAGAR R$ 45,00\n';
    expect(parseReceiptText(text, NOW).totalCents).toBe(4500);
    expect(parseReceiptText('TOTAL 99,00\nVALOR TOTAL 50,00', NOW).totalCents).toBe(5000);
  });

  it('falls back to the largest amount on a TOTAL line', () => {
    expect(parseReceiptText('SUBTOTAL 12,00 3,00\nITEM 99,00', NOW).totalCents).toBe(1200);
  });

  it('does not guess the total from random numbers', () => {
    const receipt = parseReceiptText('PAO FRANCES 4,50\nCAFE 12,90\nTOTAL DE ITENS 2 9,99\nVALOR DOS TRIBUTOS TOTAL 1,23', NOW);
    expect(receipt.totalCents).toBeNull();
    expect(parseReceiptText('TOTAL 0,00', NOW).totalCents).toBeNull();
  });

  it('ignores impossible, too old and future dates', () => {
    expect(parseReceiptText('31/02/2026\n20/10/2026\n01/01/1999', NOW).day).toBeNull();
    expect(parseReceiptText('01/09/2026\nDATA EMISSAO\n15/10/2026', NOW).day).toBe('2026-10-15');
  });

  it('reads the first valid time when the date line has none', () => {
    const receipt = parseReceiptText('EMISSAO 10/10/2026\nHORA 25:00\nHORA 09:30:00', NOW);
    expect(receipt.time).toBe('09:30');
    expect(parseReceiptText('LOJA', NOW).time).toBeNull();
  });

  it('rejects invalid CNPJs and access key lines', () => {
    const receipt = parseReceiptText(`LOJA TESTE\nCNPJ 11.222.333/0001-82\n${KEY}\n`, NOW);
    expect(receipt.cnpj).toBeNull();
    expect(receipt.merchantName).toBe('Loja Teste');
  });

  it('looks for a name only in the first lines when there is no CNPJ', () => {
    expect(parseReceiptText('123 456\nRUA A 10\nCEP 90000-000\nPADARIA PAO QUENTE', NOW).merchantName).toBeNull();
  });

  it('finds no name above a CNPJ on the first line', () => {
    expect(parseReceiptText('CNPJ 11.222.333/0001-81\nLOJA', NOW).merchantName).toBeNull();
  });

  it('skips lines that are not names', () => {
    const receipt = parseReceiptText('NFC-E\nA1 B2 C3 D4\nTel 3333\nCOMERCIAL ABC\nCNPJ 11222333000181', NOW);
    expect(receipt.merchantName).toBe('Comercial Abc');
  });

  it('picks the first payment method mentioned', () => {
    expect(parseReceiptText('PIX\nCARTAO DE CREDITO', NOW).payment).toBe('PIX');
  });

  it('reports what was not found', () => {
    expect(parseReceiptText('', NOW)).toEqual({
      totalCents: null,
      day: null,
      time: null,
      cnpj: null,
      merchantName: null,
      payment: null,
      found: { total: false, date: false, cnpj: false, name: false, payment: false },
      confidence: 0,
    });
    expect(parseReceiptText('TOTAL 10,00\n10/10/2026', NOW).confidence).toBe(0.5);
  });

  it('uses the current date by default', () => {
    expect(parseReceiptText('01/01/2000').day).toBe('2000-01-01');
  });
});

describe('mergeReceipt', () => {
  const text: ReceiptText = parseReceiptText(SUPERMARKET, NOW);
  const qr = parseNfceQr(`https://x/?p=${'43261047508011000140650010000123451000012340'}|2`)!;

  it('prefers the QR CNPJ and the company name', () => {
    const merged = mergeReceipt(qr, text, { cnpj: qr.cnpj, name: 'CASAS DO SUL COMERCIO LTDA', activity: 'Supermercados' });
    expect(merged).toMatchObject({
      cnpj: '47508011000140',
      merchantName: 'Casas do Sul Comercio Ltda',
      totalCents: 7064,
      day: '2026-10-18',
      time: '10:35',
      payment: 'DEBIT',
      accessKey: qr.accessKey,
      activity: 'Supermercados',
      confidence: 1,
    });
  });

  it('falls back to OCR fields', () => {
    expect(mergeReceipt(null, text, { cnpj: text.cnpj!, name: null, activity: 'Mercado' })).toMatchObject({
      cnpj: '11222333000181',
      merchantName: 'Supermercado Bom Preço Ltda',
      accessKey: null,
      activity: 'Mercado',
    });
  });

  it('keeps the date empty when only the QR Code was read', () => {
    expect(mergeReceipt(qr, null, null)).toEqual({
      totalCents: null,
      day: null,
      time: null,
      cnpj: '47508011000140',
      merchantName: null,
      payment: null,
      accessKey: qr.accessKey,
      activity: null,
      found: { total: false, date: false, cnpj: true, name: false, payment: false },
      confidence: 0.25,
    });
  });

  it('returns an empty receipt when nothing was read', () => {
    expect(mergeReceipt(null, null, null)).toMatchObject({ cnpj: null, merchantName: null, confidence: 0 });
  });
});
