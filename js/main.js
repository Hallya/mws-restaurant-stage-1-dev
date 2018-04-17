'use strict';

/* global DBHelper */
var restaurants = void 0;
var neighborhoods = void 0;
var cuisines = void 0;

var markers = [];

var mainContent = document.querySelector('main'),
    footer = document.querySelector('footer'),
    filterOptions = document.querySelector('.filter-options'),
    filterResultHeading = document.querySelector('.filter-options h3'),
    filterButton = document.querySelector('#menuFilter'),
    listOfRestaurants = document.querySelector('#restaurants-list'),

// sectionRestaurantsList = document.querySelector('#list-container'),
sectionMap = document.querySelector('#map-container'),
    neighborhoodsSelect = document.querySelector('#neighborhoods-select'),
    cuisinesSelect = document.querySelector('#cuisines-select'),
    mapDiv = document.querySelector('#map'),
    loader = document.querySelector('#map-loader');
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!window.navigator.standalone && window.navigator.userAgent.indexOf('AppleWebKit') > -1) {
    addToHomeScreen();
  }
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Open or close the options/filter menu.
 */
filterButton.addEventListener('click', function () {
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
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (registration) {
      console.log('registration to serviceWorker complete with scope :', registration.scope);
    });
    navigator.serviceWorker.addEventListener('message', function (event) {
      if (event.data.message === 'confirmed') {
        DBHelper.switchLoaderToMap();
        console.log('Switch done');
      }
    });
    activateLazyLoading();
  });
}

/**
 * If options/filter menu is open and enter is pressed it makes focus skip to restaurants list.
 */
document.onkeypress = function (e) {
  console.log(e.code);
  if (e.charCode === 13 && filterOptions.classList.contains('optionsOpen')) {
    closeMenu();
    console.log(sectionMap.clientHeight);
    listOfRestaurants.setAttribute('tabindex', '0');
    listOfRestaurants.focus();
    // window.scrollTo(0, sectionMap.clientHeight*2);
  }
};

