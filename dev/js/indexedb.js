const idb = require('../../node_modules/idb/lib/idb');

const openDatabase = () => {
  return idb.open('restaurant-reviews', 3, (upgradeDb) => {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
      case 1:
        upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
      case 1:
        upgradeDb.createObjectStore('posts', {keyPath: 'restaurant_id'});
    }
  })
};

const idbKey = {
  get(store, key) {
    return openDatabase().then(db => {
      if (!db) return;
      return db
        .transaction(store)
        .objectStore(store)
        .get(key);
    }).catch(error => console.error(error));
  },
  set(store, value) {
    return openDatabase().then(db => {
      if (!db) return;
      const tx = db
        .transaction(store, 'readwrite')
        .objectStore(store)
        .put(value);
      return tx.complete;
    }).catch(error => console.error(error));
  },
  getAll(store) {
    return openDatabase().then(db => {
      if (!db) return;
      return db
        .transaction(store)
        .objectStore(store)
        .getAll();
    }).catch(error => console.error(error));
  },
  delete(store, id) {
    return openDatabase().then(db => {
      if (!db) return;
      return db
        .transaction(store, 'readwrite')
        .objectStore(store)
        .delete(id);
    }).catch(error => console.error(error));
  },
  getRestaurantReviews(store, key) {
    return openDatabase().then(db => {
      if (!db) return;
      return db
        .transaction(store)
        .objectStore(store)
        .getAll()
        .then(reviews => reviews.filter(review => review.restaurant_id === key))
    }).catch(error => console.error(error));
  }
};
module.exports = idbKey;