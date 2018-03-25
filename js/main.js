let restaurants,
  neighborhoods,
  cuisines;

var map;
var markers = [];
const mainContent = document.querySelector('main'),
      footer = document.querySelector('footer'),
      filterOptions = document.querySelector('.filter-options'),
      filterResultHeading = document.querySelector('.filter-options h2'),
      filterButton = document.querySelector('#menuFilter'),
      listOfRestaurants = document.querySelector('#restaurants-list'),
      sectionRestaurantsList = document.querySelector('#list-container'),
      sectionMap = document.querySelector('#map-container'),
      firstSelectElement = document.querySelector('#neighborhoods-select'),
      secondSelectElement = document.querySelector('#cuisines-select');

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(registration => {
      console.log('registration to serviceWorker complete with scope :', registration.scope);
    });
  });
}

document.onkeypress = function (e) {
  console.log(e.code);
  if (e.charCode === 13 && filterOptions.classList.contains('optionsOpen') ) {
    closeMenu();
    console.log(sectionMap.clientHeight);
    listOfRestaurants.setAttribute('tabindex', '0');
    listOfRestaurants.focus();
    // window.scrollTo(0, sectionMap.clientHeight*2);
  }
}
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

filterButton.addEventListener('click', () => {
  if (filterOptions.classList.contains('optionsClose')){
    openMenu();
  } else {
    closeMenu();
  }
})

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  let value = 2;
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute("role", "option");
    option.setAttribute("aria-setsize", neighborhoods.length);
    select.append(option);
    value++;
  });
}
/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  let value = 2;
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.setAttribute("role", "option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute('aria-setsize', cuisines.length);
    select.append(option);
    value++;
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
    ul.setAttribute('aria-setsize', restaurants.length);
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const figure = document.createElement('figure');
  const figcaption = document.createElement('figcaption');
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  const ndSource = document.createElement('source');
  const thSource = document.createElement('source');
  const image = document.createElement('img');

  source.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-large_x2.jpg 2x`;
  source.media = "(min-width: 1000px)";
  
  ndSource.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x2.jpg 2x`
  ndSource.media = "(min-width: 420px)";
  
  thSource.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x2.jpg 2x, ${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg 1x`
  thSource.media = "(min-width: 320px)";
  
  image.className = 'restaurant-img';
  image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg`;
  image.setAttribute("sizes", "(max-width: 1100px) 85vw, (min-width: 1101px) 990px");
  image.alt = `${restaurant.name}'s restaurant`;
  
  picture.append(source);
  picture.append(ndSource);
  picture.append(thSource);
  picture.append(image);
  figure.append(picture);
  figure.append(figcaption);
  
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
  more.setAttribute('aria-label', `View details of ${restaurant.name}`)
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});
