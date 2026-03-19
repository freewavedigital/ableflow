import { useEffect, useState, useCallback } from "react";
import { getOfflineSubmissions, markOfflineSubmissionSynced } from "@/lib/offlineStorage";
import { base44 } from "@/api/base44Client";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineSubmissions, setOfflineSubmissions] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline submissions on mount
  useEffect(() => {
    loadOfflineSubmissions();
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && offlineSubmissions.length > 0) {
      syncOfflineSubmissions();
    }
  }, [isOnline]);

  const loadOfflineSubmissions = async () => {
    try {
      const submissions = await getOfflineSubmissions();
      setOfflineSubmissions(submissions);
    } catch (error) {
      console.error("Failed to load offline submissions:", error);
    }
  };

  const syncOfflineSubmissions = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    const submissions = await getOfflineSubmissions();
    let syncedCount = 0;

    for (const submission of submissions) {
      try {
        // Create the submission in the database
        await base44.entities.FormSubmission.create({
          template_id: submission.template_id,
          form_type: submission.form_type,
          related_object: submission.related_object,
          source: 'mobile',
          status: 'submitted',
          field_values: submission.field_values,
          submitted_by: submission.submitted_by,
          linked_lead_id: submission.linked_lead_id,
          linked_job_id: submission.linked_job_id,
          branch_id: submission.branch_id,
        });

        // Mark as synced
        await markOfflineSubmissionSynced(submission.id);
        syncedCount++;
      } catch (error) {
        console.error("Failed to sync submission:", submission.id, error);
      }
    }

    // Reload submissions
    await loadOfflineSubmissions();
    setIsSyncing(false);

    return syncedCount;
  }, [isOnline, isSyncing]);

  return {
    isOnline,
    offlineSubmissions,
    isSyncing,
    syncOfflineSubmissions,
    loadOfflineSubmissions,
  };
}