import { transcriptionWorker } from "./transcriptionWorker";

/**
 * Manager for transcription worker lifecycle
 * Starts/stops the worker based on app state
 */

class WorkerManager {
  constructor() {
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Start worker when app initializes
    transcriptionWorker.start();

    // Stop worker on page unload
    window.addEventListener("beforeunload", () => {
      transcriptionWorker.stop();
    });

    // Resume/pause based on visibility
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        transcriptionWorker.stop();
      } else {
        transcriptionWorker.start();
      }
    });
  }

  getWorker() {
    return transcriptionWorker;
  }
}

export const workerManager = new WorkerManager();