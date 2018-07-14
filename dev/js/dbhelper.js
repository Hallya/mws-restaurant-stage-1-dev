const idbKey = require('./indexedb');

const scheme = 'http://',
  host = 'localhost',
  port = ':1337',
  path = {
    restaurants: '/restaurants/',
    reviews: '/reviews/'
  },
  query = {
    is_favorite: '?is_favorite=',
    restaurant_id: '?restaurant_id='
  },

  baseURI = scheme + host + port;

const DBHelper = {

  DATABASE_URL:{
    GET: {
      allRestaurants: () => fetch(baseURI + path.restaurants),
      allReviews: () => fetch(baseURI + path.reviews),
      restaurant: (id) => fetch(baseURI + path.restaurants + id ),
      setFavoriteRestaurants: (answer) => fetch(baseURI + path.restaurants + query.is_favorite + answer)
    },
    POST: {
      newReview: (body) => fetch(baseURI + path.reviews, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
    },
    PUT: {
      favoriteRestaurant: (id, answer) => fetch(baseURI + path.restaurants + id + query.is_favorite + answer, {
        method: 'PUT'
      }),
      updateReview: (id) => fetch(baseURI + path.reviews + id, {
        method: 'PUT'
      })
    },
    DELETE: {
      review: (id) => fetch(baseURI + path.reviews + id, {
        method: 'DELETE'
      })
    }
  },
  /**
   * Fetch all restaurants.
   */
  fetchRestaurants: () => {
    const store = 'restaurants';
    return idbKey.getAll(store)
    .then(restaurants => {
      if (restaurants.length < 10) {
        return DBHelper.DATABASE_URL.GET.allRestaurants()
        .then(response => response.json())
        .then(restaurants => {
          console.log('- Restaurants data fetched !');
          return restaurants.restaurants || restaurants;
        })
        .then(restaurants => {
          restaurants.forEach(restaurant => idbKey.set(store, restaurant));
          return restaurants;
        })
        .catch(error => console.error(`Request failed. Returned status of ${error}`));
      } else {
        return restaurants;
      }
    }).catch(error => {
      console.error(error)
    });
  },
  /**
   * Fetch all reviews.
   */
  fetchReviews: () => {
    const store = 'reviews';
    return idbKey.getAll(store)
    .then(reviews => {
      if (reviews.length < 10) {
        return DBHelper.DATABASE_URL.GET.allReviews()
        .then(response => response.json())
        .then(reviews => {
          console.log('- Reviews data fetched !');
          return reviews.reviews || reviews;
        })
        .then(reviews => {
          reviews.forEach(review => idbKey.set(store, review));
          return reviews;
        })
        .catch(error => console.error(`Request failed. Returned status of ${error}`));
      } else {
        return reviews;
      }
    }).catch(error => {
      console.error(error)
    });
  },
  
  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById: (id) => {
    // fetch all restaurants with proper error handling.
    const store = 'restaurants';

    return idbKey.get(store, Number(id))
      .then((restaurant) => {
        if (!restaurant) {
          console.log('- No restaurant cached');
          return DBHelper.DATABASE_URL.GET.restaurant(id)
            .then(response => response.json())
            .then(restaurant => {
              idbKey.set(store, restaurant);
              return restaurant;
            })
            .catch(error => console.error(`Restaurant does not exist: ${error}`));
        } else {
          return restaurant;
        }
      })
  },

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood: (cuisine, neighborhood) => {
    // Fetch all restaurants
    const store = 'restaurants';
    return idbKey.getAll(store)
      .then((cachedResults) => {
        if (cachedResults.length < 10) {
          return DBHelper.fetchRestaurants()
            .then(restaurants => {
              const results = restaurants;
              results.forEach((restaurant) => idbKey.set(store, restaurant));
              return DBHelper.filterResults(results, cuisine, neighborhood);
            })
            .catch(error => console.error(error));
        } else {
          return DBHelper.filterResults(cachedResults, cuisine, neighborhood);
        }
      }).catch((error) => console.error(error));
  },

  filterResults: (results, cuisine, neighborhood) => {
    if (cuisine !== 'all') {
      results = results.filter(restaurant => restaurant.cuisine_type == cuisine);
    }
    if (neighborhood !== 'all') {
      results = results.filter(restaurant => restaurant.neighborhood == neighborhood);
    }
    return results;
  },
  /**
   * Fetch all neighborhoods with proper error handling.
   */
  addNeighborhoodsOptions: (restaurants) => {
    // Get all neighborhoods from all restaurants
    const neighborhoods = restaurants.map(restaurant => restaurant.neighborhood);
    // Remove duplicates from neighborhoods
    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
    return uniqueNeighborhoods;
  },

  /**
   * Fetch all cuisines with proper error handling.
   */
  addCuisinesOptions: (restaurants) => {
    // Get all cuisines from all restaurants
    const cuisines = restaurants.map(restaurant => restaurant.cuisine_type);
    // Remove duplicates from cuisines
    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
    return uniqueCuisines;
  },

  /**
   * Restaurant page URL.
   */
  urlForRestaurant: (restaurant) => {
    return (`restaurant.html?id=${restaurant.id}`);
  },

  /**
   * Restaurant image URL.
   */
  imageUrlForRestaurant: (restaurant) => {
    return (`assets/img/jpg/${restaurant.photograph}`);
  },
  
  imageWebpUrlForRestaurant: (restaurant) => {
    return (`assets/img/webp/${restaurant.photograph}`);
  },

  postReview: async (e) => {
    console.log('Trying to post review...')
    e.preventDefault();
    const form = document.querySelector('#title-container form').elements;
    const body = {
      restaurant_id: Number(window.location.search.match(/\d+/)[0]),
      name: form["name"].value,
      rating: Number(form["rating"].value),
      comments: form["comments"].value,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await idbKey.set('posts', body);
    await idbKey.addReview('reviews', body);
    const registration = await navigator.serviceWorker.ready
    Notification.requestPermission()
      .then(function (result) {
        if (result === 'denied') {
          console.log('Permission wasn\'t granted. Allow a retry.');
          return;
        }
        if (result === 'default') {
          console.log('The permission request was dismissed.');
          return;
        }
        if (result === 'granted') { 
          console.log('Notification allowed')
        }
      });
    registration.sync.register('post-review');
    location.reload();
    registration.sync.getTags().then(res => console.log(res));
  },
  /**
   * Map marker for a restaurant.
   */
  mapMarkerForRestaurant: (restaurant, map) => {
    const marker = new google.maps.Marker({
      position: {
        lat: restaurant.lat || restaurant.latlng.lat,
        lng: restaurant.lng || restaurant.latlng.lng
      },
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP,
      icon: 'assets/img/svg/marker.svg'
    });
    return marker;
  }
};

module.exports = DBHelper;