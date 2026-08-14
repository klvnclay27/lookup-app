export type FinanceSponsoredPlacement = {
  placementId: string;
  status: 'placeholder' | 'scheduled' | 'active' | 'expired';
  sponsoredLabel: 'Sponsored' | 'Advertisement';
  advertiserName?: string;
  headline: string;
  shortDescription: string;
  logoImageUri?: string;
  destinationUrl?: string;
  campaignStartsAt?: string;
  campaignEndsAt?: string;
};

export const FINANCE_EDUCATION_SPONSORSHIP_PLACEHOLDER: FinanceSponsoredPlacement = {
  placementId: 'finance-education-partner-slot',
  status: 'placeholder',
  sponsoredLabel: 'Sponsored',
  headline: 'Partner placement available',
  shortDescription: 'Financial services, retirement, investing, banking, tax, or educational partners may appear here.',
};
