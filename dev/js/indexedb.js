const idb = require('../../node_modules/idb/lib/idb');

/**
 * function connect to indexedDB and all it differents ObjectStore.
 */
const openDatabase = () => {
  return idb.open('restaurant-reviews', 3, (upgradeDb) => {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
      case 1:
        upgradeDb.createObjectStore('reviews', { keyPath: 'id', autoIncrement:true});
      case 1:
        upgradeDb.createObjectStore('posts', {keyPath: 'restaurant_id'});
    }
  })
};

/**
 * All types of actions that can be made in indexedDB.
 */
const idbKey = {
  async get(store, key) {
    const db = await openDatabase().catch(error => console.error(error));
    if (!db) return;
    return db
      .transaction(store)
      .objectStore(store)
      .get(key);
  },
  async set(store, value) {
    const db = await openDatabase().catch(error => console.error(error));
    if (!db) return;
    const tx = await db
      .transaction(store, 'readwrite')
      .objectStore(store)
      .put(value);
    return tx.complete;
  },
  async getAll(store) {
    const db = await openDatabase().catch(error => console.error(error));
    if (!db) return;
    return db
      .transaction(store)
      .objectStore(store)
      .getAll();
  },
  async delete(store, id) {
    const db = await openDatabase().catch(error => console.error(error));
    
    if (!db) return;

    return db
      .transaction(store, 'readwrite')
      .objectStore(store)
      .delete(id);
  },
  async addReview(store, review) {
    const db = await openDatabase().catch(error => console.error(error));
    
    if (!db) return;

    return db
      .transaction(store, 'readwrite')
      .objectStore(store)
      .add(review);
  },
  async getRestaurantReviews(store, key) {
    const db = await openDatabase().catch(error => console.error(error));
    
    if (!db) return;
    
    const reviews = await db
      .transaction(store)
      .objectStore(store)
      .getAll()
    
    return reviews.filter(review => review.restaurant_id === key)
  }
};
module.exports = idbKey;