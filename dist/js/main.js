(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"./indexedb":3}],2:[function(require,module,exports){
const
  filterOptions = document.querySelector('.filter-options'),
  filterButton = document.getElementById('menuFilter'),
  filterResultHeading = document.querySelector('.filter-options h3'),
  neighborhoodSelect = document.querySelector('#neighborhoods-select'),
  cuisineSelect = document.querySelector('#cuisines-select'),
  sortSelect = document.querySelector('#sort-select'),
  favorites = document.querySelector('#favorites'),

  launch = {

  /**
   * function go to restaurant page.
   */
  goToRestaurantPage: (e) => {
    e.target.classList.toggle('move-left');
    window.location.assign(e.target.dataset.url)
  },

  /**
   * function to create a fixed cloned element, in order to always keep access to controls for the user.
   */
  fixedOnViewport: (referer, target) => {

    const clonedTarget = target.cloneNode(true);
    clonedTarget.className = 'fixed exclude';
    clonedTarget.id = "";
    clonedTarget.setAttribute('aria-hidden', 'true');
    clonedTarget.tabIndex = -1;
    clonedTarget.children[0].children[0].setAttribute('aria-hidden', 'true');
    clonedTarget.children[0].children[0].tabIndex = -1;
    clonedTarget.children[1].setAttribute('aria-hidden', 'true');
    clonedTarget.children[1].tabIndex = -1;
    target.appendChild(clonedTarget);
    
    if ('IntersectionObserver' in window) {
      const options = {
        root: null,
        threshold: [0.01],
        rootMargin: "0px"
      }
      
      const observer = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          
          if (entry.intersectionRatio <= .01) {
            clonedTarget.classList.remove('exclude');
            clonedTarget.classList.add('shadow');
            target.classList.add('shadow');
          } else {
            if (target.classList.contains('shadow')){ target.classList.remove('shadow');}
            clonedTarget.classList.remove('shadow');
            clonedTarget.classList.add('exclude');
          }
        });
      },options);
      observer.observe(referer);
    }
  },

  /**
   * Show or hide the filter menu in main page
   */
  toggleMenu: () => {
    filterOptions.classList.toggle('optionsOpen');
    [filterOptions, neighborhoodSelect, cuisineSelect, sortSelect, favorites].forEach(filter => {
      filter.hidden = filter.hidden ? false : setTimeout(() => true, 2000);
    });

    // cuisineSelect.hidden = !cuisineSelect.hidden;
    // sortSelect.hidden = !sortSelect.hidden;
    // favorites.hidden = !favorites.hidden;
    filterButton.classList.toggle('pressed');
    filterButton.blur();
    filterResultHeading.setAttribute('tabindex', '-1');
    filterResultHeading.focus();
  },

  /**
   * Check weither the form is valid and apply style to give feedback to user.
   */
  isFormValid: () => {
    if (document.querySelector('form').checkValidity()) {
      document.querySelector('form input[type="submit"]').style.color = "green";
    } else {
      document.querySelector('form input[type="submit"]').style.color = "#ca0000";
    }
  },

  /**
   * Create animation on form creation or removal.
   */
  toggleForm: () => {
    document.getElementById('title-container').classList.toggle("reviews-toggled");
    document.getElementById('reviews-list').classList.toggle("reviews-toggled");
    document.querySelector('section form').classList.toggle("toggled-display");
    setTimeout(() => {
      document.querySelector('section form').classList.toggle("toggled-translate");
    },800)
  },

  /**
   * Function to lazy load image on main page.
   */
  lazyLoading:() => {
    const lazyImages = [].slice.call(document.querySelectorAll('.lazy'));

    if ('IntersectionObserver' in window) {
      const options = {
        root: null,
        threshold: [],
        rootMargin: "200px"
      }
      for (let i = 0.00; i <= 1; i += 0.01){
        options.threshold.push(Math.round(i*100)/100);
      }
      let lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(function (entry) {
          const lazyImage = entry.target;
          if (entry.isIntersecting || entry.intersectionRatio >= .01) {
            if (lazyImage.localName === 'source') {
              lazyImage.srcset = lazyImage.dataset.srcset;
            } else {
              lazyImage.src = lazyImage.dataset.src;
            }
            lazyImage.classList.remove('lazy');
            lazyImageObserver.unobserve(lazyImage);
          }
        });
      }, options);
      lazyImages.forEach(function (lazyImage) {
        lazyImageObserver.observe(lazyImage);
      });
      document.onreadystatechange = () => {
        if (document.readyState == "complete") {
          launch.lazyLoading();
        }
      }
    } else {
      // Possible fallback to a more compatible method here
      let lazyImages = [].slice.call(document.querySelectorAll('.lazy'));

      let active = false;
      const lazyLoad = function () {
        if (active === false) {
          active = true;
          const windowInnerHeight = window.innerHeight + 200;

          // setTimeout(function () {
          lazyImages.forEach(function (lazyImage) {
            if ((lazyImage.getBoundingClientRect().top <= windowInnerHeight
              && lazyImage.getBoundingClientRect().bottom >= 0)
              && getComputedStyle(lazyImage).display !== 'none') {
              lazyImage.src = lazyImage.dataset.src;
              lazyImage.srcset = lazyImage.dataset.srcset;
              lazyImage.classList.remove('lazy');

              lazyImages = lazyImages.filter(function (image) {
                return image !== lazyImage;
              });

              if (lazyImages.length === 0) {
                document.removeEventListener('scroll', lazyLoad);
                window.removeEventListener('resize', lazyLoad);
                window.removeEventListener('orientationchange', lazyLoad);
              }
            }
          });

          active = false;
          // }, 200);
        }
      };
      document.addEventListener('scroll', lazyLoad);
      window.addEventListener('resize', lazyLoad);
      window.addEventListener('orientationchange', lazyLoad);
      if (document.readyState == "complete") {
        console.log('document ready for lazy load');
        lazyLoad();
      }
      document.onreadystatechange = function () {
        if (document.readyState == "complete") {
          console.log('document ready for lazy load');
          lazyLoad();
        }
      }
    }
  },

  /**
   * Sort restaurants by there notes on main page.
   */
  sortByNote: (a, b) => {
    const aNote = Number(a.average_rating.replace('/5', ''));
    const bNote = Number(b.average_rating.replace('/5', ''));
    if (aNote < bNote) {
      return 1
    }
    if (aNote > bNote) {
      return -1
    }
    return 0;
  },

  /**
   * Sort increasingly restaurants by there names on main page.
   */
  sortByName: (a, b) => {
    return a.name > b.name;
  },

  /**
   * Sort decreasingly restaurants by there name on main page.
   */
  sortByNameInverted: (a, b) => {
    return a.name < b.name; 
  },


  /**
   * Get the average note for each restaurant.
   */
  getAverageNote: (id, reviews = self.reviews) => {
    let totalRatings = 0;
    let totalReviews = 0;
    reviews && reviews.forEach(review => {
      if (review.restaurant_id === id) {
        totalRatings += Number(review.rating);
        totalReviews++;
      }
    });
    totalRatings = totalRatings / totalReviews;
    return totalRatings && `${(Math.round(totalRatings * 10)) / 10}/5` || 'N/A';
  },
};
module.exports = launch;
},{}],3:[function(require,module,exports){
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
},{"../../node_modules/idb/lib/idb":5}],4:[function(require,module,exports){
const DBHelper =  require('./dbhelper');
const launch = require('./helpers');
const idbKey = require('./indexedb');

let restaurants,
neighborhoods,
cuisines,
loading = false,
markers = [],
cuisine,
neighborhood,
sort,
favorites;

const 
  filterOptions = document.querySelector('.filter-options'),
  filterButton = document.getElementById('menuFilter'),
  listOfRestaurants = document.querySelector('#restaurants-list'),
  neighborhoodsSelect = document.querySelector('#neighborhoods-select'),
  cuisinesSelect = document.querySelector('#cuisines-select'),
  favoritesCheckbox = document.querySelector('#favorites input'),
  sortSelect = document.querySelector('#sort-select'),
  loader = document.querySelector('#map-loader');

/**
 * Try to register to service worker and fetch restaurants depending of filters as soon as the DOM is loaded.
 */
document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    console.log('Service worker available !')
    const pathToServiceWorker = window.location.hostname === 'hallya.github.io' ? '/mws-restaurant-stage-1/sw.js' : '../sw.js'
    const registration = await navigator.serviceWorker.register(pathToServiceWorker).catch(error => console.error(error));

    console.log('Registration to serviceWorker complete with scope :', registration.scope)
    const isReady = await navigator.serviceWorker.ready.catch(error => console.error(error));
    isReady.sync.register('post-review');
  }
  await updateRestaurants().catch(error => console.error(error));
  await Promise.all([
    addSortOptions(),
    addCuisinesOptions(),
    addNeighborhoodsOptions()
  ]).catch(error => console.error(error));
});

