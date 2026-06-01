import { getFunctions, httpsCallable } from 'firebase/functions';

export function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ListingDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineListings')) {
        db.createObjectStore('offlineListings', { keyPath: 'id' });
      }
    };
  });
}

export async function saveOfflineListing(listingId, data, imageFile) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineListings'], 'readwrite');
    const store = transaction.objectStore('offlineListings');
    
    const record = {
      id: listingId,
      ...data,
      imageFile: imageFile || null,
      timestamp: Date.now(),
      synced: false
    };

    const request = store.put(record);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllUnsyncedListings() {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineListings'], 'readonly');
    const store = transaction.objectStore('offlineListings');
    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result || [];
      const unsynced = all.filter(item => !item.synced);
      resolve(unsynced);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function markAsSynced(listingId) {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offlineListings'], 'readwrite');
    const store = transaction.objectStore('offlineListings');
    const getRequest = store.get(listingId);

    getRequest.onsuccess = () => {
      const data = getRequest.result;
      if (data) {
        data.synced = true;
        const updateRequest = store.put(data);
        updateRequest.onsuccess = () => resolve(true);
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve(false);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Background sync function triggered when browser recovers internet connection
export async function syncOfflineListings() {
  if (!navigator.onLine) return;

  try {
    const unsynced = await getAllUnsyncedListings();
    if (unsynced.length === 0) return;

    console.log(`Found ${unsynced.length} unsynced listing(s). Starting sync...`);
    const functions = getFunctions();
    const processImage = httpsCallable(functions, 'processListingImage');

    for (const listing of unsynced) {
      try {
        if (listing.imageFile) {
          const base64 = await fileToBase64(listing.imageFile);
          const imageBase64 = base64.split(',')[1];
          
          await processImage({
            imageBase64,
            listingId: listing.id,
            userHint: listing.category
          });
        }
        await markAsSynced(listing.id);
        console.log(`Successfully synced listing: ${listing.id}`);
      } catch (err) {
        console.error(`Sync failed for listing: ${listing.id}`, err);
      }
    }
  } catch (error) {
    console.error("IndexedDB sync run error:", error);
  }
}

// Convert file helper
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// Register browser online sync listener automatically
if (typeof window !== 'undefined') {
  window.addEventListener('online', syncOfflineListings);
}