function activateLazyLoading() {

  var lazyImages = [].slice.call(document.querySelectorAll('.lazy'));

  if ('IntersectionObserver' in window) {
    console.log('Starting intersectionObserver');
    var lazyImageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var lazyImage = entry.target;
          if (lazyImage.localName === 'source') {
            lazyImage.srcset = lazyImage.dataset.srcset;
          } else {
            lazyImage.src = lazyImage.dataset.src;
          }

          lazyImage.classList.remove('lazy');
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function (lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // Possibly fall back to a more compatible method here
    var _lazyImages = [].slice.call(document.querySelectorAll('.lazy'));
    var active = false;
    console.log('Starting adaptative lazy loading');
    var lazyLoad = function lazyLoad() {
      if (active === false) {
        active = true;

        setTimeout(function () {
          _lazyImages.forEach(function (lazyImage) {
            if (lazyImage.getBoundingClientRect().top <= window.innerHeight + 50 && lazyImage.getBoundingClientRect().bottom >= 0 && getComputedStyle(lazyImage).display !== "none") {
              lazyImage.src = lazyImage.dataset.src;
              lazyImage.srcset = lazyImage.dataset.srcset;
              lazyImage.classList.remove('lazy');

              _lazyImages = _lazyImages.filter(function (image) {
                return image !== lazyImage;
              });

              if (_lazyImages.length === 0) {
                document.removeEventListener('scroll', lazyLoad);
                window.removeEventListener('resize', lazyLoad);
                window.removeEventListener('orientationchange', lazyLoad);
              }
            }
          });

          active = false;
        }, 200);
      }
    };
    document.addEventListener('scroll', lazyLoad);
    window.addEventListener('resize', lazyLoad);
    window.addEventListener('orientationchange', lazyLoad);
  }
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
var fetchNeighborhoods = function fetchNeighborhoods() {
  DBHelper.fetchNeighborhoods().then(function (neighborhoods) {
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
  }).catch(function (error) {
    return console.error(error);
  });
};

/**
 * Set neighborhoods HTML.
 */
var fillNeighborhoodsHTML = function fillNeighborhoodsHTML() {
  var neighborhoods = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.neighborhoods;

  var select = neighborhoodsSelect;
  neighborhoods.forEach(function (neighborhood) {
    var option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-setsize', '4');
    option.setAttribute('aria-posinset', neighborhoods.indexOf(neighborhood) + 2);
    select.append(option);
  });
};
/**
 * Fetch all cuisines and set their HTML.
 */
var fetchCuisines = function fetchCuisines() {
  DBHelper.fetchCuisines().then(function (cuisines) {
    self.cuisines = cuisines;
    fillCuisinesHTML();
  }).catch(function (error) {
    return console.error(error);
  });
};

/**
 * Set cuisines HTML.
 */
var fillCuisinesHTML = function fillCuisinesHTML() {
  var cuisines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.cuisines;

  var select = cuisinesSelect;
  cuisines.forEach(function (cuisine) {
    var option = document.createElement('option');
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
window.initMap = function () {

  var loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  self.map.addListener('idle', function () {
    DBHelper.switchLoaderToMap();
  });
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
var updateRestaurants = function updateRestaurants() {
  var cSelect = cuisinesSelect;
  var nSelect = neighborhoodsSelect;

  var cIndex = cSelect.selectedIndex;
  var nIndex = nSelect.selectedIndex;

  var cuisine = cSelect[cIndex].value;
  var neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then(function (restaurants) {
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
  }).catch(function (error) {
    return console.error(error);
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
var resetRestaurants = function resetRestaurants(restaurants) {
  // Remove all restaurants
  self.restaurants = [];
  var ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers

  self.markers.forEach(function (m) {
    return m.setMap(null);
  });
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
var fillRestaurantsHTML = function fillRestaurantsHTML() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  var ul = document.getElementById('restaurants-list');
  restaurants.forEach(function (restaurant) {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
  console.log('Restaurants HTML filled');
  // activateLazyLoading();
  // setTimeout(() => switchLoaderToMap(), 5000);
};

/**
 * Return the average note of the restaurant.
 */
var getAverageNote = function getAverageNote(reviews) {
  var averageNote = 0;
  reviews.forEach(function (review) {
    averageNote = averageNote + Number(review.rating);
  });
  averageNote = averageNote / reviews.length;
  return Math.round(averageNote * 10) / 10;
};

/**
 * Create restaurant HTML.
 */
var createRestaurantHTML = function createRestaurantHTML(restaurant) {

  var li = document.createElement('li');
  var figure = document.createElement('figure');
  var figcaption = document.createElement('figcaption');
  var picture = document.createElement('picture');
  var source = document.createElement('source');
  var secondSource = document.createElement('source');
  var thSource = document.createElement('source');
  var sourceWebp = document.createElement('source');
  var secondSourceWebp = document.createElement('source');
  var thSourceWebp = document.createElement('source');
  var image = document.createElement('img');
  var containerNote = document.createElement('aside');
  var note = document.createElement('p');

  sourceWebp.dataset.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-large_x1.webp 1x, ' + DBHelper.imageWebpUrlForRestaurant(restaurant) + '-large_x2.webp 2x';
  sourceWebp.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-lazy.webp';
  sourceWebp.media = '(min-width: 1000px)';
  sourceWebp.className = 'lazy';
  sourceWebp.type = 'image/webp';
  source.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-large_x1.jpg 1x, ' + DBHelper.imageUrlForRestaurant(restaurant) + '-large_x2.jpg 2x';
  source.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-lazy.jpg';
  source.media = '(min-width: 1000px)';
  source.className = 'lazy';
  source.type = 'image/jpeg';

  secondSourceWebp.dataset.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-medium_x1.webp 1x, ' + DBHelper.imageWebpUrlForRestaurant(restaurant) + '-medium_x2.webp 2x';
  secondSourceWebp.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-lazy.webp';
  secondSourceWebp.media = '(min-width: 420px)';
  secondSourceWebp.className = 'lazy';
  secondSourceWebp.type = 'image/webp';
  secondSource.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-medium_x1.jpg 1x, ' + DBHelper.imageUrlForRestaurant(restaurant) + '-medium_x2.jpg 2x';
  secondSource.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-lazy.jpg';
  secondSource.media = '(min-width: 420px)';
  secondSource.className = 'lazy';
  secondSource.type = 'image/jpeg';

  thSourceWebp.dataset.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-small_x2.webp 2x, ' + DBHelper.imageWebpUrlForRestaurant(restaurant) + '-small_x1.webp 1x';
  thSourceWebp.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-lazy.webp';
  thSourceWebp.media = '(min-width: 320px)';
  thSourceWebp.className = 'lazy';
  thSourceWebp.type = 'image/webp';
  thSource.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-small_x2.jpg 2x, ' + DBHelper.imageUrlForRestaurant(restaurant) + '-small_x1.jpg 1x';
  thSource.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-lazy.jpg';
  thSource.media = '(min-width: 320px)';
  thSource.className = 'lazy';
  thSource.type = 'image/jpeg';

  image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant) + '-small_x1.jpg';
  image.src = DBHelper.imageUrlForRestaurant(restaurant) + '-lazy.jpg';
  image.className = 'restaurant-img lazy';
  image.setAttribute('sizes', '(max-width: 1100px) 85vw, (min-width: 1101px) 990px');
  image.alt = restaurant.name + '\'s restaurant';
  image.type = 'image/jpeg';

  note.innerHTML = getAverageNote(restaurant.reviews) + '/5';

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

  var name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  figcaption.append(name);

  var neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  var address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  var more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', 'View details of ' + restaurant.name);
  li.append(more);

  li.setAttribute('role', 'listitem');
  li.setAttribute('aria-setsize', '10');
  li.setAttribute('aria-posinset', restaurant.id);
  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
var addMarkersToMap = function addMarkersToMap() {
  var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

  restaurants.forEach(function (restaurant) {
    // Add marker to the map
    var marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', function () {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};

var addToHomeScreen = function addToHomeScreen() {
  var aside = document.createElement('aside');
  var note = document.createElement('p');
  var msg = document.createElement('p');
  var span = document.createElement('span');

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
  aside.addEventListener('click', function () {
    aside.classList.add('hide');
    document.getElementsByTagName('h1').focus();
    setTimeout(function () {
      aside.style = 'display: none;';
    }, 1000);
  });
  aside.append(note);
  aside.append(msg);
  aside.append(span);
  document.getElementById('maincontent').appendChild(aside);
  aside.focus();
  aside.focus();
  setTimeout(function () {
    aside.classList.add('hide');
  }, 7000);
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsicmVzdGF1cmFudHMiLCJuZWlnaGJvcmhvb2RzIiwiY3Vpc2luZXMiLCJtYXJrZXJzIiwibWFpbkNvbnRlbnQiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJmb290ZXIiLCJmaWx0ZXJPcHRpb25zIiwiZmlsdGVyUmVzdWx0SGVhZGluZyIsImZpbHRlckJ1dHRvbiIsImxpc3RPZlJlc3RhdXJhbnRzIiwic2VjdGlvbk1hcCIsIm5laWdoYm9yaG9vZHNTZWxlY3QiLCJjdWlzaW5lc1NlbGVjdCIsIm1hcERpdiIsImxvYWRlciIsImFkZEV2ZW50TGlzdGVuZXIiLCJ3aW5kb3ciLCJuYXZpZ2F0b3IiLCJzdGFuZGFsb25lIiwidXNlckFnZW50IiwiaW5kZXhPZiIsImFkZFRvSG9tZVNjcmVlbiIsImZldGNoTmVpZ2hib3Job29kcyIsImZldGNoQ3Vpc2luZXMiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsIm9wZW5NZW51IiwiY2xvc2VNZW51IiwicmVtb3ZlIiwiYWRkIiwic2V0QXR0cmlidXRlIiwiYmx1ciIsImZvY3VzIiwicmVtb3ZlQXR0cmlidXRlIiwic2VydmljZVdvcmtlciIsInJlZ2lzdGVyIiwidGhlbiIsImNvbnNvbGUiLCJsb2ciLCJyZWdpc3RyYXRpb24iLCJzY29wZSIsImV2ZW50IiwiZGF0YSIsIm1lc3NhZ2UiLCJEQkhlbHBlciIsInN3aXRjaExvYWRlclRvTWFwIiwiYWN0aXZhdGVMYXp5TG9hZGluZyIsIm9ua2V5cHJlc3MiLCJlIiwiY29kZSIsImNoYXJDb2RlIiwiY2xpZW50SGVpZ2h0IiwibGF6eUltYWdlcyIsInNsaWNlIiwiY2FsbCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJsYXp5SW1hZ2VPYnNlcnZlciIsIkludGVyc2VjdGlvbk9ic2VydmVyIiwiZW50cmllcyIsIm9ic2VydmVyIiwiZm9yRWFjaCIsImVudHJ5IiwiaXNJbnRlcnNlY3RpbmciLCJsYXp5SW1hZ2UiLCJ0YXJnZXQiLCJsb2NhbE5hbWUiLCJzcmNzZXQiLCJkYXRhc2V0Iiwic3JjIiwidW5vYnNlcnZlIiwib2JzZXJ2ZSIsImFjdGl2ZSIsImxhenlMb2FkIiwic2V0VGltZW91dCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInRvcCIsImlubmVySGVpZ2h0IiwiYm90dG9tIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImRpc3BsYXkiLCJmaWx0ZXIiLCJpbWFnZSIsImxlbmd0aCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJzZWxmIiwiZmlsbE5laWdoYm9yaG9vZHNIVE1MIiwiY2F0Y2giLCJlcnJvciIsInNlbGVjdCIsIm9wdGlvbiIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJuZWlnaGJvcmhvb2QiLCJ2YWx1ZSIsImFwcGVuZCIsImZpbGxDdWlzaW5lc0hUTUwiLCJjdWlzaW5lIiwiaW5pdE1hcCIsImxvYyIsImxhdCIsImxuZyIsIm1hcCIsImdvb2dsZSIsIm1hcHMiLCJNYXAiLCJnZXRFbGVtZW50QnlJZCIsInpvb20iLCJjZW50ZXIiLCJzY3JvbGx3aGVlbCIsImFkZExpc3RlbmVyIiwidXBkYXRlUmVzdGF1cmFudHMiLCJjU2VsZWN0IiwiblNlbGVjdCIsImNJbmRleCIsInNlbGVjdGVkSW5kZXgiLCJuSW5kZXgiLCJmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QiLCJyZXNldFJlc3RhdXJhbnRzIiwiZmlsbFJlc3RhdXJhbnRzSFRNTCIsInVsIiwibSIsInNldE1hcCIsImNyZWF0ZVJlc3RhdXJhbnRIVE1MIiwicmVzdGF1cmFudCIsImFkZE1hcmtlcnNUb01hcCIsImdldEF2ZXJhZ2VOb3RlIiwicmV2aWV3cyIsImF2ZXJhZ2VOb3RlIiwiTnVtYmVyIiwicmV2aWV3IiwicmF0aW5nIiwiTWF0aCIsInJvdW5kIiwibGkiLCJmaWd1cmUiLCJmaWdjYXB0aW9uIiwicGljdHVyZSIsInNvdXJjZSIsInNlY29uZFNvdXJjZSIsInRoU291cmNlIiwic291cmNlV2VicCIsInNlY29uZFNvdXJjZVdlYnAiLCJ0aFNvdXJjZVdlYnAiLCJjb250YWluZXJOb3RlIiwibm90ZSIsImltYWdlV2VicFVybEZvclJlc3RhdXJhbnQiLCJtZWRpYSIsImNsYXNzTmFtZSIsInR5cGUiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJhbHQiLCJuYW1lIiwiYWRkcmVzcyIsIm1vcmUiLCJocmVmIiwidXJsRm9yUmVzdGF1cmFudCIsImlkIiwibWFya2VyIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsImxvY2F0aW9uIiwidXJsIiwicHVzaCIsImFzaWRlIiwibXNnIiwic3BhbiIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwic3R5bGUiLCJhcHBlbmRDaGlsZCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBLElBQUlBLG9CQUFKO0FBQ0EsSUFBSUMsc0JBQUo7QUFDQSxJQUFJQyxpQkFBSjs7QUFFQSxJQUFJQyxVQUFVLEVBQWQ7O0FBRUEsSUFBTUMsY0FBY0MsU0FBU0MsYUFBVCxDQUF1QixNQUF2QixDQUFwQjtBQUFBLElBQ0VDLFNBQVNGLFNBQVNDLGFBQVQsQ0FBdUIsUUFBdkIsQ0FEWDtBQUFBLElBRUVFLGdCQUFnQkgsU0FBU0MsYUFBVCxDQUF1QixpQkFBdkIsQ0FGbEI7QUFBQSxJQUdFRyxzQkFBc0JKLFNBQVNDLGFBQVQsQ0FBdUIsb0JBQXZCLENBSHhCO0FBQUEsSUFJRUksZUFBZUwsU0FBU0MsYUFBVCxDQUF1QixhQUF2QixDQUpqQjtBQUFBLElBS0VLLG9CQUFvQk4sU0FBU0MsYUFBVCxDQUF1QixtQkFBdkIsQ0FMdEI7O0FBTUU7QUFDQU0sYUFBYVAsU0FBU0MsYUFBVCxDQUF1QixnQkFBdkIsQ0FQZjtBQUFBLElBUUVPLHNCQUFzQlIsU0FBU0MsYUFBVCxDQUF1Qix1QkFBdkIsQ0FSeEI7QUFBQSxJQVNFUSxpQkFBaUJULFNBQVNDLGFBQVQsQ0FBdUIsa0JBQXZCLENBVG5CO0FBQUEsSUFVRVMsU0FBU1YsU0FBU0MsYUFBVCxDQUF1QixNQUF2QixDQVZYO0FBQUEsSUFXRVUsU0FBU1gsU0FBU0MsYUFB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O0FBR0QsR0FORDtBQU9BSixRQUFNcEUsTUFBTixDQUFha0QsSUFBYjtBQUNBa0IsUUFBTXBFLE1BQU4sQ0FBYXFFLEdBQWI7QUFDQUQsUUFBTXBFLE1BQU4sQ0FBYXNFLElBQWI7QUFDQWpLLFdBQVNzRyxjQUFULENBQXdCLGFBQXhCLEVBQXVDOEQsV0FBdkMsQ0FBbURMLEtBQW5EO0FBQ0FBLFFBQU1sSSxLQUFOO0FBQ0FrSSxRQUFNbEksS0FBTjtBQUNBeUMsYUFBVyxZQUFNO0FBQ2Z5RixVQUFNMUksU0FBTixDQUFnQkssR0FBaEIsQ0FBb0IsTUFBcEI7QUFDRCxHQUZELEVBRUcsSUFGSDtBQUdELENBbkNEIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgREJIZWxwZXIgKi9cclxubGV0IHJlc3RhdXJhbnRzO1xyXG5sZXQgbmVpZ2hib3Job29kcztcclxubGV0IGN1aXNpbmVzO1xyXG5cclxudmFyIG1hcmtlcnMgPSBbXTtcclxuXHJcbmNvbnN0IG1haW5Db250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpLFxyXG4gIGZvb3RlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Zvb3RlcicpLFxyXG4gIGZpbHRlck9wdGlvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZmlsdGVyLW9wdGlvbnMnKSxcclxuICBmaWx0ZXJSZXN1bHRIZWFkaW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRlci1vcHRpb25zIGgzJyksXHJcbiAgZmlsdGVyQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21lbnVGaWx0ZXInKSxcclxuICBsaXN0T2ZSZXN0YXVyYW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyZXN0YXVyYW50cy1saXN0JyksXHJcbiAgLy8gc2VjdGlvblJlc3RhdXJhbnRzTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0LWNvbnRhaW5lcicpLFxyXG4gIHNlY3Rpb25NYXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFwLWNvbnRhaW5lcicpLFxyXG4gIG5laWdoYm9yaG9vZHNTZWxlY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbmVpZ2hib3Job29kcy1zZWxlY3QnKSxcclxuICBjdWlzaW5lc1NlbGVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjdWlzaW5lcy1zZWxlY3QnKSxcclxuICBtYXBEaXYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFwJyksXHJcbiAgbG9hZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21hcC1sb2FkZXInKTtcclxuLyoqXHJcbiAqIEZldGNoIG5laWdoYm9yaG9vZHMgYW5kIGN1aXNpbmVzIGFzIHNvb24gYXMgdGhlIHBhZ2UgaXMgbG9hZGVkLlxyXG4gKi9cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICBpZiAoIXdpbmRvdy5uYXZpZ2F0b3Iuc3RhbmRhbG9uZSAmJiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBcHBsZVdlYktpdCcpID4gLTEpIHtcclxuICAgIGFkZFRvSG9tZVNjcmVlbigpO1xyXG4gIH1cclxuICBmZXRjaE5laWdoYm9yaG9vZHMoKTtcclxuICBmZXRjaEN1aXNpbmVzKCk7XHJcbn0pO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBPcGVuIG9yIGNsb3NlIHRoZSBvcHRpb25zL2ZpbHRlciBtZW51LlxyXG4gKi9cclxuZmlsdGVyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gIGlmIChmaWx0ZXJPcHRpb25zLmNsYXNzTGlzdC5jb250YWlucygnb3B0aW9uc0Nsb3NlJykpIHtcclxuICAgIG9wZW5NZW51KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNsb3NlTWVudSgpO1xyXG4gIH1cclxufSk7XHJcbmZ1bmN0aW9uIG9wZW5NZW51KCkge1xyXG4gIGZpbHRlck9wdGlvbnMuY2xhc3NMaXN0LnJlbW92ZSgnb3B0aW9uc0Nsb3NlJyk7XHJcbiAgbWFpbkNvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZVVwJyk7XHJcbiAgZm9vdGVyLmNsYXNzTGlzdC5yZW1vdmUoJ21vdmVVcCcpO1xyXG4gIGZpbHRlck9wdGlvbnMuY2xhc3NMaXN0LmFkZCgnb3B0aW9uc09wZW4nKTtcclxuICBmaWx0ZXJPcHRpb25zLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcclxuICBtYWluQ29udGVudC5jbGFzc0xpc3QuYWRkKCdtb3ZlRG93bicpO1xyXG4gIGZvb3Rlci5jbGFzc0xpc3QuYWRkKCdtb3ZlRG93bicpO1xyXG4gIGZpbHRlckJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdwcmVzc2VkJyk7XHJcbiAgZmlsdGVyQnV0dG9uLmJsdXIoKTtcclxuICBmaWx0ZXJSZXN1bHRIZWFkaW5nLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcclxuICBmaWx0ZXJSZXN1bHRIZWFkaW5nLmZvY3VzKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsb3NlTWVudSgpIHtcclxuICBmaWx0ZXJPcHRpb25zLmNsYXNzTGlzdC5yZW1vdmUoJ29wdGlvbnNPcGVuJyk7XHJcbiAgZmlsdGVyT3B0aW9ucy5jbGFzc0xpc3QuYWRkKCdvcHRpb25zQ2xvc2UnKTtcclxuICBmaWx0ZXJPcHRpb25zLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xyXG4gIGZpbHRlckJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdwcmVzc2VkJyk7XHJcbiAgbWFpbkNvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZURvd24nKTtcclxuICBtYWluQ29udGVudC5jbGFzc0xpc3QuYWRkKCdtb3ZlVXAnKTtcclxuICBmb290ZXIuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZURvd24nKTtcclxuICBmb290ZXIuY2xhc3NMaXN0LmFkZCgnbW92ZVVwJyk7XHJcbiAgZmlsdGVyUmVzdWx0SGVhZGluZy5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZWdpc3RlciB0byBzZXJ2aWNlIHdvcmtlciBpZiB0aGUgYnJvd3NlciBpcyBjb21wYXRpYmxlLlxyXG4gKi9cclxuaWYgKCdzZXJ2aWNlV29ya2VyJyBpbiBuYXZpZ2F0b3IpIHtcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcclxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCdzdy5qcycpLnRoZW4ocmVnaXN0cmF0aW9uID0+IHtcclxuICAgICAgY29uc29sZS5sb2coJ3JlZ2lzdHJhdGlvbiB0byBzZXJ2aWNlV29ya2VyIGNvbXBsZXRlIHdpdGggc2NvcGUgOicsIHJlZ2lzdHJhdGlvbi5zY29wZSk7XHJcbiAgICB9KTtcclxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcclxuICAgICAgaWYgKGV2ZW50LmRhdGEubWVzc2FnZSA9PT0gJ2NvbmZpcm1lZCcpIHtcclxuICAgICAgICBEQkhlbHBlci5zd2l0Y2hMb2FkZXJUb01hcCgpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdTd2l0Y2ggZG9uZScpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGFjdGl2YXRlTGF6eUxvYWRpbmcoKTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJZiBvcHRpb25zL2ZpbHRlciBtZW51IGlzIG9wZW4gYW5kIGVudGVyIGlzIHByZXNzZWQgaXQgbWFrZXMgZm9jdXMgc2tpcCB0byByZXN0YXVyYW50cyBsaXN0LlxyXG4gKi9cclxuZG9jdW1lbnQub25rZXlwcmVzcyA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgY29uc29sZS5sb2coZS5jb2RlKTtcclxuICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgJiYgZmlsdGVyT3B0aW9ucy5jbGFzc0xpc3QuY29udGFpbnMoJ29wdGlvbnNPcGVuJykpIHtcclxuICAgIGNsb3NlTWVudSgpO1xyXG4gICAgY29uc29sZS5sb2coc2VjdGlvbk1hcC5jbGllbnRIZWlnaHQpO1xyXG4gICAgbGlzdE9mUmVzdGF1cmFudHMuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICcwJyk7XHJcbiAgICBsaXN0T2ZSZXN0YXVyYW50cy5mb2N1cygpO1xyXG4gICAgLy8gd2luZG93LnNjcm9sbFRvKDAsIHNlY3Rpb25NYXAuY2xpZW50SGVpZ2h0KjIpO1xyXG4gIH1cclxufTtcclxuXHJcblxyXG5cclxuZnVuY3Rpb24gYWN0aXZhdGVMYXp5TG9hZGluZygpIHtcclxuICBcclxuICB2YXIgbGF6eUltYWdlcyA9IFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmxhenknKSk7XHJcblxyXG4gIGlmICgnSW50ZXJzZWN0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdykge1xyXG4gICAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIGludGVyc2VjdGlvbk9ic2VydmVyJyk7XHJcbiAgICBsZXQgbGF6eUltYWdlT2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKGVudHJpZXMsIG9ic2VydmVyKSB7XHJcbiAgICAgIGVudHJpZXMuZm9yRWFjaChmdW5jdGlvbiAoZW50cnkpIHtcclxuICAgICAgICBpZiAoZW50cnkuaXNJbnRlcnNlY3RpbmcpIHtcclxuICAgICAgICAgIGxldCBsYXp5SW1hZ2UgPSBlbnRyeS50YXJnZXQ7XHJcbiAgICAgICAgICBpZiAobGF6eUltYWdlLmxvY2FsTmFtZSA9PT0gJ3NvdXJjZScpIHtcclxuICAgICAgICAgICAgbGF6eUltYWdlLnNyY3NldCA9IGxhenlJbWFnZS5kYXRhc2V0LnNyY3NldDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxhenlJbWFnZS5zcmMgPSBsYXp5SW1hZ2UuZGF0YXNldC5zcmM7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgbGF6eUltYWdlLmNsYXNzTGlzdC5yZW1vdmUoJ2xhenknKTtcclxuICAgICAgICAgIGxhenlJbWFnZU9ic2VydmVyLnVub2JzZXJ2ZShsYXp5SW1hZ2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBsYXp5SW1hZ2VzLmZvckVhY2goZnVuY3Rpb24gKGxhenlJbWFnZSkge1xyXG4gICAgICBsYXp5SW1hZ2VPYnNlcnZlci5vYnNlcnZlKGxhenlJbWFnZSk7XHJcbiAgICB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gUG9zc2libHkgZmFsbCBiYWNrIHRvIGEgbW9yZSBjb21wYXRpYmxlIG1ldGhvZCBoZXJlXHJcbiAgICBsZXQgbGF6eUltYWdlcyA9IFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmxhenknKSk7XHJcbiAgICBsZXQgYWN0aXZlID0gZmFsc2U7XHJcbiAgICBjb25zb2xlLmxvZygnU3RhcnRpbmcgYWRhcHRhdGl2ZSBsYXp5IGxvYWRpbmcnKTtcclxuICAgIGNvbnN0IGxhenlMb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICBpZiAoYWN0aXZlID09PSBmYWxzZSkge1xyXG4gICAgICAgIGFjdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbGF6eUltYWdlcy5mb3JFYWNoKGZ1bmN0aW9uIChsYXp5SW1hZ2UpIHtcclxuICAgICAgICAgICAgaWYgKChsYXp5SW1hZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIDw9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKyA1MCkgJiYgbGF6eUltYWdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbSA+PSAwKSAmJiBnZXRDb21wdXRlZFN0eWxlKGxhenlJbWFnZSkuZGlzcGxheSAhPT0gXCJub25lXCIpIHtcclxuICAgICAgICAgICAgICBsYXp5SW1hZ2Uuc3JjID0gbGF6eUltYWdlLmRhdGFzZXQuc3JjO1xyXG4gICAgICAgICAgICAgIGxhenlJbWFnZS5zcmNzZXQgPSBsYXp5SW1hZ2UuZGF0YXNldC5zcmNzZXQ7XHJcbiAgICAgICAgICAgICAgbGF6eUltYWdlLmNsYXNzTGlzdC5yZW1vdmUoJ2xhenknKTtcclxuXHJcbiAgICAgICAgICAgICAgbGF6eUltYWdlcyA9IGxhenlJbWFnZXMuZmlsdGVyKGZ1bmN0aW9uIChpbWFnZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGltYWdlICE9PSBsYXp5SW1hZ2U7XHJcbiAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgIGlmIChsYXp5SW1hZ2VzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgbGF6eUxvYWQpO1xyXG4gICAgICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGxhenlMb2FkKTtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIGxhenlMb2FkKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIGFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIH0sIDIwMCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBsYXp5TG9hZCk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgbGF6eUxvYWQpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgbGF6eUxvYWQpO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmZXRjaE5laWdoYm9yaG9vZHMgPSAoKSA9PiB7XHJcbiAgREJIZWxwZXIuZmV0Y2hOZWlnaGJvcmhvb2RzKClcclxuICAgIC50aGVuKG5laWdoYm9yaG9vZHMgPT4ge1xyXG4gICAgICBzZWxmLm5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzO1xyXG4gICAgICBmaWxsTmVpZ2hib3Job29kc0hUTUwoKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcihlcnJvcikpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCBuZWlnaGJvcmhvb2RzIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmaWxsTmVpZ2hib3Job29kc0hUTUwgPSAobmVpZ2hib3Job29kcyA9IHNlbGYubmVpZ2hib3Job29kcykgPT4ge1xyXG4gIGNvbnN0IHNlbGVjdCA9IG5laWdoYm9yaG9vZHNTZWxlY3Q7XHJcbiAgbmVpZ2hib3Job29kcy5mb3JFYWNoKG5laWdoYm9yaG9vZCA9PiB7XHJcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgIG9wdGlvbi5pbm5lckhUTUwgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICBvcHRpb24udmFsdWUgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdyb2xlJywgJ29wdGlvbicpO1xyXG4gICAgb3B0aW9uLnNldEF0dHJpYnV0ZSgnYXJpYS1zZXRzaXplJywgJzQnKTtcclxuICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtcG9zaW5zZXQnLCBuZWlnaGJvcmhvb2RzLmluZGV4T2YobmVpZ2hib3Job29kKSsyKTtcclxuICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICB9KTtcclxufTtcclxuLyoqXHJcbiAqIEZldGNoIGFsbCBjdWlzaW5lcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmZXRjaEN1aXNpbmVzID0gKCkgPT4ge1xyXG4gIERCSGVscGVyLmZldGNoQ3Vpc2luZXMoKVxyXG4gICAgLnRoZW4oY3Vpc2luZXMgPT4ge1xyXG4gICAgICBzZWxmLmN1aXNpbmVzID0gY3Vpc2luZXM7XHJcbiAgICAgIGZpbGxDdWlzaW5lc0hUTUwoKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcihlcnJvcikpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCBjdWlzaW5lcyBIVE1MLlxyXG4gKi9cclxuY29uc3QgZmlsbEN1aXNpbmVzSFRNTCA9IChjdWlzaW5lcyA9IHNlbGYuY3Vpc2luZXMpID0+IHtcclxuICBjb25zdCBzZWxlY3QgPSBjdWlzaW5lc1NlbGVjdDtcclxuICBjdWlzaW5lcy5mb3JFYWNoKGN1aXNpbmUgPT4ge1xyXG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XHJcbiAgICBvcHRpb24uaW5uZXJIVE1MID0gY3Vpc2luZTtcclxuICAgIG9wdGlvbi52YWx1ZSA9IGN1aXNpbmU7XHJcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdyb2xlJywgJ29wdGlvbicpO1xyXG4gICAgb3B0aW9uLnNldEF0dHJpYnV0ZSgnYXJpYS1zZXRzaXplJywgJzQnKTtcclxuICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtcG9zaW5zZXQnLCBjdWlzaW5lcy5pbmRleE9mKGN1aXNpbmUpICsgMik7XHJcbiAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBHb29nbGUgbWFwLCBjYWxsZWQgZnJvbSBIVE1MLlxyXG4gKi9cclxud2luZG93LmluaXRNYXAgPSAoKSA9PiB7XHJcblxyXG4gIGxldCBsb2MgPSB7XHJcbiAgICBsYXQ6IDQwLjcyMjIxNixcclxuICAgIGxuZzogLTczLjk4NzUwMVxyXG4gIH07XHJcbiAgc2VsZi5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKSwge1xyXG4gICAgem9vbTogMTIsXHJcbiAgICBjZW50ZXI6IGxvYyxcclxuICAgIHNjcm9sbHdoZWVsOiBmYWxzZVxyXG4gIH0pO1xyXG5cclxuICBzZWxmLm1hcC5hZGRMaXN0ZW5lcignaWRsZScsICgpID0+IHtcclxuICAgIERCSGVscGVyLnN3aXRjaExvYWRlclRvTWFwKCk7XHJcbiAgfSk7XHJcbiAgdXBkYXRlUmVzdGF1cmFudHMoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgcGFnZSBhbmQgbWFwIGZvciBjdXJyZW50IHJlc3RhdXJhbnRzLlxyXG4gKi9cclxuY29uc3QgdXBkYXRlUmVzdGF1cmFudHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY1NlbGVjdCA9IGN1aXNpbmVzU2VsZWN0O1xyXG4gIGNvbnN0IG5TZWxlY3QgPSBuZWlnaGJvcmhvb2RzU2VsZWN0O1xyXG5cclxuICBjb25zdCBjSW5kZXggPSBjU2VsZWN0LnNlbGVjdGVkSW5kZXg7XHJcbiAgY29uc3QgbkluZGV4ID0gblNlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICBjb25zdCBjdWlzaW5lID0gY1NlbGVjdFtjSW5kZXhdLnZhbHVlO1xyXG4gIGNvbnN0IG5laWdoYm9yaG9vZCA9IG5TZWxlY3RbbkluZGV4XS52YWx1ZTtcclxuXHJcbiAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZClcclxuICAgIC50aGVuKHJlc3RhdXJhbnRzID0+IHtcclxuICAgICAgcmVzZXRSZXN0YXVyYW50cyhyZXN0YXVyYW50cyk7XHJcbiAgICAgIGZpbGxSZXN0YXVyYW50c0hUTUwoKTtcclxuICAgIH0pLmNhdGNoKGVycm9yID0+IGNvbnNvbGUuZXJyb3IoZXJyb3IpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDbGVhciBjdXJyZW50IHJlc3RhdXJhbnRzLCB0aGVpciBIVE1MIGFuZCByZW1vdmUgdGhlaXIgbWFwIG1hcmtlcnMuXHJcbiAqL1xyXG5jb25zdCByZXNldFJlc3RhdXJhbnRzID0gKHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgLy8gUmVtb3ZlIGFsbCByZXN0YXVyYW50c1xyXG4gIHNlbGYucmVzdGF1cmFudHMgPSBbXTtcclxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50cy1saXN0Jyk7XHJcbiAgdWwuaW5uZXJIVE1MID0gJyc7XHJcblxyXG4gIC8vIFJlbW92ZSBhbGwgbWFwIG1hcmtlcnNcclxuXHJcbiAgc2VsZi5tYXJrZXJzLmZvckVhY2gobSA9PiBtLnNldE1hcChudWxsKSk7XHJcbiAgc2VsZi5tYXJrZXJzID0gW107XHJcbiAgc2VsZi5yZXN0YXVyYW50cyA9IHJlc3RhdXJhbnRzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbGwgcmVzdGF1cmFudHMgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5jb25zdCBmaWxsUmVzdGF1cmFudHNIVE1MID0gKHJlc3RhdXJhbnRzID0gc2VsZi5yZXN0YXVyYW50cykgPT4ge1xyXG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgdWwuYXBwZW5kKGNyZWF0ZVJlc3RhdXJhbnRIVE1MKHJlc3RhdXJhbnQpKTtcclxuICB9KTtcclxuICBhZGRNYXJrZXJzVG9NYXAoKTtcclxuICBjb25zb2xlLmxvZygnUmVzdGF1cmFudHMgSFRNTCBmaWxsZWQnKTtcclxuICAvLyBhY3RpdmF0ZUxhenlMb2FkaW5nKCk7XHJcbiAgLy8gc2V0VGltZW91dCgoKSA9PiBzd2l0Y2hMb2FkZXJUb01hcCgpLCA1MDAwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gdGhlIGF2ZXJhZ2Ugbm90ZSBvZiB0aGUgcmVzdGF1cmFudC5cclxuICovXHJcbmNvbnN0IGdldEF2ZXJhZ2VOb3RlID0gKHJldmlld3MpID0+IHtcclxuICBsZXQgYXZlcmFnZU5vdGUgPSAwO1xyXG4gIHJldmlld3MuZm9yRWFjaChyZXZpZXcgPT4ge1xyXG4gICAgYXZlcmFnZU5vdGUgPSBhdmVyYWdlTm90ZSArIE51bWJlcihyZXZpZXcucmF0aW5nKTtcclxuICB9KTtcclxuICBhdmVyYWdlTm90ZSA9IGF2ZXJhZ2VOb3RlIC8gcmV2aWV3cy5sZW5ndGg7XHJcbiAgcmV0dXJuIChNYXRoLnJvdW5kKGF2ZXJhZ2VOb3RlICogMTApKSAvIDEwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwuXHJcbiAqL1xyXG5jb25zdCBjcmVhdGVSZXN0YXVyYW50SFRNTCA9IChyZXN0YXVyYW50KSA9PiB7XHJcbiAgXHJcbiAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gIGNvbnN0IGZpZ3VyZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ZpZ3VyZScpO1xyXG4gIGNvbnN0IGZpZ2NhcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmaWdjYXB0aW9uJyk7XHJcbiAgY29uc3QgcGljdHVyZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3BpY3R1cmUnKTtcclxuICBjb25zdCBzb3VyY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcclxuICBjb25zdCBzZWNvbmRTb3VyY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcclxuICBjb25zdCB0aFNvdXJjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xyXG4gIGNvbnN0IHNvdXJjZVdlYnAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcclxuICBjb25zdCBzZWNvbmRTb3VyY2VXZWJwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XHJcbiAgY29uc3QgdGhTb3VyY2VXZWJwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XHJcbiAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICBjb25zdCBjb250YWluZXJOb3RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXNpZGUnKTtcclxuICBjb25zdCBub3RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG5cclxuICBzb3VyY2VXZWJwLmRhdGFzZXQuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGFyZ2VfeDEud2VicCAxeCwgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXJnZV94Mi53ZWJwIDJ4YDtcclxuICBzb3VyY2VXZWJwLnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhenkud2VicGA7XHJcbiAgc291cmNlV2VicC5tZWRpYSA9ICcobWluLXdpZHRoOiAxMDAwcHgpJztcclxuICBzb3VyY2VXZWJwLmNsYXNzTmFtZSA9ICdsYXp5JztcclxuICBzb3VyY2VXZWJwLnR5cGUgPSAnaW1hZ2Uvd2VicCc7XHJcbiAgc291cmNlLmRhdGFzZXQuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXJnZV94MS5qcGcgMXgsICR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXJnZV94Mi5qcGcgMnhgO1xyXG4gIHNvdXJjZS5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhenkuanBnYDtcclxuICBzb3VyY2UubWVkaWEgPSAnKG1pbi13aWR0aDogMTAwMHB4KSc7XHJcbiAgc291cmNlLmNsYXNzTmFtZSA9ICdsYXp5JztcclxuICBzb3VyY2UudHlwZSA9ICdpbWFnZS9qcGVnJztcclxuICBcclxuICBzZWNvbmRTb3VyY2VXZWJwLmRhdGFzZXQuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbWVkaXVtX3gxLndlYnAgMXgsICR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbWVkaXVtX3gyLndlYnAgMnhgO1xyXG4gIHNlY29uZFNvdXJjZVdlYnAuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGF6eS53ZWJwYDtcclxuICBzZWNvbmRTb3VyY2VXZWJwLm1lZGlhID0gJyhtaW4td2lkdGg6IDQyMHB4KSc7XHJcbiAgc2Vjb25kU291cmNlV2VicC5jbGFzc05hbWUgPSAnbGF6eSc7XHJcbiAgc2Vjb25kU291cmNlV2VicC50eXBlID0gJ2ltYWdlL3dlYnAnO1xyXG4gIHNlY29uZFNvdXJjZS5kYXRhc2V0LnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbWVkaXVtX3gxLmpwZyAxeCwgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LW1lZGl1bV94Mi5qcGcgMnhgO1xyXG4gIHNlY29uZFNvdXJjZS5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhenkuanBnYDtcclxuICBzZWNvbmRTb3VyY2UubWVkaWEgPSAnKG1pbi13aWR0aDogNDIwcHgpJztcclxuICBzZWNvbmRTb3VyY2UuY2xhc3NOYW1lID0gJ2xhenknO1xyXG4gIHNlY29uZFNvdXJjZS50eXBlID0gJ2ltYWdlL2pwZWcnO1xyXG4gIFxyXG4gIHRoU291cmNlV2VicC5kYXRhc2V0LnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LXNtYWxsX3gyLndlYnAgMngsICR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tc21hbGxfeDEud2VicCAxeGA7XHJcbiAgdGhTb3VyY2VXZWJwLnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhenkud2VicGA7XHJcbiAgdGhTb3VyY2VXZWJwLm1lZGlhID0gJyhtaW4td2lkdGg6IDMyMHB4KSc7XHJcbiAgdGhTb3VyY2VXZWJwLmNsYXNzTmFtZSA9ICdsYXp5JztcclxuICB0aFNvdXJjZVdlYnAudHlwZSA9ICdpbWFnZS93ZWJwJztcclxuICB0aFNvdXJjZS5kYXRhc2V0LnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tc21hbGxfeDIuanBnIDJ4LCAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tc21hbGxfeDEuanBnIDF4YDtcclxuICB0aFNvdXJjZS5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhenkuanBnYDtcclxuICB0aFNvdXJjZS5tZWRpYSA9ICcobWluLXdpZHRoOiAzMjBweCknO1xyXG4gIHRoU291cmNlLmNsYXNzTmFtZSA9ICdsYXp5JztcclxuICB0aFNvdXJjZS50eXBlID0gJ2ltYWdlL2pwZWcnO1xyXG4gIFxyXG4gIGltYWdlLmRhdGFzZXQuc3JjID0gYCR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1zbWFsbF94MS5qcGdgO1xyXG4gIGltYWdlLnNyYyA9IGAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGF6eS5qcGdgO1xyXG4gIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyBsYXp5JztcclxuICBpbWFnZS5zZXRBdHRyaWJ1dGUoJ3NpemVzJywgJyhtYXgtd2lkdGg6IDExMDBweCkgODV2dywgKG1pbi13aWR0aDogMTEwMXB4KSA5OTBweCcpO1xyXG4gIGltYWdlLmFsdCA9IGAke3Jlc3RhdXJhbnQubmFtZX0ncyByZXN0YXVyYW50YDtcclxuICBpbWFnZS50eXBlID0gJ2ltYWdlL2pwZWcnO1xyXG4gIFxyXG4gIG5vdGUuaW5uZXJIVE1MID0gYCR7Z2V0QXZlcmFnZU5vdGUocmVzdGF1cmFudC5yZXZpZXdzKX0vNWA7XHJcblxyXG4gIGNvbnRhaW5lck5vdGUuYXBwZW5kKG5vdGUpO1xyXG5cclxuICBwaWN0dXJlLmFwcGVuZChzb3VyY2VXZWJwKTtcclxuICBwaWN0dXJlLmFwcGVuZChzb3VyY2UpO1xyXG4gIHBpY3R1cmUuYXBwZW5kKHNlY29uZFNvdXJjZVdlYnApO1xyXG4gIHBpY3R1cmUuYXBwZW5kKHNlY29uZFNvdXJjZSk7XHJcbiAgcGljdHVyZS5hcHBlbmQodGhTb3VyY2VXZWJwKTtcclxuICBwaWN0dXJlLmFwcGVuZCh0aFNvdXJjZSk7XHJcbiAgcGljdHVyZS5hcHBlbmQoaW1hZ2UpO1xyXG4gIGZpZ3VyZS5hcHBlbmQocGljdHVyZSk7XHJcbiAgZmlndXJlLmFwcGVuZChmaWdjYXB0aW9uKTtcclxuICBcclxuICBsaS5hcHBlbmQoY29udGFpbmVyTm90ZSk7XHJcbiAgbGkuYXBwZW5kKGZpZ3VyZSk7XHJcbiAgXHJcbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gyJyk7XHJcbiAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcbiAgZmlnY2FwdGlvbi5hcHBlbmQobmFtZSk7XHJcblxyXG4gIGNvbnN0IG5laWdoYm9yaG9vZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICBuZWlnaGJvcmhvb2QuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uZWlnaGJvcmhvb2Q7XHJcbiAgbGkuYXBwZW5kKG5laWdoYm9yaG9vZCk7XHJcblxyXG4gIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgYWRkcmVzcy5pbm5lckhUTUwgPSByZXN0YXVyYW50LmFkZHJlc3M7XHJcbiAgbGkuYXBwZW5kKGFkZHJlc3MpO1xyXG5cclxuICBjb25zdCBtb3JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gIG1vcmUuaW5uZXJIVE1MID0gJ1ZpZXcgRGV0YWlscyc7XHJcbiAgbW9yZS5ocmVmID0gREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICBtb3JlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIGBWaWV3IGRldGFpbHMgb2YgJHtyZXN0YXVyYW50Lm5hbWV9YCk7XHJcbiAgbGkuYXBwZW5kKG1vcmUpO1xyXG5cclxuICBsaS5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnbGlzdGl0ZW0nKTtcclxuICBsaS5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2V0c2l6ZScsICcxMCcpO1xyXG4gIGxpLnNldEF0dHJpYnV0ZSgnYXJpYS1wb3NpbnNldCcsIHJlc3RhdXJhbnQuaWQpO1xyXG4gIHJldHVybiBsaTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGQgbWFya2VycyBmb3IgY3VycmVudCByZXN0YXVyYW50cyB0byB0aGUgbWFwLlxyXG4gKi9cclxuY29uc3QgYWRkTWFya2Vyc1RvTWFwID0gKHJlc3RhdXJhbnRzID0gc2VsZi5yZXN0YXVyYW50cykgPT4ge1xyXG4gIHJlc3RhdXJhbnRzLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICAvLyBBZGQgbWFya2VyIHRvIHRoZSBtYXBcclxuICAgIGNvbnN0IG1hcmtlciA9IERCSGVscGVyLm1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgc2VsZi5tYXApO1xyXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAnY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbWFya2VyLnVybDtcclxuICAgIH0pO1xyXG4gICAgc2VsZi5tYXJrZXJzLnB1c2gobWFya2VyKTtcclxuICB9KTtcclxufTtcclxuXHJcbmNvbnN0IGFkZFRvSG9tZVNjcmVlbiA9ICgpID0+IHtcclxuICBjb25zdCBhc2lkZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FzaWRlJyk7XHJcbiAgY29uc3Qgbm90ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICBjb25zdCBtc2cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuXHJcbiAgYXNpZGUuaWQgPSAncG9wJztcclxuICBcclxuICBhc2lkZS5jbGFzc05hbWUgPSAncG9wdXAnO1xyXG4gIG1zZy5jbGFzc05hbWUgPSAncG9wdXAgbXNnJztcclxuICBtc2cuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICcyJyk7XHJcbiAgbm90ZS5jbGFzc05hbWUgPSAncG9wdXAgbm90ZSc7XHJcbiAgbm90ZS5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJzEnKTtcclxuICBzcGFuLmNsYXNzTmFtZSA9ICdpY29uaWNmaWxsLWFycm93LWRvd24nO1xyXG4gIFxyXG4gIG5vdGUuaW5uZXJIVE1MID0gJyhUYXAgdG8gY2xvc2UpJztcclxuICBtc2cuaW5uZXJIVE1MID0gJ0FkZCA8aW1nIHNyYz1cImFzc2V0cy9pbWcvc3ZnL3NoYXJlLWFwcGxlLnN2Z1wiIGFsdD1cIlwiPiB0aGlzIGFwcCB0byB5b3VyIGhvbWUgc2NyZWVuIGFuZCBlbmpveSBpdCBhcyBhIHJlYWwgYXBwbGljYXRpb24gISc7XHJcbiAgXHJcbiAgYXNpZGUuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xyXG4gIGFzaWRlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgYXNpZGUuY2xhc3NMaXN0LmFkZCgnaGlkZScpO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2gxJykuZm9jdXMoKTtcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBhc2lkZS5zdHlsZSA9ICdkaXNwbGF5OiBub25lOyc7XHJcbiAgICB9LCAxMDAwKTtcclxuICB9KTtcclxuICBhc2lkZS5hcHBlbmQobm90ZSk7IFxyXG4gIGFzaWRlLmFwcGVuZChtc2cpO1xyXG4gIGFzaWRlLmFwcGVuZChzcGFuKTtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbmNvbnRlbnQnKS5hcHBlbmRDaGlsZChhc2lkZSk7XHJcbiAgYXNpZGUuZm9jdXMoKTtcclxuICBhc2lkZS5mb2N1cygpO1xyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgYXNpZGUuY2xhc3NMaXN0LmFkZCgnaGlkZScpO1xyXG4gIH0sIDcwMDApO1xyXG59O1xyXG4iXX0=
