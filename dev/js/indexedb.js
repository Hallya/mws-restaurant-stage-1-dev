const idb = require('../../node_modules/idb/lib/idb');

const openDatabase = () => {
  if (!navigator.serviceWorker) return;
  return idb.open('restaurant-reviews', 1, (upgradeDb) => {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    }
  })
};

const idbKey = {
  get(store, key) {
    return openDatabase().then(db => {
      if (!db) return;
      return db.transaction(store).objectStore(store).get(key);
    }).catch(error => console.error(error));
  },
  set(store, value) {
    return openDatabase().then(db => {
      if (!db) return;
      const tx = db.transaction(store, 'readwrite').objectStore(store).put(value);
      return tx.complete;
    }).catch(error => console.error(error));
  },
  getAll(store) {
    return openDatabase().then(db => {
      if (!db) return;
      return db.transaction(store).objectStore(store).getAll();
    }).catch(error => console.error(error));
  }
};
module.exports = idbKey;