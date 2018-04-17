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
            if (lazyImage.getBoundingClientRect().top <= window.innerHeight + 50 && lazyImage.getBoundingClientRect().bottom >= 0 && getComputedStyle(lazyImage).display !== 'none') {
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
    if (window.document.readyState === 'complete') {
      lazyLoad();
    }
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsicmVzdGF1cmFudHMiLCJuZWlnaGJvcmhvb2RzIiwiY3Vpc2luZXMiLCJtYXJrZXJzIiwibWFpbkNvbnRlbnQiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJmb290ZXIiLCJmaWx0ZXJPcHRpb25zIiwiZmlsdGVyUmVzdWx0SGVhZGluZyIsImZpbHRlckJ1dHRvbiIsImxpc3RPZlJlc3RhdXJhbnRzIiwic2VjdGlvbk1hcCIsIm5laWdoYm9yaG9vZHNTZWxlY3QiLCJjdWlzaW5lc1NlbGVjdCIsIm1hcERpdiIsImxvYWRlciIsImFkZEV2ZW50TGlzdGVuZXIiLCJ3aW5kb3ciLCJuYXZpZ2F0b3IiLCJzdGFuZGFsb25lIiwidXNlckFnZW50IiwiaW5kZXhPZiIsImFkZFRvSG9tZVNjcmVlbiIsImZldGNoTmVpZ2hib3Job29kcyIsImZldGNoQ3Vpc2luZXMiLCJjbGFzc0xpc3QiLCJjb250YWlucyIsIm9wZW5NZW51IiwiY2xvc2VNZW51IiwicmVtb3ZlIiwiYWRkIiwic2V0QXR0cmlidXRlIiwiYmx1ciIsImZvY3VzIiwicmVtb3ZlQXR0cmlidXRlIiwic2VydmljZVdvcmtlciIsInJlZ2lzdGVyIiwidGhlbiIsImNvbnNvbGUiLCJsb2ciLCJyZWdpc3RyYXRpb24iLCJzY29wZSIsImV2ZW50IiwiZGF0YSIsIm1lc3NhZ2UiLCJEQkhlbHBlciIsInN3aXRjaExvYWRlclRvTWFwIiwiYWN0aXZhdGVMYXp5TG9hZGluZyIsIm9ua2V5cHJlc3MiLCJlIiwiY29kZSIsImNoYXJDb2RlIiwiY2xpZW50SGVpZ2h0IiwibGF6eUltYWdlcyIsInNsaWNlIiwiY2FsbCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJsYXp5SW1hZ2VPYnNlcnZlciIsIkludGVyc2VjdGlvbk9ic2VydmVyIiwiZW50cmllcyIsIm9ic2VydmVyIiwiZm9yRWFjaCIsImVudHJ5IiwiaXNJbnRlcnNlY3RpbmciLCJsYXp5SW1hZ2UiLCJ0YXJnZXQiLCJsb2NhbE5hbWUiLCJzcmNzZXQiLCJkYXRhc2V0Iiwic3JjIiwidW5vYnNlcnZlIiwib2JzZXJ2ZSIsImFjdGl2ZSIsImxhenlMb2FkIiwic2V0VGltZW91dCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInRvcCIsImlubmVySGVpZ2h0IiwiYm90dG9tIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImRpc3BsYXkiLCJmaWx0ZXIiLCJpbWFnZSIsImxlbmd0aCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJyZWFkeVN0YXRlIiwic2VsZiIsImZpbGxOZWlnaGJvcmhvb2RzSFRNTCIsImNhdGNoIiwiZXJyb3IiLCJzZWxlY3QiLCJvcHRpb24iLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwibmVpZ2hib3Job29kIiwidmFsdWUiLCJhcHBlbmQiLCJmaWxsQ3Vpc2luZXNIVE1MIiwiY3Vpc2luZSIsImluaXRNYXAiLCJsb2MiLCJsYXQiLCJsbmciLCJtYXAiLCJnb29nbGUiLCJtYXBzIiwiTWFwIiwiZ2V0RWxlbWVudEJ5SWQiLCJ6b29tIiwiY2VudGVyIiwic2Nyb2xsd2hlZWwiLCJhZGRMaXN0ZW5lciIsInVwZGF0ZVJlc3RhdXJhbnRzIiwiY1NlbGVjdCIsIm5TZWxlY3QiLCJjSW5kZXgiLCJzZWxlY3RlZEluZGV4IiwibkluZGV4IiwiZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kIiwicmVzZXRSZXN0YXVyYW50cyIsImZpbGxSZXN0YXVyYW50c0hUTUwiLCJ1bCIsIm0iLCJzZXRNYXAiLCJjcmVhdGVSZXN0YXVyYW50SFRNTCIsInJlc3RhdXJhbnQiLCJhZGRNYXJrZXJzVG9NYXAiLCJnZXRBdmVyYWdlTm90ZSIsInJldmlld3MiLCJhdmVyYWdlTm90ZSIsIk51bWJlciIsInJldmlldyIsInJhdGluZyIsIk1hdGgiLCJyb3VuZCIsImxpIiwiZmlndXJlIiwiZmlnY2FwdGlvbiIsInBpY3R1cmUiLCJzb3VyY2UiLCJzZWNvbmRTb3VyY2UiLCJ0aFNvdXJjZSIsInNvdXJjZVdlYnAiLCJzZWNvbmRTb3VyY2VXZWJwIiwidGhTb3VyY2VXZWJwIiwiY29udGFpbmVyTm90ZSIsIm5vdGUiLCJpbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50IiwibWVkaWEiLCJjbGFzc05hbWUiLCJ0eXBlIiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50IiwiYWx0IiwibmFtZSIsImFkZHJlc3MiLCJtb3JlIiwiaHJlZiIsInVybEZvclJlc3RhdXJhbnQiLCJpZCIsIm1hcmtlciIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJsb2NhdGlvbiIsInVybCIsInB1c2giLCJhc2lkZSIsIm1zZyIsInNwYW4iLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsInN0eWxlIiwiYXBwZW5kQ2hpbGQiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQSxJQUFJQSxvQkFBSjtBQUNBLElBQUlDLHNCQUFKO0FBQ0EsSUFBSUMsaUJBQUo7O0FBRUEsSUFBSUMsVUFBVSxFQUFkOztBQUVBLElBQU1DLGNBQWNDLFNBQVNDLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBcEI7QUFBQSxJQUNFQyxTQUFTRixTQUFTQyxhQUFULENBQXVCLFFBQXZCLENBRFg7QUFBQSxJQUVFRSxnQkFBZ0JILFNBQVNDLGFBQVQsQ0FBdUIsaUJBQXZCLENBRmxCO0FBQUEsSUFHRUcsc0JBQXNCSixTQUFTQyxhQUFULENBQXVCLG9CQUF2QixDQUh4QjtBQUFBLElBSUVJLGVBQWVMLFNBQVNDLGFBQVQsQ0FBdUIsYUFBdkIsQ0FKakI7QUFBQSxJQUtFSyxvQkFBb0JOLFNBQVNDLGFBQVQsQ0FBdUIsbUJBQXZCLENBTHRCOztBQU1FO0FBQ0FNLGFBQWFQLFNBQVNDLGFBQVQsQ0FBdUIsZ0JBQXZCLENBUGY7QUFBQSxJQVFFTyxzQkFBc0JSLFNBQVNDLGFBQVQsQ0FBdUIsdUJBQXZCLENBUnhCO0FBQUEsSUFTRVEsaUJBQWlCVCxTQUFTQyxhQUFULENBQXVCLGtCQUF2QixDQVRuQjtBQUFBLElBVUVTLFNBQVNWLFNBQVNDLGFBQVQsQ0FBdUIsTUFBdkIsQ0FWWDtBQUFBLElBV0VVLFNB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QUFvQ3RJLEtBQXBDO0FBQ0F5QyxlQUFXLFlBQU07QUFDZjBGLFlBQU1JLEtBQU4sR0FBYyxnQkFBZDtBQUNELEtBRkQsRUFFRyxJQUZIO0FBR0QsR0FORDtBQU9BSixRQUFNcEUsTUFBTixDQUFha0QsSUFBYjtBQUNBa0IsUUFBTXBFLE1BQU4sQ0FBYXFFLEdBQWI7QUFDQUQsUUFBTXBFLE1BQU4sQ0FBYXNFLElBQWI7QUFDQWxLLFdBQVN1RyxjQUFULENBQXdCLGFBQXhCLEVBQXVDOEQsV0FBdkMsQ0FBbURMLEtBQW5EO0FBQ0FBLFFBQU1uSSxLQUFOO0FBQ0FtSSxRQUFNbkksS0FBTjtBQUNBeUMsYUFBVyxZQUFNO0FBQ2YwRixVQUFNM0ksU0FBTixDQUFnQkssR0FBaEIsQ0FBb0IsTUFBcEI7QUFDRCxHQUZELEVBRUcsSUFGSDtBQUdELENBbkNEIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgREJIZWxwZXIgKi9cclxubGV0IHJlc3RhdXJhbnRzO1xyXG5sZXQgbmVpZ2hib3Job29kcztcclxubGV0IGN1aXNpbmVzO1xyXG5cclxudmFyIG1hcmtlcnMgPSBbXTtcclxuXHJcbmNvbnN0IG1haW5Db250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWFpbicpLFxyXG4gIGZvb3RlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Zvb3RlcicpLFxyXG4gIGZpbHRlck9wdGlvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZmlsdGVyLW9wdGlvbnMnKSxcclxuICBmaWx0ZXJSZXN1bHRIZWFkaW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRlci1vcHRpb25zIGgzJyksXHJcbiAgZmlsdGVyQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21lbnVGaWx0ZXInKSxcclxuICBsaXN0T2ZSZXN0YXVyYW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyZXN0YXVyYW50cy1saXN0JyksXHJcbiAgLy8gc2VjdGlvblJlc3RhdXJhbnRzTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsaXN0LWNvbnRhaW5lcicpLFxyXG4gIHNlY3Rpb25NYXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFwLWNvbnRhaW5lcicpLFxyXG4gIG5laWdoYm9yaG9vZHNTZWxlY3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbmVpZ2hib3Job29kcy1zZWxlY3QnKSxcclxuICBjdWlzaW5lc1NlbGVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjdWlzaW5lcy1zZWxlY3QnKSxcclxuICBtYXBEaXYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFwJyksXHJcbiAgbG9hZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21hcC1sb2FkZXInKTtcclxuLyoqXHJcbiAqIEZldGNoIG5laWdoYm9yaG9vZHMgYW5kIGN1aXNpbmVzIGFzIHNvb24gYXMgdGhlIHBhZ2UgaXMgbG9hZGVkLlxyXG4gKi9cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICBpZiAoIXdpbmRvdy5uYXZpZ2F0b3Iuc3RhbmRhbG9uZSAmJiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBcHBsZVdlYktpdCcpID4gLTEpIHtcclxuICAgIGFkZFRvSG9tZVNjcmVlbigpO1xyXG4gIH1cclxuICBmZXRjaE5laWdoYm9yaG9vZHMoKTtcclxuICBmZXRjaEN1aXNpbmVzKCk7XHJcbn0pO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBPcGVuIG9yIGNsb3NlIHRoZSBvcHRpb25zL2ZpbHRlciBtZW51LlxyXG4gKi9cclxuZmlsdGVyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gIGlmIChmaWx0ZXJPcHRpb25zLmNsYXNzTGlzdC5jb250YWlucygnb3B0aW9uc0Nsb3NlJykpIHtcclxuICAgIG9wZW5NZW51KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNsb3NlTWVudSgpO1xyXG4gIH1cclxufSk7XHJcbmZ1bmN0aW9uIG9wZW5NZW51KCkge1xyXG4gIGZpbHRlck9wdGlvbnMuY2xhc3NMaXN0LnJlbW92ZSgnb3B0aW9uc0Nsb3NlJyk7XHJcbiAgbWFpbkNvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZVVwJyk7XHJcbiAgZm9vdGVyLmNsYXNzTGlzdC5yZW1vdmUoJ21vdmVVcCcpO1xyXG4gIGZpbHRlck9wdGlvbnMuY2xhc3NMaXN0LmFkZCgnb3B0aW9uc09wZW4nKTtcclxuICBmaWx0ZXJPcHRpb25zLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcclxuICBtYWluQ29udGVudC5jbGFzc0xpc3QuYWRkKCdtb3ZlRG93bicpO1xyXG4gIGZvb3Rlci5jbGFzc0xpc3QuYWRkKCdtb3ZlRG93bicpO1xyXG4gIGZpbHRlckJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdwcmVzc2VkJyk7XHJcbiAgZmlsdGVyQnV0dG9uLmJsdXIoKTtcclxuICBmaWx0ZXJSZXN1bHRIZWFkaW5nLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcclxuICBmaWx0ZXJSZXN1bHRIZWFkaW5nLmZvY3VzKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsb3NlTWVudSgpIHtcclxuICBmaWx0ZXJPcHRpb25zLmNsYXNzTGlzdC5yZW1vdmUoJ29wdGlvbnNPcGVuJyk7XHJcbiAgZmlsdGVyT3B0aW9ucy5jbGFzc0xpc3QuYWRkKCdvcHRpb25zQ2xvc2UnKTtcclxuICBmaWx0ZXJPcHRpb25zLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xyXG4gIGZpbHRlckJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdwcmVzc2VkJyk7XHJcbiAgbWFpbkNvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZURvd24nKTtcclxuICBtYWluQ29udGVudC5jbGFzc0xpc3QuYWRkKCdtb3ZlVXAnKTtcclxuICBmb290ZXIuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZURvd24nKTtcclxuICBmb290ZXIuY2xhc3NMaXN0LmFkZCgnbW92ZVVwJyk7XHJcbiAgZmlsdGVyUmVzdWx0SGVhZGluZy5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZWdpc3RlciB0byBzZXJ2aWNlIHdvcmtlciBpZiB0aGUgYnJvd3NlciBpcyBjb21wYXRpYmxlLlxyXG4gKi9cclxuaWYgKCdzZXJ2aWNlV29ya2VyJyBpbiBuYXZpZ2F0b3IpIHtcclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcclxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCdzdy5qcycpLnRoZW4ocmVnaXN0cmF0aW9uID0+IHtcclxuICAgICAgY29uc29sZS5sb2coJ3JlZ2lzdHJhdGlvbiB0byBzZXJ2aWNlV29ya2VyIGNvbXBsZXRlIHdpdGggc2NvcGUgOicsIHJlZ2lzdHJhdGlvbi5zY29wZSk7XHJcbiAgICB9KTtcclxuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAoZXZlbnQpID0+IHtcclxuICAgICAgaWYgKGV2ZW50LmRhdGEubWVzc2FnZSA9PT0gJ2NvbmZpcm1lZCcpIHtcclxuICAgICAgICBEQkhlbHBlci5zd2l0Y2hMb2FkZXJUb01hcCgpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdTd2l0Y2ggZG9uZScpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIGFjdGl2YXRlTGF6eUxvYWRpbmcoKTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJZiBvcHRpb25zL2ZpbHRlciBtZW51IGlzIG9wZW4gYW5kIGVudGVyIGlzIHByZXNzZWQgaXQgbWFrZXMgZm9jdXMgc2tpcCB0byByZXN0YXVyYW50cyBsaXN0LlxyXG4gKi9cclxuZG9jdW1lbnQub25rZXlwcmVzcyA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgY29uc29sZS5sb2coZS5jb2RlKTtcclxuICBpZiAoZS5jaGFyQ29kZSA9PT0gMTMgJiYgZmlsdGVyT3B0aW9ucy5jbGFzc0xpc3QuY29udGFpbnMoJ29wdGlvbnNPcGVuJykpIHtcclxuICAgIGNsb3NlTWVudSgpO1xyXG4gICAgY29uc29sZS5sb2coc2VjdGlvbk1hcC5jbGllbnRIZWlnaHQpO1xyXG4gICAgbGlzdE9mUmVzdGF1cmFudHMuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICcwJyk7XHJcbiAgICBsaXN0T2ZSZXN0YXVyYW50cy5mb2N1cygpO1xyXG4gICAgLy8gd2luZG93LnNjcm9sbFRvKDAsIHNlY3Rpb25NYXAuY2xpZW50SGVpZ2h0KjIpO1xyXG4gIH1cclxufTtcclxuXHJcblxyXG5cclxuZnVuY3Rpb24gYWN0aXZhdGVMYXp5TG9hZGluZygpIHtcclxuICBcclxuICB2YXIgbGF6eUltYWdlcyA9IFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmxhenknKSk7XHJcblxyXG4gIGlmICgnSW50ZXJzZWN0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdykge1xyXG4gICAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIGludGVyc2VjdGlvbk9ic2VydmVyJyk7XHJcbiAgICBsZXQgbGF6eUltYWdlT2JzZXJ2ZXIgPSBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKGVudHJpZXMsIG9ic2VydmVyKSB7XHJcbiAgICAgIGVudHJpZXMuZm9yRWFjaChmdW5jdGlvbiAoZW50cnkpIHtcclxuICAgICAgICBpZiAoZW50cnkuaXNJbnRlcnNlY3RpbmcpIHtcclxuICAgICAgICAgIGxldCBsYXp5SW1hZ2UgPSBlbnRyeS50YXJnZXQ7XHJcbiAgICAgICAgICBpZiAobGF6eUltYWdlLmxvY2FsTmFtZSA9PT0gJ3NvdXJjZScpIHtcclxuICAgICAgICAgICAgbGF6eUltYWdlLnNyY3NldCA9IGxhenlJbWFnZS5kYXRhc2V0LnNyY3NldDtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxhenlJbWFnZS5zcmMgPSBsYXp5SW1hZ2UuZGF0YXNldC5zcmM7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgbGF6eUltYWdlLmNsYXNzTGlzdC5yZW1vdmUoJ2xhenknKTtcclxuICAgICAgICAgIGxhenlJbWFnZU9ic2VydmVyLnVub2JzZXJ2ZShsYXp5SW1hZ2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBsYXp5SW1hZ2VzLmZvckVhY2goZnVuY3Rpb24gKGxhenlJbWFnZSkge1xyXG4gICAgICBsYXp5SW1hZ2VPYnNlcnZlci5vYnNlcnZlKGxhenlJbWFnZSk7XHJcbiAgICB9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gUG9zc2libHkgZmFsbCBiYWNrIHRvIGEgbW9yZSBjb21wYXRpYmxlIG1ldGhvZCBoZXJlXHJcbiAgICBsZXQgbGF6eUltYWdlcyA9IFtdLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmxhenknKSk7XHJcbiAgICBsZXQgYWN0aXZlID0gZmFsc2U7XHJcbiAgICBjb25zb2xlLmxvZygnU3RhcnRpbmcgYWRhcHRhdGl2ZSBsYXp5IGxvYWRpbmcnKTtcclxuICAgIGNvbnN0IGxhenlMb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICBpZiAoYWN0aXZlID09PSBmYWxzZSkge1xyXG4gICAgICAgIGFjdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbGF6eUltYWdlcy5mb3JFYWNoKGZ1bmN0aW9uIChsYXp5SW1hZ2UpIHtcclxuICAgICAgICAgICAgaWYgKChsYXp5SW1hZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wIDw9ICh3aW5kb3cuaW5uZXJIZWlnaHQgKyA1MClcclxuICAgICAgICAgICAgICAmJiBsYXp5SW1hZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuYm90dG9tID49IDApXHJcbiAgICAgICAgICAgICAgJiYgZ2V0Q29tcHV0ZWRTdHlsZShsYXp5SW1hZ2UpLmRpc3BsYXkgIT09ICdub25lJykge1xyXG4gICAgICAgICAgICAgIGxhenlJbWFnZS5zcmMgPSBsYXp5SW1hZ2UuZGF0YXNldC5zcmM7XHJcbiAgICAgICAgICAgICAgbGF6eUltYWdlLnNyY3NldCA9IGxhenlJbWFnZS5kYXRhc2V0LnNyY3NldDtcclxuICAgICAgICAgICAgICBsYXp5SW1hZ2UuY2xhc3NMaXN0LnJlbW92ZSgnbGF6eScpO1xyXG5cclxuICAgICAgICAgICAgICBsYXp5SW1hZ2VzID0gbGF6eUltYWdlcy5maWx0ZXIoZnVuY3Rpb24gKGltYWdlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaW1hZ2UgIT09IGxhenlJbWFnZTtcclxuICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgaWYgKGxhenlJbWFnZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBsYXp5TG9hZCk7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgbGF6eUxvYWQpO1xyXG4gICAgICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgbGF6eUxvYWQpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgYWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgfSwgMjAwKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGxhenlMb2FkKTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBsYXp5TG9hZCk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCBsYXp5TG9hZCk7XHJcbiAgICBpZiAod2luZG93LmRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHsgXHJcbiAgICAgIGxhenlMb2FkKCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIGFuZCBzZXQgdGhlaXIgSFRNTC5cclxuICovXHJcbmNvbnN0IGZldGNoTmVpZ2hib3Job29kcyA9ICgpID0+IHtcclxuICBEQkhlbHBlci5mZXRjaE5laWdoYm9yaG9vZHMoKVxyXG4gICAgLnRoZW4obmVpZ2hib3Job29kcyA9PiB7XHJcbiAgICAgIHNlbGYubmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHM7XHJcbiAgICAgIGZpbGxOZWlnaGJvcmhvb2RzSFRNTCgpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGVycm9yKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IG5laWdoYm9yaG9vZHMgSFRNTC5cclxuICovXHJcbmNvbnN0IGZpbGxOZWlnaGJvcmhvb2RzSFRNTCA9IChuZWlnaGJvcmhvb2RzID0gc2VsZi5uZWlnaGJvcmhvb2RzKSA9PiB7XHJcbiAgY29uc3Qgc2VsZWN0ID0gbmVpZ2hib3Job29kc1NlbGVjdDtcclxuICBuZWlnaGJvcmhvb2RzLmZvckVhY2gobmVpZ2hib3Job29kID0+IHtcclxuICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgb3B0aW9uLmlubmVySFRNTCA9IG5laWdoYm9yaG9vZDtcclxuICAgIG9wdGlvbi52YWx1ZSA9IG5laWdoYm9yaG9vZDtcclxuICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnb3B0aW9uJyk7XHJcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdhcmlhLXNldHNpemUnLCAnNCcpO1xyXG4gICAgb3B0aW9uLnNldEF0dHJpYnV0ZSgnYXJpYS1wb3NpbnNldCcsIG5laWdoYm9yaG9vZHMuaW5kZXhPZihuZWlnaGJvcmhvb2QpKzIpO1xyXG4gICAgc2VsZWN0LmFwcGVuZChvcHRpb24pO1xyXG4gIH0pO1xyXG59O1xyXG4vKipcclxuICogRmV0Y2ggYWxsIGN1aXNpbmVzIGFuZCBzZXQgdGhlaXIgSFRNTC5cclxuICovXHJcbmNvbnN0IGZldGNoQ3Vpc2luZXMgPSAoKSA9PiB7XHJcbiAgREJIZWxwZXIuZmV0Y2hDdWlzaW5lcygpXHJcbiAgICAudGhlbihjdWlzaW5lcyA9PiB7XHJcbiAgICAgIHNlbGYuY3Vpc2luZXMgPSBjdWlzaW5lcztcclxuICAgICAgZmlsbEN1aXNpbmVzSFRNTCgpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGVycm9yKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IGN1aXNpbmVzIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmaWxsQ3Vpc2luZXNIVE1MID0gKGN1aXNpbmVzID0gc2VsZi5jdWlzaW5lcykgPT4ge1xyXG4gIGNvbnN0IHNlbGVjdCA9IGN1aXNpbmVzU2VsZWN0O1xyXG4gIGN1aXNpbmVzLmZvckVhY2goY3Vpc2luZSA9PiB7XHJcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgIG9wdGlvbi5pbm5lckhUTUwgPSBjdWlzaW5lO1xyXG4gICAgb3B0aW9uLnZhbHVlID0gY3Vpc2luZTtcclxuICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnb3B0aW9uJyk7XHJcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdhcmlhLXNldHNpemUnLCAnNCcpO1xyXG4gICAgb3B0aW9uLnNldEF0dHJpYnV0ZSgnYXJpYS1wb3NpbnNldCcsIGN1aXNpbmVzLmluZGV4T2YoY3Vpc2luZSkgKyAyKTtcclxuICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIEdvb2dsZSBtYXAsIGNhbGxlZCBmcm9tIEhUTUwuXHJcbiAqL1xyXG53aW5kb3cuaW5pdE1hcCA9ICgpID0+IHtcclxuXHJcbiAgbGV0IGxvYyA9IHtcclxuICAgIGxhdDogNDAuNzIyMjE2LFxyXG4gICAgbG5nOiAtNzMuOTg3NTAxXHJcbiAgfTtcclxuICBzZWxmLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpLCB7XHJcbiAgICB6b29tOiAxMixcclxuICAgIGNlbnRlcjogbG9jLFxyXG4gICAgc2Nyb2xsd2hlZWw6IGZhbHNlXHJcbiAgfSk7XHJcblxyXG4gIHNlbGYubWFwLmFkZExpc3RlbmVyKCdpZGxlJywgKCkgPT4ge1xyXG4gICAgREJIZWxwZXIuc3dpdGNoTG9hZGVyVG9NYXAoKTtcclxuICB9KTtcclxuICB1cGRhdGVSZXN0YXVyYW50cygpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSBwYWdlIGFuZCBtYXAgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMuXHJcbiAqL1xyXG5jb25zdCB1cGRhdGVSZXN0YXVyYW50cyA9ICgpID0+IHtcclxuICBjb25zdCBjU2VsZWN0ID0gY3Vpc2luZXNTZWxlY3Q7XHJcbiAgY29uc3QgblNlbGVjdCA9IG5laWdoYm9yaG9vZHNTZWxlY3Q7XHJcblxyXG4gIGNvbnN0IGNJbmRleCA9IGNTZWxlY3Quc2VsZWN0ZWRJbmRleDtcclxuICBjb25zdCBuSW5kZXggPSBuU2VsZWN0LnNlbGVjdGVkSW5kZXg7XHJcblxyXG4gIGNvbnN0IGN1aXNpbmUgPSBjU2VsZWN0W2NJbmRleF0udmFsdWU7XHJcbiAgY29uc3QgbmVpZ2hib3Job29kID0gblNlbGVjdFtuSW5kZXhdLnZhbHVlO1xyXG5cclxuICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kKVxyXG4gICAgLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xyXG4gICAgICByZXNldFJlc3RhdXJhbnRzKHJlc3RhdXJhbnRzKTtcclxuICAgICAgZmlsbFJlc3RhdXJhbnRzSFRNTCgpO1xyXG4gICAgfSkuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcihlcnJvcikpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENsZWFyIGN1cnJlbnQgcmVzdGF1cmFudHMsIHRoZWlyIEhUTUwgYW5kIHJlbW92ZSB0aGVpciBtYXAgbWFya2Vycy5cclxuICovXHJcbmNvbnN0IHJlc2V0UmVzdGF1cmFudHMgPSAocmVzdGF1cmFudHMpID0+IHtcclxuICAvLyBSZW1vdmUgYWxsIHJlc3RhdXJhbnRzXHJcbiAgc2VsZi5yZXN0YXVyYW50cyA9IFtdO1xyXG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICB1bC5pbm5lckhUTUwgPSAnJztcclxuXHJcbiAgLy8gUmVtb3ZlIGFsbCBtYXAgbWFya2Vyc1xyXG5cclxuICBzZWxmLm1hcmtlcnMuZm9yRWFjaChtID0+IG0uc2V0TWFwKG51bGwpKTtcclxuICBzZWxmLm1hcmtlcnMgPSBbXTtcclxuICBzZWxmLnJlc3RhdXJhbnRzID0gcmVzdGF1cmFudHM7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGFsbCByZXN0YXVyYW50cyBIVE1MIGFuZCBhZGQgdGhlbSB0byB0aGUgd2VicGFnZS5cclxuICovXHJcbmNvbnN0IGZpbGxSZXN0YXVyYW50c0hUTUwgPSAocmVzdGF1cmFudHMgPSBzZWxmLnJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudHMtbGlzdCcpO1xyXG4gIHJlc3RhdXJhbnRzLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICB1bC5hcHBlbmQoY3JlYXRlUmVzdGF1cmFudEhUTUwocmVzdGF1cmFudCkpO1xyXG4gIH0pO1xyXG4gIGFkZE1hcmtlcnNUb01hcCgpO1xyXG4gIGNvbnNvbGUubG9nKCdSZXN0YXVyYW50cyBIVE1MIGZpbGxlZCcpO1xyXG4gIC8vIGFjdGl2YXRlTGF6eUxvYWRpbmcoKTtcclxuICAvLyBzZXRUaW1lb3V0KCgpID0+IHN3aXRjaExvYWRlclRvTWFwKCksIDUwMDApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybiB0aGUgYXZlcmFnZSBub3RlIG9mIHRoZSByZXN0YXVyYW50LlxyXG4gKi9cclxuY29uc3QgZ2V0QXZlcmFnZU5vdGUgPSAocmV2aWV3cykgPT4ge1xyXG4gIGxldCBhdmVyYWdlTm90ZSA9IDA7XHJcbiAgcmV2aWV3cy5mb3JFYWNoKHJldmlldyA9PiB7XHJcbiAgICBhdmVyYWdlTm90ZSA9IGF2ZXJhZ2VOb3RlICsgTnVtYmVyKHJldmlldy5yYXRpbmcpO1xyXG4gIH0pO1xyXG4gIGF2ZXJhZ2VOb3RlID0gYXZlcmFnZU5vdGUgLyByZXZpZXdzLmxlbmd0aDtcclxuICByZXR1cm4gKE1hdGgucm91bmQoYXZlcmFnZU5vdGUgKiAxMCkpIC8gMTA7XHJcbn07XHJcblxyXG4vKipcclxuICogQ3JlYXRlIHJlc3RhdXJhbnQgSFRNTC5cclxuICovXHJcbmNvbnN0IGNyZWF0ZVJlc3RhdXJhbnRIVE1MID0gKHJlc3RhdXJhbnQpID0+IHtcclxuICBcclxuICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgY29uc3QgZmlndXJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZmlndXJlJyk7XHJcbiAgY29uc3QgZmlnY2FwdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ZpZ2NhcHRpb24nKTtcclxuICBjb25zdCBwaWN0dXJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncGljdHVyZScpO1xyXG4gIGNvbnN0IHNvdXJjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xyXG4gIGNvbnN0IHNlY29uZFNvdXJjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xyXG4gIGNvbnN0IHRoU291cmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XHJcbiAgY29uc3Qgc291cmNlV2VicCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xyXG4gIGNvbnN0IHNlY29uZFNvdXJjZVdlYnAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcclxuICBjb25zdCB0aFNvdXJjZVdlYnAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcclxuICBjb25zdCBpbWFnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xyXG4gIGNvbnN0IGNvbnRhaW5lck5vdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhc2lkZScpO1xyXG4gIGNvbnN0IG5vdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcblxyXG4gIHNvdXJjZVdlYnAuZGF0YXNldC5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXJnZV94MS53ZWJwIDF4LCAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhcmdlX3gyLndlYnAgMnhgO1xyXG4gIHNvdXJjZVdlYnAuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGF6eS53ZWJwYDtcclxuICBzb3VyY2VXZWJwLm1lZGlhID0gJyhtaW4td2lkdGg6IDEwMDBweCknO1xyXG4gIHNvdXJjZVdlYnAuY2xhc3NOYW1lID0gJ2xhenknO1xyXG4gIHNvdXJjZVdlYnAudHlwZSA9ICdpbWFnZS93ZWJwJztcclxuICBzb3VyY2UuZGF0YXNldC5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhcmdlX3gxLmpwZyAxeCwgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhcmdlX3gyLmpwZyAyeGA7XHJcbiAgc291cmNlLnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGF6eS5qcGdgO1xyXG4gIHNvdXJjZS5tZWRpYSA9ICcobWluLXdpZHRoOiAxMDAwcHgpJztcclxuICBzb3VyY2UuY2xhc3NOYW1lID0gJ2xhenknO1xyXG4gIHNvdXJjZS50eXBlID0gJ2ltYWdlL2pwZWcnO1xyXG4gIFxyXG4gIHNlY29uZFNvdXJjZVdlYnAuZGF0YXNldC5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1tZWRpdW1feDEud2VicCAxeCwgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1tZWRpdW1feDIud2VicCAyeGA7XHJcbiAgc2Vjb25kU291cmNlV2VicC5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXp5LndlYnBgO1xyXG4gIHNlY29uZFNvdXJjZVdlYnAubWVkaWEgPSAnKG1pbi13aWR0aDogNDIwcHgpJztcclxuICBzZWNvbmRTb3VyY2VXZWJwLmNsYXNzTmFtZSA9ICdsYXp5JztcclxuICBzZWNvbmRTb3VyY2VXZWJwLnR5cGUgPSAnaW1hZ2Uvd2VicCc7XHJcbiAgc2Vjb25kU291cmNlLmRhdGFzZXQuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1tZWRpdW1feDEuanBnIDF4LCAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbWVkaXVtX3gyLmpwZyAyeGA7XHJcbiAgc2Vjb25kU291cmNlLnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGF6eS5qcGdgO1xyXG4gIHNlY29uZFNvdXJjZS5tZWRpYSA9ICcobWluLXdpZHRoOiA0MjBweCknO1xyXG4gIHNlY29uZFNvdXJjZS5jbGFzc05hbWUgPSAnbGF6eSc7XHJcbiAgc2Vjb25kU291cmNlLnR5cGUgPSAnaW1hZ2UvanBlZyc7XHJcbiAgXHJcbiAgdGhTb3VyY2VXZWJwLmRhdGFzZXQuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tc21hbGxfeDIud2VicCAyeCwgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1zbWFsbF94MS53ZWJwIDF4YDtcclxuICB0aFNvdXJjZVdlYnAuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGF6eS53ZWJwYDtcclxuICB0aFNvdXJjZVdlYnAubWVkaWEgPSAnKG1pbi13aWR0aDogMzIwcHgpJztcclxuICB0aFNvdXJjZVdlYnAuY2xhc3NOYW1lID0gJ2xhenknO1xyXG4gIHRoU291cmNlV2VicC50eXBlID0gJ2ltYWdlL3dlYnAnO1xyXG4gIHRoU291cmNlLmRhdGFzZXQuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1zbWFsbF94Mi5qcGcgMngsICR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1zbWFsbF94MS5qcGcgMXhgO1xyXG4gIHRoU291cmNlLnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGF6eS5qcGdgO1xyXG4gIHRoU291cmNlLm1lZGlhID0gJyhtaW4td2lkdGg6IDMyMHB4KSc7XHJcbiAgdGhTb3VyY2UuY2xhc3NOYW1lID0gJ2xhenknO1xyXG4gIHRoU291cmNlLnR5cGUgPSAnaW1hZ2UvanBlZyc7XHJcbiAgXHJcbiAgaW1hZ2UuZGF0YXNldC5zcmMgPSBgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LXNtYWxsX3gxLmpwZ2A7XHJcbiAgaW1hZ2Uuc3JjID0gYCR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXp5LmpwZ2A7XHJcbiAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nIGxhenknO1xyXG4gIGltYWdlLnNldEF0dHJpYnV0ZSgnc2l6ZXMnLCAnKG1heC13aWR0aDogMTEwMHB4KSA4NXZ3LCAobWluLXdpZHRoOiAxMTAxcHgpIDk5MHB4Jyk7XHJcbiAgaW1hZ2UuYWx0ID0gYCR7cmVzdGF1cmFudC5uYW1lfSdzIHJlc3RhdXJhbnRgO1xyXG4gIGltYWdlLnR5cGUgPSAnaW1hZ2UvanBlZyc7XHJcbiAgXHJcbiAgbm90ZS5pbm5lckhUTUwgPSBgJHtnZXRBdmVyYWdlTm90ZShyZXN0YXVyYW50LnJldmlld3MpfS81YDtcclxuXHJcbiAgY29udGFpbmVyTm90ZS5hcHBlbmQobm90ZSk7XHJcblxyXG4gIHBpY3R1cmUuYXBwZW5kKHNvdXJjZVdlYnApO1xyXG4gIHBpY3R1cmUuYXBwZW5kKHNvdXJjZSk7XHJcbiAgcGljdHVyZS5hcHBlbmQoc2Vjb25kU291cmNlV2VicCk7XHJcbiAgcGljdHVyZS5hcHBlbmQoc2Vjb25kU291cmNlKTtcclxuICBwaWN0dXJlLmFwcGVuZCh0aFNvdXJjZVdlYnApO1xyXG4gIHBpY3R1cmUuYXBwZW5kKHRoU291cmNlKTtcclxuICBwaWN0dXJlLmFwcGVuZChpbWFnZSk7XHJcbiAgZmlndXJlLmFwcGVuZChwaWN0dXJlKTtcclxuICBmaWd1cmUuYXBwZW5kKGZpZ2NhcHRpb24pO1xyXG4gIFxyXG4gIGxpLmFwcGVuZChjb250YWluZXJOb3RlKTtcclxuICBsaS5hcHBlbmQoZmlndXJlKTtcclxuICBcclxuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDInKTtcclxuICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcclxuICBmaWdjYXB0aW9uLmFwcGVuZChuYW1lKTtcclxuXHJcbiAgY29uc3QgbmVpZ2hib3Job29kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gIG5laWdoYm9yaG9vZC5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5laWdoYm9yaG9vZDtcclxuICBsaS5hcHBlbmQobmVpZ2hib3Job29kKTtcclxuXHJcbiAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICBhZGRyZXNzLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuYWRkcmVzcztcclxuICBsaS5hcHBlbmQoYWRkcmVzcyk7XHJcblxyXG4gIGNvbnN0IG1vcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgbW9yZS5pbm5lckhUTUwgPSAnVmlldyBEZXRhaWxzJztcclxuICBtb3JlLmhyZWYgPSBEQkhlbHBlci51cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpO1xyXG4gIG1vcmUuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgYFZpZXcgZGV0YWlscyBvZiAke3Jlc3RhdXJhbnQubmFtZX1gKTtcclxuICBsaS5hcHBlbmQobW9yZSk7XHJcblxyXG4gIGxpLnNldEF0dHJpYnV0ZSgncm9sZScsICdsaXN0aXRlbScpO1xyXG4gIGxpLnNldEF0dHJpYnV0ZSgnYXJpYS1zZXRzaXplJywgJzEwJyk7XHJcbiAgbGkuc2V0QXR0cmlidXRlKCdhcmlhLXBvc2luc2V0JywgcmVzdGF1cmFudC5pZCk7XHJcbiAgcmV0dXJuIGxpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZCBtYXJrZXJzIGZvciBjdXJyZW50IHJlc3RhdXJhbnRzIHRvIHRoZSBtYXAuXHJcbiAqL1xyXG5jb25zdCBhZGRNYXJrZXJzVG9NYXAgPSAocmVzdGF1cmFudHMgPSBzZWxmLnJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgIC8vIEFkZCBtYXJrZXIgdG8gdGhlIG1hcFxyXG4gICAgY29uc3QgbWFya2VyID0gREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBzZWxmLm1hcCk7XHJcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdjbGljaycsICgpID0+IHtcclxuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBtYXJrZXIudXJsO1xyXG4gICAgfSk7XHJcbiAgICBzZWxmLm1hcmtlcnMucHVzaChtYXJrZXIpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuY29uc3QgYWRkVG9Ib21lU2NyZWVuID0gKCkgPT4ge1xyXG4gIGNvbnN0IGFzaWRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXNpZGUnKTtcclxuICBjb25zdCBub3RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gIGNvbnN0IG1zZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG5cclxuICBhc2lkZS5pZCA9ICdwb3AnO1xyXG4gIFxyXG4gIGFzaWRlLmNsYXNzTmFtZSA9ICdwb3B1cCc7XHJcbiAgbXNnLmNsYXNzTmFtZSA9ICdwb3B1cCBtc2cnO1xyXG4gIG1zZy5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJzInKTtcclxuICBub3RlLmNsYXNzTmFtZSA9ICdwb3B1cCBub3RlJztcclxuICBub3RlLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMScpO1xyXG4gIHNwYW4uY2xhc3NOYW1lID0gJ2ljb25pY2ZpbGwtYXJyb3ctZG93bic7XHJcbiAgXHJcbiAgbm90ZS5pbm5lckhUTUwgPSAnKFRhcCB0byBjbG9zZSknO1xyXG4gIG1zZy5pbm5lckhUTUwgPSAnQWRkIDxpbWcgc3JjPVwiYXNzZXRzL2ltZy9zdmcvc2hhcmUtYXBwbGUuc3ZnXCIgYWx0PVwiXCI+IHRoaXMgYXBwIHRvIHlvdXIgaG9tZSBzY3JlZW4gYW5kIGVuam95IGl0IGFzIGEgcmVhbCBhcHBsaWNhdGlvbiAhJztcclxuICBcclxuICBhc2lkZS5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJy0xJyk7XHJcbiAgYXNpZGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBhc2lkZS5jbGFzc0xpc3QuYWRkKCdoaWRlJyk7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaDEnKS5mb2N1cygpO1xyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgIGFzaWRlLnN0eWxlID0gJ2Rpc3BsYXk6IG5vbmU7JztcclxuICAgIH0sIDEwMDApO1xyXG4gIH0pO1xyXG4gIGFzaWRlLmFwcGVuZChub3RlKTsgXHJcbiAgYXNpZGUuYXBwZW5kKG1zZyk7XHJcbiAgYXNpZGUuYXBwZW5kKHNwYW4pO1xyXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluY29udGVudCcpLmFwcGVuZENoaWxkKGFzaWRlKTtcclxuICBhc2lkZS5mb2N1cygpO1xyXG4gIGFzaWRlLmZvY3VzKCk7XHJcbiAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICBhc2lkZS5jbGFzc0xpc3QuYWRkKCdoaWRlJyk7XHJcbiAgfSwgNzAwMCk7XHJcbn07XHJcbiJdfQ==
