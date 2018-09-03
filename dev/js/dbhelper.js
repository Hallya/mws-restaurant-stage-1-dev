const idbKey = require('./indexedb');

const scheme = 'http://',
  host = 'localhost',
  port = ':3000',
  path = {
    restaurants: '/restaurants/',
    reviews: '/reviews/'
  },
  query = {
    is_favorite: '/?is_favorite=',
    restaurant_id: '?restaurant_id='
  },

  baseURI = scheme + host + port;
  
const DBHelper = {

  DATABASE_URL:{
    GET: {
      allRestaurants: () => fetch(baseURI + path.restaurants),
      allReviews: () => fetch(baseURI + path.reviews),
      restaurant: (id) => fetch(baseURI + path.restaurants + id ),
      restaurantReviews: (id) => fetch(baseURI + path.reviews + query.restaurant_id + id)
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
  fetchRestaurants: async () => {
    const store = 'restaurants';
    const cachedRestaurants = await idbKey.getAll(store).catch(error => console.error(error));
    if (cachedRestaurants.length < 10) {
      const response = await DBHelper.DATABASE_URL.GET.allRestaurants();
      const restaurants = response && await response.json();
      console.log('- Restaurants data fetched');

      restaurants.forEach(restaurant => {
        restaurant.is_favorite = restaurant.is_favorite && restaurant.is_favorite.toString();
        idbKey.set(store, restaurant);
      })

      return restaurants;
    }
    return cachedRestaurants;
  },
  /**
   * Fetch all reviews.
   */
  fetchReviews: async () => {
    const response = await DBHelper.DATABASE_URL.GET.allReviews().catch(error => console.error(`Request failed. Returned status of ${error}`));
    const reviews = await response && response.json();

    console.log('- Reviews data fetched !');
    return reviews;
  },
  
  /**
   * Fetch restaurant reviews.
   */
  fetchRestaurantReviews: async (id) => {
    const store = 'reviews';
    let cachedReviews = await idbKey.getAll(store).catch(error => console.error(error))

    cachedReviews = cachedReviews.filter(review => review.restaurant_id === Number(id));
    
    if (!cachedReviews.length) {
      const response = await DBHelper.DATABASE_URL.GET.restaurantReviews(id).catch(error => console.error(`Request failed. Returned status of ${error}`));
      let reviews = await response && response.json();
      console.log('- Restaurant reviews fetched !');

      await reviews && reviews.length && reviews.forEach(review => idbKey.set(store, review));
      return reviews;
    } 
    else {
      return cachedReviews;
    };
  },
  
  /**
   * Fetch a restaurant by its ID.
   */
  fetchRestaurantById: async (id) => {
    const store = 'restaurants';
    const cache = await idbKey.get(store, Number(id));

    if (!cache) {
      console.log('- No restaurant cached');
      const response = await DBHelper.DATABASE_URL.GET.restaurant(id).catch(error => console.error(`Restaurant does not exist: ${error}`));;
      const restaurant = response && await response.json();

      restaurant.is_favorite = restaurant.is_favorite.toString();
      idbKey.set(store, restaurant);

      return restaurant;
    }
    else {
      return cache;
    }
  },

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  fetchRestaurantByCuisineAndNeighborhood: async (cuisine, neighborhood) => {
    const store = 'restaurants';
    const cachedResults = await idbKey.getAll(store).catch((error) => console.error(error));
    if (cachedResults.length < 10) {
      const restaurants = await DBHelper.fetchRestaurants().catch(error => console.error(error));

      restaurants.forEach((restaurant) => idbKey.set(store, restaurant));

      return DBHelper.filterResults(restaurants, cuisine, neighborhood);
    
    }
    else {
      return DBHelper.filterResults(cachedResults, cuisine, neighborhood);
    }
  },

  /**
   * Filter restaurant list depending on cuisine and neighborhood selection.
   */
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
    // Get all neighborhoods from all restaurants neighborhood key
    const neighborhoods = restaurants.map(restaurant => restaurant.neighborhood);
    // Remove duplicates from neighborhoods from the array made
    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
    return uniqueNeighborhoods;
  },

  /**
   * Fetch all cuisines with proper error handling.
   */
  addCuisinesOptions: (restaurants) => {
    // Get all cuisines from all restaurants food types key
    const cuisines = restaurants.map(restaurant => restaurant.cuisine_type);
    // Remove duplicates from cuisines from the array made
    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
    return uniqueCuisines;
  },

  /**
   * Restaurant page URL.
   */
  urlForRestaurant: (restaurant) => (`restaurant.html?id=${restaurant.id}`),

  /**
   * Restaurant image URL for JPG format.
   */
  imageUrlForRestaurant: (restaurant) => (`assets/img/jpg/${restaurant.photograph}`),
  
  /**
   * Restaurant image URL for WEBP format.
   */
  imageWebpUrlForRestaurant: (restaurant) => (`assets/img/webp/${restaurant.photograph}`),

  postReview: async (e) => {
    e.preventDefault();
    // Get form and its content after submit.
    const form = document.querySelector('#title-container form').elements;
    // Get form's information and put them in separate keys.
    const body = {
      restaurant_id: Number(window.location.search.match(/\d+/)[0]),
      name: form["name"].value,
      rating: Number(form["rating"].value),
      comments: form["comments"].value,
    }
    // Store the object containing form's information in indexedDB to have it available later.
    await idbKey.set('posts', body);
    // Add the time the review was posted at.
    body.createdAt = Date.now(),
    body.updatedAt = Date.now();
    // Store the object containing form's information in indexedDB but with other reviews this time.
    await idbKey.addReview('reviews', body);
    // Triggers a sync event with tag "post-review".
    console.log(navigator.serviceWorker.ready);
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register({
      id: 'post-review'
    });
    // Reload the page to update reviews displayed.
    location.reload();
  },

  setFavorite: async (target, restaurant, button, secondTarget) => {
    target.classList.toggle('hidden');
    const favorite = restaurant.is_favorite === 'true'? 'false' : 'true';
    const store = 'restaurants';
    button.setAttribute('aria-label', target.classList.contains('hidden') ? `unset ${restaurant.name} as favorite`:`set ${restaurant.name} as favorite`);
    target.setAttribute('aria-hidden', restaurant.is_favorite === 'true' ? 'true':'false');
    secondTarget.setAttribute('aria-hidden', restaurant.is_favorite === 'true' ? 'false':'true');
    restaurant.is_favorite = favorite;
    await idbKey.set(store, restaurant);
    return await DBHelper.DATABASE_URL.PUT.favoriteRestaurant(restaurant.id, favorite);
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