import idb from '../node_modules/idb/lib/idb';
const openDatabase = () => {
  if (!navigator.serviceWorker) {
    return;
  }

  return idb.open('restaurant-reviews', 1, function (upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    }
  });
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

      // const restaurants = [];
      // const store = tx.objectStore('restaurants');
      // (store.iterateKeyCursor || store.iterateCursor)
      //   .call(store, (cursor) => {
      //     if (!cursor) {
      //       console.log('finito..');
      //       return;
      //     }
      //     console.log('pushing something..');
      //     restaurants.push(cursor.key);
      //     cursor.continue();
      //   });
      // console.log(`restaurants: ${restaurants}`);
      // return tx.complete.then(() => restaurants);
    }).catch(error => console.error(error));
  }
};
self.idbKey = idbKey;
export default idbKey;