import { fetchNotificationPrefs } from "@/actions/account/notifications";
import { CustomerActivityTracker } from "@/components/tracking/customer-activity-tracker";

/**
 * Reads the session, so it is kept behind its own Suspense boundary instead of
 * making the whole storefront layout wait on (and render dynamically for) it.
 */
export async function CustomerActivityGate() {
  const prefs = await fetchNotificationPrefs();
  return (
    <CustomerActivityTracker
      behavioralAnalyticsConsent={prefs.behavioralAnalytics}
    />
  );
}
