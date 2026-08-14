import type { FinanceEducationTopic } from '@/services/finance';

export type FinancialInstitutionType = 'Brokerage' | 'Investment management company' | 'Retirement services provider';

export type FinancialInstitution = {
  id: string;
  name: string;
  institutionType: FinancialInstitutionType;
  description: string;
  relevantProducts: string[];
  applicableTopicIds: FinanceEducationTopic['id'][];
  officialWebsite: string;
  accountInformation?: { minimum?: string; fees?: string; verifiedAt: string };
};

// Sponsored placements are intentionally separate from the neutral discovery catalog.
// No sponsored placements are used in this MVP.
export type SponsoredFinancialInstitutionPlacement = {
  institutionId: FinancialInstitution['id'];
  disclosure: string;
  campaignId: string;
};

const RETIREMENT_TOPICS = ['roth-ira', 'traditional-ira', 'roth-vs-traditional-ira'];
const INVESTING_TOPICS = ['stocks', 'etfs', 'index-funds', 'bonds'];

export const FINANCIAL_INSTITUTION_CATALOG: FinancialInstitution[] = [
  {
    id: 't-rowe-price',
    name: 'T. Rowe Price',
    institutionType: 'Retirement services provider',
    description: 'Provides retirement accounts, investment accounts, brokerage access, mutual funds, and ETFs.',
    relevantProducts: ['Roth IRA', 'Traditional IRA', 'Brokerage accounts', 'Stocks', 'ETFs', 'Mutual funds', 'Bond access'],
    applicableTopicIds: [...RETIREMENT_TOPICS, ...INVESTING_TOPICS],
    officialWebsite: 'https://www.troweprice.com/personal-investing/',
  },
  {
    id: 'fidelity',
    name: 'Fidelity',
    institutionType: 'Brokerage',
    description: 'Provides retirement accounts, brokerage services, funds, ETFs, stocks, and fixed-income access.',
    relevantProducts: ['Roth IRA', 'Traditional IRA', 'Brokerage accounts', 'Stocks', 'ETFs', 'Index funds', 'Bonds and CDs'],
    applicableTopicIds: [...RETIREMENT_TOPICS, ...INVESTING_TOPICS],
    officialWebsite: 'https://www.fidelity.com/',
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    institutionType: 'Investment management company',
    description: 'Provides retirement and brokerage accounts with access to mutual funds, ETFs, stocks, and bonds.',
    relevantProducts: ['Roth IRA', 'Traditional IRA', 'Brokerage accounts', 'Stocks', 'ETFs', 'Index funds', 'Bonds'],
    applicableTopicIds: [...RETIREMENT_TOPICS, ...INVESTING_TOPICS],
    officialWebsite: 'https://investor.vanguard.com/',
  },
  {
    id: 'charles-schwab',
    name: 'Charles Schwab',
    institutionType: 'Brokerage',
    description: 'Provides retirement accounts and brokerage access to stocks, bonds, ETFs, and mutual funds.',
    relevantProducts: ['Roth IRA', 'Traditional IRA', 'Brokerage accounts', 'Stocks', 'ETFs', 'Index funds', 'Bonds'],
    applicableTopicIds: [...RETIREMENT_TOPICS, ...INVESTING_TOPICS],
    officialWebsite: 'https://www.schwab.com/',
  },
];

export function getFinancialInstitutionsForTopic(topicId: FinanceEducationTopic['id']): FinancialInstitution[] {
  return FINANCIAL_INSTITUTION_CATALOG
    .filter((institution) => institution.applicableTopicIds.includes(topicId))
    .sort((left, right) => left.name.localeCompare(right.name));
}
