// IndexedDB utilities for offline form storage

export async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AbleLeakDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-submissions')) {
        db.createObjectStore('offline-submissions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cached-forms')) {
        db.createObjectStore('cached-forms', { keyPath: 'id' });
      }
    };
  });
}

export async function saveOfflineSubmission(submission) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-submissions'], 'readwrite');
    const store = transaction.objectStore('offline-submissions');
    const request = store.put({
      id: `${submission.template_id}-${Date.now()}`,
      template_id: submission.template_id,
      form_type: submission.form_type,
      field_values: submission.field_values,
      submitted_by: submission.submitted_by,
      timestamp: new Date().toISOString(),
      synced: false,
      ...submission,
    });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getOfflineSubmissions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-submissions'], 'readonly');
    const store = transaction.objectStore('offline-submissions');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result.filter((s) => !s.synced));
  });
}

export async function deleteOfflineSubmission(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-submissions'], 'readwrite');
    const store = transaction.objectStore('offline-submissions');
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function markOfflineSubmissionSynced(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-submissions'], 'readwrite');
    const store = transaction.objectStore('offline-submissions');
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const submission = getRequest.result;
      submission.synced = true;
      const putRequest = store.put(submission);
      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    };
  });
}

export async function cacheForm(formData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cached-forms'], 'readwrite');
    const store = transaction.objectStore('cached-forms');
    const request = store.put({
      id: formData.id,
      template_id: formData.template_id,
      sections: formData.sections,
      logic_rules: formData.logic_rules,
      cached_at: new Date().toISOString(),
      ...formData,
    });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getCachedForm(formId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['cached-forms'], 'readonly');
    const store = transaction.objectStore('cached-forms');
    const request = store.get(formId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}