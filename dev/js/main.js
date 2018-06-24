const DBHelper =  require('./dbhelper');
const launch = require('./helpers');


let restaurants;
let neighborhoods;
let cuisines;
let loading = false;
let markers = [];
let cuisine;
let neighborhood;
let sort;

const 
  filterOptions = document.querySelector('.filter-options'),
  filterButton = document.getElementById('menuFilter'),
  listOfRestaurants = document.querySelector('#restaurants-list'),
  neighborhoodsSelect = document.querySelector('#neighborhoods-select'),
  cuisinesSelect = document.querySelector('#cuisines-select'),
  sortSelect = document.querySelector('#sort-select'),
  loader = document.querySelector('#map-loader');

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {

  updateRestaurants()
    .then(addSortOptions)
    .then(addCuisinesOptions)
    .then(addNeighborhoodsOptions)
    .catch(error => console.error(error));
});


/**
 * Open or close the options/filter menu.
 */


/**
 * Register to service worker if the browser is compatible.
 */
window.addEventListener('load', () => {
  
  if ('serviceWorker' in navigator) {
    const pathToServiceWorker = window.location.hostname === 'hallya.github.io' ? '/mws-restaurant-stage-1/sw.js' : '../sw.js'
    navigator.serviceWorker.register(pathToServiceWorker)
      .then(registration => console.log('registration to serviceWorker complete with scope :', registration.scope));
  }

  if (!window.navigator.standalone
    && window.navigator.userAgent.indexOf('Android') === -1
    && window.navigator.userAgent.indexOf('Linux') === -1
    && window.innerWidth < 550) {
      addBannerToHomeScreen();
  }

  cuisinesSelect.addEventListener('change', updateRestaurants);
  neighborhoodsSelect.addEventListener('change', updateRestaurants);
  sortSelect.addEventListener('change', updateRestaurants);

});
    
filterButton.addEventListener('click', launch.toggleMenu);

/**
 * If select/filter menu is open, press enter will make the restaurants list focus.
 */
document.onkeypress = function (e) {
  if (e.charCode === 13 && filterOptions.classList.contains('optionsOpen')) {
    closeMenu();
    listOfRestaurants.setAttribute('tabindex', '-1');
    listOfRestaurants.focus();
    document.getElementById('skip').click();
  }
};
/**
 * Fetch all neighborhoods and set their HTML.
 */
const addNeighborhoodsOptions = (restaurants = self.restaurants) => {
  self.neighborhoods = DBHelper.addNeighborhoodsOptions(restaurants);
  fillNeighborhoodsHTML();
};
/**
 * Fetch all cuisines and set their HTML.
 */
const addCuisinesOptions = (restaurants = self.restaurants) => {
  self.cuisines = DBHelper.addCuisinesOptions(restaurants);
  fillCuisinesHTML();
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

  const loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.map = new google.maps.Map(mapPlaceHolder, {
    center: loc,
    zoom: 12,
    streetViewControl: false,
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
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = cuisinesSelect;
  const nSelect = neighborhoodsSelect;
  const sSelect = sortSelect;

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const sIndex = sSelect.selectedIndex;

  if (cuisine === cSelect[cIndex].value
    && neighborhood === nSelect[nIndex].value
    && sort === sSelect[sIndex].value) {
    
    console.log('- Restaurants list already update');
    return Promise.resolve();
  }
  cuisine = cSelect[cIndex].value;
  neighborhood = nSelect[nIndex].value;
  sort = sSelect[sIndex].value;
  return DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
    .then(resetRestaurants)
    .then(sortRestaurantsBy)
    .then(generateRestaurantsHTML)
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
  return restaurants;
};

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
 * Create all restaurants HTML and add them to the webpage.
 */
function* restaurantGenerator(restaurants = self.restaurants) {
  let i = 0
  while (restaurants[i]) {
    const restaurant = createRestaurantHTML(restaurants[i]);
    yield restaurant;
    i++;
  }
}

const generateRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => ul.append(createRestaurantHTML(restaurant)));
  return launch.lazyLoading();
  // if ('IntersectionObserver' in window) {
    
  //   const options = {
  //     root: null,
  //     threshold: [0],
  //     rootMargin: "600px"
  //   }

  //   let lazyRestaurantObserver = new IntersectionObserver(function (entries, observer) {
      
  //     entries.forEach(function (entry) {
        
  //       if (entry.isIntersecting) {
          
  //         lazyRestaurantObserver.unobserve(entry.target);
          
  //         const restaurant = pushRestaurants.next();
  //         if (!restaurant.done) {
  //           ul.append(restaurant.value);
  //           lazyRestaurantObserver.observe(restaurant.value);
  //           launch.lazyLoading()
  //         }
  //       }
  //     });
  //   }, options);

  //   const pushRestaurants = restaurantGenerator()
  //   lazyRestaurantObserver.observe(listOfRestaurants)
  // }
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
  sourceWebp.srcset = 'assets/img/svg/puff.svg';
  sourceWebp.media = '(min-width: 1000px)';
  sourceWebp.className = 'lazy';
  sourceWebp.type = 'image/webp';
  source.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-large_x2.jpg 2x`;
  source.srcset = 'assets/img/svg/puff.svg';
  source.media = '(min-width: 1000px)';
  source.className = 'lazy';
  source.type = 'image/jpeg';
  
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
  thSource.className = 'lazy';
  thSource.type = 'image/jpeg';
  
  image.dataset.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg`;
  image.src = 'assets/img/svg/puff.svg';
  image.className = 'restaurant-img lazy';
  image.setAttribute('sizes', '(max-width: 1100px) 85vw, (min-width: 1101px) 990px');
  image.alt = `${restaurant.name}'s restaurant`;
  image.type = 'image/jpeg';
  
  note.innerHTML = `${restaurant.average_rating}/5`;

  containerNote.append(note);
  containerNote.id = 'container-note';

  picture.append(sourceWebp);
  picture.append(source);
  picture.append(secondSourceWebp);
  picture.append(secondSource);
  picture.append(thSourceWebp);
  picture.append(thSource);
  picture.append(image);

  const more = document.createElement('a');
  more.innerHTML = '';
  more.className = 'fontawesome-arrow-right';
  more.dataset.url = DBHelper.urlForRestaurant(restaurant);
  more.addEventListener('click', launch.goToRestaurantPage)
  more.setAttribute('aria-label', `View details of ${restaurant.name}`);
  more.setAttribute('rel', 'noopener');

  figure.append(picture);
  figcaption.append(more);
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