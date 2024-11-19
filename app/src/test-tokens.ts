export type ListingType = {
  priceLevels: {
    ticker: string;
    greaterThan: string;
  }[];
  currentTicker: string;
  address: string;
  price: string;
  createdAt: string;
  tickerHistory: number[];
  marketCap: string;
  description: string;
};

function generateRandomTickerHistory() {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 100));
}

const fakeDescription = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

export const listings: ListingType[] = [
  {
    priceLevels: [
      {
        ticker: "8=D",
        greaterThan: "0",
      },
      {
        ticker: "8==D",
        greaterThan: "1000",
      },
      {
        ticker: "8===D",
        greaterThan: "2000",
      },
      {
        ticker: "8====D",
        greaterThan: "3000",
      },
      {
        ticker: "8=====D",
        greaterThan: "4000",
      },
      {
        ticker: "8======D",
        greaterThan: "5000",
      },
      {
        ticker: "8========D",
        greaterThan: "6000",
      },
      {
        ticker: "8=========D~~",
        greaterThan: "7000",
      },
      {
        ticker: "8==============D~~~~~~~",
        greaterThan: "8000",
      },
    ],
    currentTicker: "8==============D~~~~~~~",
    address: "0x0000000000000000000000000000000000000000",
    price: "1000",
    createdAt: "2021-01-01",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "420690000",
    description: fakeDescription,
  },

  {
    priceLevels: [
      { ticker: "VITALEK", greaterThan: "0" },
      { ticker: "VITALEKK", greaterThan: "1000" },
      { ticker: "VITALEKKK", greaterThan: "2000" },
      { ticker: "VITALEKKKK", greaterThan: "3000" },
    ],
    currentTicker: "VITALEK",
    address: "0x0000000000000000000000000000000000000000",
    price: "1000",
    createdAt: "2021-01-01",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "1337000000",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "PEPE", greaterThan: "0" },
      { ticker: "SADPEPE", greaterThan: "0.0001" },
      { ticker: "SADDERPEPE", greaterThan: "0.001" },
      { ticker: "SADDESTPEPE", greaterThan: "0.01" },
    ],
    currentTicker: "PEPE",
    address: "0x1234567890123456789012345678901234567890",
    price: "0.00001",
    createdAt: "2023-05-15",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "987654321",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "DOGE", greaterThan: "0" },
      { ticker: "SILLYDOGE", greaterThan: "0.1" },
      { ticker: "SILLIESTDOGE", greaterThan: "1.0" },
    ],
    currentTicker: "DOGE",
    address: "0x2345678901234567890123456789012345678901",
    price: "0.07",
    createdAt: "2023-04-20",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "8765432100",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "SHIB", greaterThan: "0" },
      { ticker: "SHIBK", greaterThan: "0.0001" },
      { ticker: "SHIBKK", greaterThan: "0.001" },
      { ticker: "SHIBKKK", greaterThan: "0.01" },
    ],
    currentTicker: "SHIB",
    address: "0x3456789012345678901234567890123456789012",
    price: "0.00001",
    createdAt: "2023-03-15",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "654321000",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "APE", greaterThan: "0" },
      { ticker: "APEK", greaterThan: "2.5" },
      { ticker: "APEKK", greaterThan: "5" },
      { ticker: "APEKKK", greaterThan: "10" },
    ],
    currentTicker: "APE",
    address: "0x4567890123456789012345678901234567890123",
    price: "2.50",
    createdAt: "2023-06-01",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "123456789",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "BONK", greaterThan: "0" },
      { ticker: "BONKK", greaterThan: "0.0001" },
      { ticker: "BONKKK", greaterThan: "0.001" },
      { ticker: "BONKKKK", greaterThan: "0.01" },
    ],
    currentTicker: "BONK",
    address: "0x5678901234567890123456789012345678901234",
    price: "0.00002",
    createdAt: "2023-05-30",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "42069420",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "WOJAK", greaterThan: "0" },
      { ticker: "WOJAKK", greaterThan: "1000" },
      { ticker: "WOJAKKK", greaterThan: "2000" },
      { ticker: "WOJAKKKK", greaterThan: "3000" },
    ],
    currentTicker: "WOJAK",
    address: "0x6789012345678901234567890123456789012345",
    price: "0.05",
    createdAt: "2023-05-28",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "31415926",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "MOON", greaterThan: "0" },
      { ticker: "MOONK", greaterThan: "1.2" },
      { ticker: "MOONKK", greaterThan: "2.4" },
      { ticker: "MOONKKK", greaterThan: "3.6" },
    ],
    currentTicker: "MOON",
    address: "0x7890123456789012345678901234567890123456",
    price: "1.20",
    createdAt: "2023-05-25",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "27182818",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "ROCKET", greaterThan: "0" },
      { ticker: "ROCKETK", greaterThan: "0.75" },
      { ticker: "ROCKETKK", greaterThan: "1.5" },
      { ticker: "ROCKETKKK", greaterThan: "2.25" },
    ],
    currentTicker: "ROCKET",
    address: "0x8901234567890123456789012345678901234567",
    price: "0.75",
    createdAt: "2023-05-20",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "16180339",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "DIAMOND", greaterThan: "0" },
      { ticker: "DIAMONDK", greaterThan: "10" },
      { ticker: "DIAMONDKK", greaterThan: "20" },
      { ticker: "DIAMONDKKK", greaterThan: "30" },
    ],
    currentTicker: "DIAMOND",
    address: "0x9012345678901234567890123456789012345678",
    price: "10.00",
    createdAt: "2023-05-10",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "14142135",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "HANDS", greaterThan: "0" },
      { ticker: "HANDSK", greaterThan: "0.5" },
      { ticker: "HANDSKK", greaterThan: "1" },
      { ticker: "HANDSKKK", greaterThan: "1.5" },
    ],
    currentTicker: "HANDS",
    address: "0xa123456789012345678901234567890123456789",
    price: "0.50",
    createdAt: "2023-05-05",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "11235813",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "HODL", greaterThan: "0" },
      { ticker: "HODLK", greaterThan: "5" },
      { ticker: "HODLKK", greaterThan: "10" },
      { ticker: "HODLKKK", greaterThan: "15" },
    ],
    currentTicker: "HODL",
    address: "0xb234567890123456789012345678901234567890",
    price: "5.00",
    createdAt: "2023-04-30",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "10101010",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "FOMO", greaterThan: "0" },
      { ticker: "FOMOK", greaterThan: "2" },
      { ticker: "FOMOKK", greaterThan: "4" },
      { ticker: "FOMOKKK", greaterThan: "6" },
    ],
    currentTicker: "FOMO",
    address: "0xc345678901234567890123456789012345678901",
    price: "2.00",
    createdAt: "2023-04-25",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "9876543",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "WAGMI", greaterThan: "0" },
      { ticker: "WAGMIK", greaterThan: "3.33" },
      { ticker: "WAGMIKK", greaterThan: "6.66" },
      { ticker: "WAGMIKKK", greaterThan: "10" },
    ],
    currentTicker: "WAGMI",
    address: "0xd456789012345678901234567890123456789012",
    price: "3.33",
    createdAt: "2023-04-15",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "7654321",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "NGMI", greaterThan: "0" },
      { ticker: "NGMIK", greaterThan: "0.01" },
      { ticker: "NGMIKK", greaterThan: "0.02" },
      { ticker: "NGMIKKK", greaterThan: "0.03" },
    ],
    currentTicker: "NGMI",
    address: "0xe567890123456789012345678901234567890123",
    price: "0.01",
    createdAt: "2023-04-10",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "1234567",
    description: fakeDescription,
  },
  {
    priceLevels: [
      { ticker: "GG", greaterThan: "0" },
      { ticker: "GGK", greaterThan: "1.5" },
      { ticker: "GGKK", greaterThan: "3" },
      { ticker: "GGKKK", greaterThan: "4.5" },
    ],
    currentTicker: "GG",
    address: "0xf678901234567890123456789012345678901234",
    price: "1.50",
    createdAt: "2023-04-05",
    tickerHistory: generateRandomTickerHistory(),
    marketCap: "2718281",
    description: fakeDescription,
  },
];