/**
 * Add event listeners to filters features.
 */
window.addEventListener('load', () => {
  if (!window.navigator.standalone
    && window.navigator.userAgent.indexOf('Android') === -1
    && window.navigator.userAgent.indexOf('Linux') === -1
    && window.innerWidth < 550) {
      addBannerToHomeScreen();
  }

  cuisinesSelect.addEventListener('change', updateRestaurants);
  neighborhoodsSelect.addEventListener('change', updateRestaurants);
  sortSelect.addEventListener('change', updateRestaurants);
  favoritesCheckbox.addEventListener('change', updateRestaurants);
  filterButton.addEventListener('click', launch.toggleMenu);
});
    

/**
 * If select/filter menu is open, press enter will make the restaurants list focus.
 */
document.onkeypress = function (e) {
  if (e.charCode === 13 && filterOptions.classList.contains('optionsOpen')) {
    launch.toggleMenu();
    listOfRestaurants.setAttribute('tabindex', '-1');
    listOfRestaurants.focus();
    document.getElementById('skip').click();
  }
};

/**
 * Get neighborhoods select options and add it.
 */
const addNeighborhoodsOptions = (restaurants = self.restaurants) => {
  self.neighborhoods = DBHelper.addNeighborhoodsOptions(restaurants);
  fillNeighborhoodsHTML();
};

