export type FinanceDataProvenance = 'live' | 'mock' | 'unavailable';
export type FinanceAssetId = string;
export type FinanceAssetType = 'Stock' | 'ETF' | 'Index' | 'Crypto' | 'Bond';
export type FinanceMarketStatus = 'Pre-Market' | 'Market Open' | 'After Hours' | 'Market Closed' | 'Holiday' | 'Early Close' | 'Simulated';

export type FinanceAsset = {
  id: FinanceAssetId;
  symbol: string;
  name: string;
  assetType: FinanceAssetType;
  currentValue: number;
  displayValue: string;
  dailyChange: number;
  dailyChangePercent: number;
  marketStatus: FinanceMarketStatus;
  lastUpdated: string;
  dataProvider: string;
  provenance: Exclude<FinanceDataProvenance, 'unavailable'>;
  marketCap: string;
  range: string;
  description: string;
  colors: [string, string];
};

export type FinanceMarketIndex = {
  id: FinanceAssetId;
  symbol: string;
  name: string;
  currentValue: number;
  displayValue: string;
  dailyChange: number;
  dailyChangeDisplay: string;
  dailyChangePercent: number;
  marketStatus: FinanceMarketStatus;
  lastUpdated: string;
  dataProvider: string;
  provenance: Exclude<FinanceDataProvenance, 'unavailable'>;
  trend: number[];
};

export type FinanceSnapshot = {
  assets: FinanceAsset[];
  indexes: FinanceMarketIndex[];
  updatedAt: string;
};

export type FinanceIntelligenceSummary = {
  market?: string;
  movers?: string[];
};

export type FinanceDataResult =
  | { data: FinanceSnapshot; error: null; provenance: 'live' | 'mock' }
  | { data: null; error: string; provenance: 'unavailable' };

export interface FinanceDataProvider {
  readonly name: string;
  readonly provenance: 'live' | 'mock';
  getMarketData(): Promise<FinanceSnapshot>;
}

const MOCK_UPDATED_AT = '2026-01-01T00:00:00.000Z';
const MOCK_PROVIDER = 'LookUP local fixtures';

type MockAssetInput = Omit<FinanceAsset, 'dataProvider' | 'lastUpdated' | 'marketStatus' | 'provenance'>;

const mockAsset = (asset: MockAssetInput): FinanceAsset => ({
  ...asset,
  dataProvider: MOCK_PROVIDER,
  lastUpdated: MOCK_UPDATED_AT,
  marketStatus: 'Simulated',
  provenance: 'mock',
});

export const MOCK_FINANCE_ASSETS: FinanceAsset[] = [
  mockAsset({ id: 'aapl', name: 'Apple', symbol: 'AAPL', assetType: 'Stock', currentValue: 228.34, displayValue: '$228.34', dailyChange: 2.80, dailyChangePercent: 1.24, marketCap: '$3.42T', range: '$164.08 – $237.49', description: 'Apple designs consumer devices, software, and digital services worldwide.', colors: ['#3F4752', '#AAB3BD'] }),
  mockAsset({ id: 'msft', name: 'Microsoft', symbol: 'MSFT', assetType: 'Stock', currentValue: 421.77, displayValue: '$421.77', dailyChange: 3.60, dailyChangePercent: 0.86, marketCap: '$3.13T', range: '$344.77 – $468.35', description: 'Microsoft develops cloud, productivity, gaming, and AI products.', colors: ['#185A82', '#58A6C9'] }),
  mockAsset({ id: 'tsla', name: 'Tesla', symbol: 'TSLA', assetType: 'Stock', currentValue: 248.91, displayValue: '$248.91', dailyChange: -4.36, dailyChangePercent: -1.72, marketCap: '$794.2B', range: '$138.80 – $299.29', description: 'Tesla builds electric vehicles, energy storage, and charging products.', colors: ['#762C34', '#D55C65'] }),
  mockAsset({ id: 'nvda', name: 'Nvidia', symbol: 'NVDA', assetType: 'Stock', currentValue: 138.62, displayValue: '$138.62', dailyChange: 3.35, dailyChangePercent: 2.48, marketCap: '$3.39T', range: '$45.01 – $152.89', description: 'Nvidia creates accelerated computing platforms and graphics processors.', colors: ['#315C2B', '#76B852'] }),
  mockAsset({ id: 'amzn', name: 'Amazon', symbol: 'AMZN', assetType: 'Stock', currentValue: 207.09, displayValue: '$207.09', dailyChange: -0.79, dailyChangePercent: -0.38, marketCap: '$2.18T', range: '$142.81 – $215.90', description: 'Amazon operates commerce, cloud computing, media, and logistics services.', colors: ['#374A65', '#E39B43'] }),
  mockAsset({ id: 'spy', name: 'SPDR S&P 500 ETF', symbol: 'SPY', assetType: 'ETF', currentValue: 598.73, displayValue: '$598.73', dailyChange: 2.63, dailyChangePercent: 0.44, marketCap: '$550.8B', range: '$455.16 – $599.64', description: 'A mock exchange-traded fund designed to track the S&P 500 index.', colors: ['#32506A', '#6D9AC0'] }),
  mockAsset({ id: 'btc', name: 'Bitcoin', symbol: 'BTC', assetType: 'Crypto', currentValue: 98420, displayValue: '$98,420', dailyChange: 2062.85, dailyChangePercent: 2.14, marketCap: '$1.95T', range: '$38,505 – $108,268', description: 'Bitcoin is a decentralized digital asset represented here with simulated data.', colors: ['#80521F', '#F0A33A'] }),
  mockAsset({ id: 'eth', name: 'Ethereum', symbol: 'ETH', assetType: 'Crypto', currentValue: 3842, displayValue: '$3,842', dailyChange: 49.92, dailyChangePercent: 1.32, marketCap: '$462.5B', range: '$2,111 – $4,092', description: 'Ethereum is a programmable blockchain asset represented with mock values.', colors: ['#3D4673', '#8B93D3'] }),
  mockAsset({ id: 'sol', name: 'Solana', symbol: 'SOL', assetType: 'Crypto', currentValue: 217.18, displayValue: '$217.18', dailyChange: -1.99, dailyChangePercent: -0.91, marketCap: '$105.6B', range: '$79.22 – $264.38', description: 'Solana is a blockchain network asset shown here using simulated prices.', colors: ['#4B286B', '#57D0A4'] }),
  mockAsset({ id: 'xrp', name: 'XRP', symbol: 'XRP', assetType: 'Crypto', currentValue: 2.41, displayValue: '$2.41', dailyChange: 0.02, dailyChangePercent: 0.67, marketCap: '$138.9B', range: '$0.39 – $2.87', description: 'XRP is a digital asset displayed with entirely local sample information.', colors: ['#314658', '#7DA0B8'] }),
  mockAsset({ id: 'spx', name: 'S&P 500 Index', symbol: 'SPX', assetType: 'Index', currentValue: 5998.74, displayValue: '5,998.74', dailyChange: 26.12, dailyChangePercent: 0.44, marketCap: 'Not applicable', range: 'Simulated range unavailable', description: 'A local sample of an equity market index.', colors: ['#234B58', '#64A7A2'] }),
  mockAsset({ id: 'us10y', name: 'U.S. 10-Year Treasury', symbol: 'US10Y', assetType: 'Bond', currentValue: 4.31, displayValue: '4.31%', dailyChange: 0.03, dailyChangePercent: 0.70, marketCap: 'Not applicable', range: 'Simulated range unavailable', description: 'A local sample fixed-income yield for architecture and search testing.', colors: ['#45506A', '#8C9CC2'] }),
];

