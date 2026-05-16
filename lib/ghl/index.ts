export {
  getGhlClientConfig,
  getGhlLocationId,
  isGhlConfigured,
  makeGhlRequest,
  GhlApiError,
} from './client';
export {
  createGhlContact,
  updateGhlContact,
  upsertGhlContact,
  upsertGhlContactApi,
  upsertGhlContactByPhone,
  findDuplicateContactByEmail,
  getGhlContact,
} from './contacts';
export { syncUserToGhlById } from './sync-user';
export { buildGhlContactCustomFields, splitFullName } from './contact-fields';
export { handleKeywordRankChange, RANK_CHANGE_THRESHOLD } from './rank-change-detector';
export {
  handleCompetitorRankImprovement,
  COMPETITOR_CRITICAL_THRESHOLD,
} from './competitor-change-detector';
export type { UserGhlSyncRow } from './contact-fields';
export {
  sendGhlSmsMessage,
  sendSmsForUserEvent,
  renderSmsMessage,
  isLikelyE164,
  normalizePhoneE164,
  isCriticalSmsEvent,
  maskPhoneForLog,
} from './sms';
export type { GhlSmsEventType, GhlSmsTemplateVars, SendGhlSmsResult } from './sms';
export { sendGhlEmailMessage, getGhlEmailById } from './email';
export type { SendGhlEmailResult } from './email';
export {
  triggerGhlWorkflow,
  postGhlWorkflowPayload,
  emitAuditCompletedWorkflow,
  emitSignupWorkflow,
  emitRankChangeWorkflow,
  emitSubscriptionUpdatedWorkflow,
  emitCompetitorMovementWorkflow,
} from './workflow-triggers';
export type { GhlWorkflowEventName, SubscriptionChangeType } from './workflow-triggers';
export { subscriptionWorkflowUrlFor, rankWorkflowUrlFor } from './workflow-triggers';
export type { RankDirection } from './workflow-triggers';
export { notifySubscriptionChange } from './subscription-notify';
export { planFeaturesSummary, planDisplayName, isPaidPlan, dashboardUrl } from './plan-features';
export { notifyRankDrop, notifyRankGain, notifyCompetitorAlert } from './event-triggers';
export { forwardLeadToGhl } from './webhook';
export type { GhlLeadPayload, GhlLeadSource } from './webhook';
