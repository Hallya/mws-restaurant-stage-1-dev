/* global DBHelper */
import DBHelper from './dbhelper';
import Launch from './helpers';
import { resolve } from 'url';
import { rejects } from 'assert';

let restaurants;
let neighborhoods;
let cuisines;
let loading = false;
let markers = [];
let cuisine;
let neighborhood;

const mainContent = document.querySelector('main'),
  footer = document.querySelector('footer'),
  filterOptions = document.querySelector('.filter-options'),
  filterResultHeading = document.querySelector('.filter-options h3'),
  filterButton = document.querySelector('#menuFilter'),
  listOfRestaurants = document.querySelector('#restaurants-list'),
  // sectionRestaurantsList = document.querySelector('#list-container'),
  sectionMap = document.getElementById('#map-container'),
  neighborhoodsSelect = document.querySelector('#neighborhoods-select'),
  cuisinesSelect = document.querySelector('#cuisines-select'),
  mapDiv = document.querySelector('#map'),
  loader = document.querySelector('#map-loader');
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (
    !window.navigator.standalone
    && (window.navigator.userAgent.indexOf('Android') === -1
      && window.navigator.userAgent.indexOf('Linux') === -1)
  ) {
    addBannerToHomeScreen();
  }
  cuisinesSelect.addEventListener('change', updateRestaurants);
  neighborhoodsSelect.addEventListener('change', updateRestaurants);
  fetchNeighborhoods()
    .then(fetchCuisines)
    .then(updateRestaurants)
    .catch(error => console.error(error))
});


/**
 * Open or close the options/filter menu.
 */
filterButton.addEventListener('click', () => {
  if (filterOptions.classList.contains('optionsClose')) {
    openMenu();
  } else {
    closeMenu();
  }
});
function openMenu() {
  filterOptions.classList.remove('optionsClose');
  mainContent.classList.remove('moveUp');
  footer.classList.remove('moveUp');
  filterOptions.classList.add('optionsOpen');
  filterOptions.setAttribute('aria-hidden', 'false');
  mainContent.classList.add('moveDown');
  footer.classList.add('moveDown');
  filterButton.classList.add('pressed');
  filterButton.blur();
  filterResultHeading.setAttribute('tabindex', '-1');
  filterResultHeading.focus();
}
function closeMenu() {
  filterOptions.classList.remove('optionsOpen');
  filterOptions.classList.add('optionsClose');
  filterOptions.setAttribute('aria-hidden', 'true');
  filterButton.classList.remove('pressed');
  mainContent.classList.remove('moveDown');
  mainContent.classList.add('moveUp');
  footer.classList.remove('moveDown');
  footer.classList.add('moveUp');
  filterResultHeading.removeAttribute('tabindex');
}


/**
 * Register to service worker if the browser is compatible.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const pathToServiceWorker = window.location.hostname === 'hallya.github.io' ? '/mws-restaurant-stage-1/sw.js' : '../sw.js'
    navigator.serviceWorker.register(pathToServiceWorker).then(registration => console.log('registration to serviceWorker complete with scope :', registration.scope));
  });
}


/**
 * If select/filter menu is open, press enter will make the restaurants list focus.
 */
document.onkeypress = function (e) {
  if (e.charCode === 13 && filterOptions.classList.contains('optionsOpen')) {
    closeMenu();
    listOfRestaurants.setAttribute('tabindex', '0');
    listOfRestaurants.focus();
    // window.scrollTo(0, sectionMap.clientHeight*2);
  }
};
/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  return DBHelper.fetchNeighborhoods()
    .then(neighborhoods => {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    })
    .catch(error => console.error(error));
};

/**
 * Set neighborhoods HTML.
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
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines()
    .then(cuisines => {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    })
    .catch(error => console.error(error));
};

/**
 * Set cuisines HTML.
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
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  const mapPlaceHolder = document.createElement('div');
  mapPlaceHolder.setAttribute('tabindex', '-1');
  mapPlaceHolder.setAttribute('aria-hidden', 'true');
  mapPlaceHolder.id = "map";
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(mapPlaceHolder, {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  document.getElementById('map-container').appendChild(mapPlaceHolder);
  self.map.addListener('tilesloaded', function () {
    loader.remove();
    updateRestaurants()
      .then(addMarkersToMap)
  });
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = cuisinesSelect;
  const nSelect = neighborhoodsSelect;

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  if (cuisine === cSelect[cIndex].value && neighborhood === nSelect[nIndex].value) {
    console.log('- Restaurants list already update');
    return Promise.resolve();
  }
  cuisine = cSelect[cIndex].value;
  neighborhood = nSelect[nIndex].value;

  return DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
    .then(resetRestaurants)
    .then(fillRestaurantsHTML)
    .then(Launch.lazyLoading)
    .then(() => console.log('- Restaurants list updated !'))
    .catch(error => console.error(error))
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
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
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
};

/**
 * Return the average note of the restaurant.
 */
const getAverageNote = (reviews) => {
  let averageNote = 0;
  reviews.forEach(review => {
    averageNote = averageNote + Number(review.rating);
  });
  averageNote = averageNote / reviews.length;
  return (Math.round(averageNote * 10)) / 10;
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

  sourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-large_x1.webp 1x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-large_x2.webp 2x`;
  sourceWebp.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-lazy.webp`;
  sourceWebp.media = '(min-width: 1000px)';
  sourceWebp.className = 'lazy';
  sourceWebp.type = 'image/webp';
  source.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-large_x2.jpg 2x`;
  source.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  source.media = '(min-width: 1000px)';
  source.className = 'lazy';
  source.type = 'image/jpeg';
  
  secondSourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x1.webp 1x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x2.webp 2x`;
  secondSourceWebp.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-lazy.webp`;
  secondSourceWebp.media = '(min-width: 420px)';
  secondSourceWebp.className = 'lazy';
  secondSourceWebp.type = 'image/webp';
  secondSource.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x2.jpg 2x`;
  secondSource.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  secondSource.media = '(min-width: 420px)';
  secondSource.className = 'lazy';
  secondSource.type = 'image/jpeg';
  
  thSourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x2.webp 2x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x1.webp 1x`;
  thSourceWebp.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-lazy.webp`;
  thSourceWebp.media = '(min-width: 320px)';
  thSourceWebp.className = 'lazy';
  thSourceWebp.type = 'image/webp';
  thSource.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x2.jpg 2x, ${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg 1x`;
  thSource.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  thSource.media = '(min-width: 320px)';
  thSource.className = 'lazy';
  thSource.type = 'image/jpeg';
  
  image.dataset.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg`;
  image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  image.className = 'restaurant-img lazy';
  image.setAttribute('sizes', '(max-width: 1100px) 85vw, (min-width: 1101px) 990px');
  image.alt = `${restaurant.name}'s restaurant`;
  image.type = 'image/jpeg';
  
  note.innerHTML = `${getAverageNote(restaurant.reviews)}/5`;

  containerNote.append(note);

  picture.append(sourceWebp);
  picture.append(source);
  picture.append(secondSourceWebp);
  picture.append(secondSource);
  picture.append(thSourceWebp);
  picture.append(thSource);
  picture.append(image);
  figure.append(picture);
  figure.append(figcaption);
  
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

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `View details of ${restaurant.name}`);
  more.setAttribute('rel', 'noopener');
  li.append(more);

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
  msg.setAttribute('tabindex', '2');
  note.className = 'popup note';
  note.setAttribute('tabindex', '1');
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