export const MOCK_FINANCE_INDEXES: FinanceMarketIndex[] = [
  { id: 'spx-index', symbol: 'SPX', name: 'S&P 500', currentValue: 5998.74, displayValue: '5,998.74', dailyChange: 26.12, dailyChangeDisplay: '+26.12', dailyChangePercent: 0.44, trend: [4, 6, 5, 7, 8, 7, 10, 12], marketStatus: 'Simulated', lastUpdated: MOCK_UPDATED_AT, dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'dji-index', symbol: 'DJI', name: 'Dow Jones', currentValue: 43612.08, displayValue: '43,612.08', dailyChange: -84.21, dailyChangeDisplay: '-84.21', dailyChangePercent: -0.19, trend: [11, 10, 12, 9, 8, 7, 8, 6], marketStatus: 'Simulated', lastUpdated: MOCK_UPDATED_AT, dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'ixic-index', symbol: 'IXIC', name: 'Nasdaq', currentValue: 19215.44, displayValue: '19,215.44', dailyChange: 122.18, dailyChangeDisplay: '+122.18', dailyChangePercent: 0.64, trend: [5, 6, 8, 7, 10, 9, 12, 14], marketStatus: 'Simulated', lastUpdated: MOCK_UPDATED_AT, dataProvider: MOCK_PROVIDER, provenance: 'mock' },
  { id: 'rut-index', symbol: 'RUT', name: 'Russell 2000', currentValue: 2327.05, displayValue: '2,327.05', dailyChange: -7.31, dailyChangeDisplay: '-7.31', dailyChangePercent: -0.31, trend: [12, 11, 9, 10, 8, 9, 7, 6], marketStatus: 'Simulated', lastUpdated: MOCK_UPDATED_AT, dataProvider: MOCK_PROVIDER, provenance: 'mock' },
];

export const mockFinanceProvider: FinanceDataProvider = {
  name: MOCK_PROVIDER,
  provenance: 'mock',
  async getMarketData() {
    return { assets: MOCK_FINANCE_ASSETS, indexes: MOCK_FINANCE_INDEXES, updatedAt: MOCK_UPDATED_AT };
  },
};

export async function getMarketData(provider: FinanceDataProvider = mockFinanceProvider): Promise<FinanceDataResult> {
  try {
    const data = await provider.getMarketData();
    return { data, error: null, provenance: provider.provenance };
  } catch {
    return { data: null, error: 'Market information is currently unavailable.', provenance: 'unavailable' };
  }
}

export function searchFinanceAssets(assets: FinanceAsset[], query: string): FinanceAsset[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return assets.filter((asset) => `${asset.name} ${asset.symbol} ${asset.assetType}`.toLowerCase().includes(normalized));
}

export function getFinanceSummary(
  result: FinanceDataResult,
  options: { allowMock?: boolean } = {},
): FinanceIntelligenceSummary | undefined {
  if (result.provenance === 'unavailable') return undefined;
  if (result.provenance === 'mock' && !options.allowMock) return undefined;

  const leadingIndex = result.data.indexes[0];
  return {
    market: leadingIndex ? `${leadingIndex.name} ${leadingIndex.dailyChangePercent >= 0 ? '+' : ''}${leadingIndex.dailyChangePercent.toFixed(2)}%` : undefined,
    movers: [...result.data.assets]
      .sort((a, b) => Math.abs(b.dailyChangePercent) - Math.abs(a.dailyChangePercent))
      .slice(0, 3)
      .map((asset) => `${asset.symbol} ${asset.dailyChangePercent >= 0 ? '+' : ''}${asset.dailyChangePercent.toFixed(2)}%`),
  };
}

export const getFinance = getMarketData;
