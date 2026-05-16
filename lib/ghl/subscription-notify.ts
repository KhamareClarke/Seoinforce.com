import { sendSmsForUserEvent } from './sms';
import {
  emitSubscriptionUpdatedWorkflow,
  type SubscriptionChangeType,
} from './workflow-triggers';
import { dashboardUrl, planDisplayName, planFeaturesSummary } from './plan-features';
import { syncUserToGhlById } from './sync-user';
import { touchUserLastActive } from '@/lib/user-activity';

export async function notifySubscriptionChange(args: {
  userId: string;
  email: string;
  fullName?: string | null;
  changeType: SubscriptionChangeType;
  previousPlan: string;
  newPlan: string;
  nextBillingDate?: string;
}): Promise<void> {
  const link = dashboardUrl();
  const features = planFeaturesSummary(args.newPlan);
  const planName = planDisplayName(args.newPlan);

  emitSubscriptionUpdatedWorkflow({
    userId: args.userId,
    email: args.email,
    fullName: args.fullName,
    changeType: args.changeType,
    previousPlan: args.previousPlan,
    newPlan: args.newPlan,
    features,
    nextBillingDate: args.nextBillingDate,
    dashboardUrl: link,
  });

  try {
    await touchUserLastActive(args.userId);
    void syncUserToGhlById(args.userId);
  } catch (e) {
    console.warn('subscription notify activity/sync:', e);
  }

  try {
    if (args.changeType === 'upgraded') {
      await sendSmsForUserEvent({
        userId: args.userId,
        event: 'subscription_upgraded',
        vars: { link, features, planName },
      });
    } else if (args.changeType === 'downgraded' || args.changeType === 'canceled') {
      await sendSmsForUserEvent({
        userId: args.userId,
        event: 'subscription_downgraded',
        vars: { link },
      });
    } else if (args.changeType === 'renewed') {
      await sendSmsForUserEvent({
        userId: args.userId,
        event: 'subscription_renewal',
        vars: { nextBillingDate: args.nextBillingDate ?? '—', link },
      });
    }
  } catch (e) {
    console.warn('subscription notify SMS:', e);
  }
}
