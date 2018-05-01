import idb from '../node_modules/idb/lib/idb';
const openDatabase = () => {
  if (!navigator.serviceWorker) {
    return;
  }

  const request = idb.open('restaurant-reviews', 1, function (upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    }
  })
  return request;
};

const idbKey = {
  get(store, key) {
    return openDatabase().then(db => {
      if (!db) {
        return;
      }
      return db.transaction(store).objectStore(store).get(key);
    }).catch(error => console.error(error));
  },
  set(store, value) {
    return openDatabase().then(db => {
      if (!db) {
        return;
      }
      //TODO: Add an id verification to avoid adding twice the same restaurant
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value);
      return tx.complete;
    }).catch(error => console.error(error));
  },
  getAll(store) {
    return openDatabase().then(db => {
      if (!db) {
        return;
      }
      return db.transaction(store).objectStore(store).getAll();
    }).catch(error => console.error(error));
  }
};
self.idbKey = idbKey;
export default idbKey;