/**
 * Get cuisines select options and add it.
 */
const addCuisinesOptions = (restaurants = self.restaurants) => {
  self.cuisines = DBHelper.addCuisinesOptions(restaurants);
  fillCuisinesHTML();
};

/**
 * Fill neighborhoods options.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = neighborhoodsSelect;
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-setsize', '4');
    option.setAttribute('aria-posinset', neighborhoods.indexOf(neighborhood)+2);
    select.append(option);
  });
};

/**
 * Fill neighborhoods options.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = cuisinesSelect;
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-setsize', '4');
    option.setAttribute('aria-posinset', cuisines.indexOf(cuisine) + 2);
    select.append(option);
  });
};

/**
 * Initialize Google map, called from restaurant.html and switch loader to map when all tiles are loaded.
 */
window.initMap = () => {
  
  const mapPlaceHolder = document.createElement('div');
  mapPlaceHolder.setAttribute('tabindex', '-1');
  mapPlaceHolder.setAttribute('aria-hidden', 'true');
  mapPlaceHolder.id = "map";

  const loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.map = new google.maps.Map(mapPlaceHolder, {
    center: loc,
    zoom: 12,
    streetViewControl: false,
    zoomControl: true,
    fullscreenControl: true,
    mapTypeId: 'roadmap',
    mapTypeControl: false,
  });

  document.getElementById('map-container').appendChild(mapPlaceHolder);
  
  self.map.addListener('tilesloaded', function () {
    loader.remove();
    addMarkersToMap();
  });
};

/**
 * Update list of restaurant depending on filters.
 */
const updateRestaurants = async () => {
  const cSelect = cuisinesSelect,
    nSelect = neighborhoodsSelect,
    sSelect = sortSelect,

  cIndex = cSelect.selectedIndex,
  nIndex = nSelect.selectedIndex,
  sIndex = sSelect.selectedIndex;

  if (cuisine === cSelect[cIndex].value
    && neighborhood === nSelect[nIndex].value
    && sort === sSelect[sIndex].value
    && favorites === favoritesCheckbox.checked) {
    
    return Promise.resolve();
  }
  
  cuisine = cSelect[cIndex].value;
  neighborhood = nSelect[nIndex].value;
  sort = sSelect[sIndex].value;
  favorites = favoritesCheckbox.checked;
  
  const results = await Promise.all([
    DBHelper.fetchReviews(),
    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
  ]).catch(error => console.error(error))

  self.reviews = results[0];
  self.restaurants = results[1];

  await resetRestaurants();
  await sortRestaurantsBy();
  await generateRestaurantsHTML(getFavorites());
  console.log('- Restaurants list updated !');
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants = self.restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (markers.length > 0) {
    self.markers.forEach(marker => marker.setMap(null));
  }
  self.markers = [];
  self.restaurants = restaurants;
  return restaurants;
};

