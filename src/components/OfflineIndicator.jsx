import React from "react";
import { useOffline } from "@/hooks/useOffline";
import { WifiOff, Wifi, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function OfflineIndicator() {
  const { isOnline, offlineSubmissions, isSyncing, syncOfflineSubmissions } = useOffline();

  if (isOnline && offlineSubmissions.length === 0) {
    return null;
  }

  const handleSync = async () => {
    try {
      const count = await syncOfflineSubmissions();
      if (count > 0) {
        toast.success(`Synced ${count} offline submission${count !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      toast.error("Failed to sync submissions");
    }
  };

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg z-40">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">You're offline</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Forms can be filled and will sync when you're back online
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (offlineSubmissions.length > 0) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Wifi className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-900">
                {offlineSubmissions.length} pending submission{offlineSubmissions.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-700 mt-0.5">Ready to sync</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-shrink-0 border-blue-200 hover:bg-blue-100"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
              </>
            ) : (
              <span className="hidden sm:inline">Sync Now</span>
            )}
            {!isSyncing && <span className="sm:hidden">Sync</span>}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}