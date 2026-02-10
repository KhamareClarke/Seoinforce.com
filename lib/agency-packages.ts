// Agency package limits (audits per period, max clients) and monthly prices (pence).

export const AGENCY_PACKAGES = {
  starter: { auditsLimit: 10, clientsLimit: 3, name: 'Starter', pricePence: 4900 },   // £49/mo
  growth: { auditsLimit: 50, clientsLimit: 10, name: 'Growth', pricePence: 14900 },  // £149/mo
  empire: { auditsLimit: 200, clientsLimit: 50, name: 'Empire', pricePence: 39900 }, // £399/mo
} as const;

export type AgencyPackageTier = keyof typeof AGENCY_PACKAGES;

/** Subscription status that grants full tier limits */
const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const;

export type AgencySettingsBilling = {
  subscription_status?: string | null;
  admin_granted_free?: boolean | null;
};

/** Agency has paid or admin-granted access; otherwise features are limited until subscribed. */
export function isAgencySubscribed(settings: AgencySettingsBilling | null | undefined): boolean {
  if (!settings) return false;
  if (settings.admin_granted_free === true) return true;
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(
    (settings.subscription_status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number]) ?? ''
  );
}