/**
 * Add sort options in filter menu.
 */
const addSortOptions = () => {
  sortOptions = ['Note', 'A-Z', 'Z-A'];
  sortOptions.forEach(sortOption => {
    const option = document.createElement('option');
    option.innerHTML = sortOption;
    option.value = sortOption;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-setsize', '4');
    option.setAttribute('aria-posinset', sortOptions.indexOf(sortOption) + 2);
    sortSelect.append(option);
  });
}

/**
 * Filter favorites restaurants from others.
 */
const getFavorites = (restaurants = self.restaurants) => {
  favorites && document.getElementById('favorites').classList.add('active');
  !favorites && document.getElementById('favorites').classList.remove('active');
  return restaurants
    .filter(restaurant => favorites && restaurant.is_favorite === 'true' || !favorites && restaurant
    );
}

/**
 * Sort restaurants.
 */
const sortRestaurantsBy = (restaurants = self.restaurants) => {
  const sIndex = sortSelect.selectedIndex;
  switch (sortSelect[sIndex].value) {
    case 'Relevant':
      return restaurants;
      break;
    case 'Note':
      return restaurants.sort(launch.sortByNote)
      break;
    case 'A-Z':
      return restaurants.sort(launch.sortByName);
      break;
    case 'Z-A':
      return restaurants.sort(launch.sortByNameInverted);
      break;
  }
}

/**
 * Iterate on list of restaurants to create them.
 */
const generateRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => ul.append(createRestaurantHTML(restaurant)));
  return launch.lazyLoading();
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  
  const li = document.createElement('li');
  const figure = document.createElement('figure');
  const figcaption = document.createElement('figcaption');
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  const secondSource = document.createElement('source');
  const thSource = document.createElement('source');
  const sourceWebp = document.createElement('source');
  const secondSourceWebp = document.createElement('source');
  const thSourceWebp = document.createElement('source');
  const image = document.createElement('img');
  const containerNote = document.createElement('aside');
  const note = document.createElement('p');
  const containerFavorite = document.createElement('button');
  const notFavorite = document.createElement('img');
  const favorite = document.createElement('img');


  sourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-large_x1.webp 1x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-large_x2.webp 2x`;
  sourceWebp.srcset = 'assets/img/svg/puff.svg';
  sourceWebp.media = '(min-width: 1000px)';
  sourceWebp.type = 'image/webp';
  sourceWebp.className = 'lazy';
  source.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-large_x2.jpg 2x`;
  source.srcset = 'assets/img/svg/puff.svg';
  source.media = '(min-width: 1000px)';
  source.className = 'lazy';
  source.type = 'image/jpeg';
  source.onerror = "this.onerror=null;this.src='assets/img/svg/no-wifi.svg';"
  
  secondSourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x1.webp 1x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x2.webp 2x`;
  secondSourceWebp.srcset = 'assets/img/svg/puff.svg';
  secondSourceWebp.media = '(min-width: 420px)';
  secondSourceWebp.className = 'lazy';
  secondSourceWebp.type = 'image/webp';
  secondSource.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x2.jpg 2x`;
  secondSource.srcset = 'assets/img/svg/puff.svg';
  secondSource.media = '(min-width: 420px)';
  secondSource.className = 'lazy';
  secondSource.type = 'image/jpeg';
  
  thSourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x2.webp 2x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x1.webp 1x`;
  thSourceWebp.srcset = 'assets/img/svg/puff.svg';
  thSourceWebp.media = '(min-width: 320px)';
  thSourceWebp.className = 'lazy';
  thSourceWebp.type = 'image/webp';
  thSource.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x2.jpg 2x, ${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg 1x`;
  thSource.srcset = 'assets/img/svg/puff.svg';
  thSource.media = '(min-width: 320px)';

  thSource.type = 'image/jpeg';
  
  image.dataset.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg`;
  image.src = 'assets/img/svg/puff.svg';
  image.className = 'restaurant-img lazy';
  image.setAttribute('sizes', '(max-width: 1100px) 85vw, (min-width: 1101px) 990px');
  image.alt = `${restaurant.name}'s restaurant`;
  image.type = 'image/jpeg';
  
  restaurant.average_rating = launch.getAverageNote(restaurant.id);

  note.innerHTML = `${restaurant.average_rating}`;
  note.setAttribute('aria-hidden', 'true');
  containerNote.append(note);
  containerNote.className = 'container-note';
  containerNote.tabIndex = 0;
  containerNote.setAttribute('aria-label', `${restaurant.name} has a rate of ${restaurant.average_rating.replace('/5', ' on 5')}`)

  containerFavorite.className = 'container--favorite';
  containerFavorite.id = restaurant.id;
  containerFavorite.role = 'button';
  containerFavorite.setAttribute('aria-label', restaurant.is_favorite === 'true' ? `unset ${restaurant.name} as favorite`:`set ${restaurant.name} as favorite`);
  containerFavorite.addEventListener('click',
    () => DBHelper.setFavorite(notFavorite, restaurant, containerFavorite, favorite));
  notFavorite.src = 'assets/img/svg/not-favorite.svg';
  notFavorite.className = `not-favorite ${restaurant.is_favorite === 'true' && 'hidden'}`;
  notFavorite.setAttribute('aria-hidden', restaurant.is_favorite === 'true' ? 'true':'false');
  notFavorite.alt = 'unfavorite restaurant';
  favorite.src = 'assets/img/svg/favorite.svg';
  favorite.className = 'favorite';
  favorite.setAttribute('aria-hidden', restaurant.is_favorite === 'true' ? 'false':'true');
  favorite.alt = 'favorite restaurant';

  containerFavorite.append(favorite);
  containerFavorite.append(notFavorite);

  picture.append(sourceWebp);
  picture.append(source);
  picture.append(secondSourceWebp);
  picture.append(secondSource);
  picture.append(thSourceWebp);
  picture.append(thSource);
  picture.append(image);

  const more = document.createElement('a');
  more.innerHTML = '';
  more.tabIndex = 0;
  more.className = 'fontawesome-arrow-right';
  more.dataset.url = DBHelper.urlForRestaurant(restaurant);
  more.addEventListener('click', launch.goToRestaurantPage)
  more.setAttribute('aria-label', `View details of ${restaurant.name}`);
  more.setAttribute('rel', 'noopener');

  figure.append(picture);
  figure.append(containerFavorite);
  figcaption.append(more);
  figure.append(figcaption);
  
  li.tabIndex = 0;
  li.append(containerNote);
  li.append(figure);
  
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  figcaption.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  li.setAttribute('role', 'listitem');
  li.setAttribute('aria-setsize', '10');
  li.setAttribute('aria-posinset', restaurant.id);
  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  // Add marker to the map
  restaurants.forEach(restaurant => {
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};

/**
 * Create a banner to notified the possibility to add the page as an app.
 */
const addBannerToHomeScreen = () => {
  const aside = document.createElement('aside');
  const note = document.createElement('p');
  const msg = document.createElement('p');
  const span = document.createElement('span');

  aside.id = 'pop';
  
  aside.className = 'popup';
  msg.className = 'popup msg';
  msg.setAttribute('tabindex', '0');
  note.className = 'popup note';
  note.setAttribute('tabindex', '0');
  span.className = 'iconicfill-arrow-down';
  
  note.innerHTML = '(Tap to close)';
  msg.innerHTML = 'Add <img src="assets/img/svg/share-apple.svg" alt=""> this app to your home screen and enjoy it as a real application !';
  
  aside.setAttribute('tabindex', '-1');
  aside.addEventListener('click', () => {
    aside.classList.add('hide');
    setTimeout(() => {
      aside.style = 'display: none;';
    }, 1000);
  });
  aside.append(note); 
  aside.append(msg);
  aside.append(span);
  document.getElementById('maincontent').appendChild(aside);
  aside.focus();
  setTimeout(() => {
    aside.classList.add('hide');
  }, 7000);
};
},{"./dbhelper":1,"./helpers":2,"./indexedb":3}],5:[function(require,module,exports){
'use strict';

(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        },
        set: function(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getKey',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
      if (!(funcName in Constructor.prototype)) return;

      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      if (request) {
        request.onupgradeneeded = function(event) {
          if (upgradeCallback) {
            upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
          }
        };
      }

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
    module.exports.default = module.exports;
  }
  else {
    self.idb = exp;
  }
}());

},{}]},{},[4]);
