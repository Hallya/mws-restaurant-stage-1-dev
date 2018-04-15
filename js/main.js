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
            if (lazyImage.getBoundingClientRect().top <= window.innerHeight && lazyImage.getBoundingClientRect().bottom >= 0 && getComputedStyle(lazyImage).display !== "none") {
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
  activateLazyLoading();
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
  source.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-large_x1.jpg 1x, ' + DBHelper.imageUrlForRestaurant(restaurant) + '-large_x2.jpg 2x';
  source.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-lazy.jpg';
  source.media = '(min-width: 1000px)';
  source.className = 'lazy';

  secondSourceWebp.dataset.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-medium_x1.webp 1x, ' + DBHelper.imageWebpUrlForRestaurant(restaurant) + '-medium_x2.webp 2x';
  secondSourceWebp.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-lazy.webp';
  secondSourceWebp.media = '(min-width: 420px)';
  secondSourceWebp.className = 'lazy';
  secondSource.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-medium_x1.jpg 1x, ' + DBHelper.imageUrlForRestaurant(restaurant) + '-medium_x2.jpg 2x';
  secondSource.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-lazy.jpg';
  secondSource.media = '(min-width: 420px)';
  secondSource.className = 'lazy';

  thSourceWebp.dataset.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-small_x2.webp 2x, ' + DBHelper.imageWebpUrlForRestaurant(restaurant) + '-small_x1.webp 1x';
  thSourceWebp.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-lazy.webp';
  thSourceWebp.media = '(min-width: 320px)';
  thSourceWebp.className = 'lazy';
  thSource.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-small_x2.jpg 2x, ' + DBHelper.imageUrlForRestaurant(restaurant) + '-small_x1.jpg 1x';
  thSource.srcset = DBHelper.imageWebpUrlForRestaurant(restaurant) + '-lazy.jpg';
  thSource.media = '(min-width: 320px)';
  thSource.className = 'lazy';

  image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant) + '-small_x1.jpg';
  image.src = DBHelper.imageUrlForRestaurant(restaurant) + '-lazy.jpg';
  image.className = 'restaurant-img lazy';
  image.setAttribute('sizes', '(max-width: 1100px) 85vw, (min-width: 1101px) 990px');
  image.alt = restaurant.name + '\'s restaurant';

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsicmVzdGF1cmFudHMiLCJuZWlnaGJvcmhvb2RzIiwiY3Vpc2luZXMiLCJtYXJrZXJzIiwibWFpbkNvbnRlbnQiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJmb290ZXIiLCJmaWx0ZXJPcHRpb25zIiwiZmlsdGVyUmVzdWx0SGVhZGluZyIsImZpbHRlckJ1dHRvbiIsImxpc3RPZlJlc3RhdXJhbnRzIiwic2VjdGlvbk1hcCIsIm5laWdoYm9yaG9vZHNTZWxlY3QiLCJjdWlzaW5lc1NlbGVjdCIsIm1hcERpdiIsImxvYWRlciIsImFkZEV2ZW50TGlzdGVuZXIiLCJmZXRjaE5laWdoYm9yaG9vZHMiLCJmZXRjaEN1aXNpbmVzIiwiY2xhc3NMaXN0IiwiY29udGFpbnMiLCJvcGVuTWVudSIsImNsb3NlTWVudSIsInJlbW92ZSIsImFkZCIsInNldEF0dHJpYnV0ZSIsImJsdXIiLCJmb2N1cyIsInJlbW92ZUF0dHJpYnV0ZSIsIm5hdmlnYXRvciIsIndpbmRvdyIsInNlcnZpY2VXb3JrZXIiLCJyZWdpc3RlciIsInRoZW4iLCJjb25zb2xlIiwibG9nIiwicmVnaXN0cmF0aW9uIiwic2NvcGUiLCJldmVudCIsImRhdGEiLCJtZXNzYWdlIiwiREJIZWxwZXIiLCJzd2l0Y2hMb2FkZXJUb01hcCIsIm9ua2V5cHJlc3MiLCJlIiwiY29kZSIsImNoYXJDb2RlIiwiY2xpZW50SGVpZ2h0IiwiYWN0aXZhdGVMYXp5TG9hZGluZyIsImxhenlJbWFnZXMiLCJzbGljZSIsImNhbGwiLCJxdWVyeVNlbGVjdG9yQWxsIiwibGF6eUltYWdlT2JzZXJ2ZXIiLCJJbnRlcnNlY3Rpb25PYnNlcnZlciIsImVudHJpZXMiLCJvYnNlcnZlciIsImZvckVhY2giLCJlbnRyeSIsImlzSW50ZXJzZWN0aW5nIiwibGF6eUltYWdlIiwidGFyZ2V0IiwibG9jYWxOYW1lIiwic3Jjc2V0IiwiZGF0YXNldCIsInNyYyIsInVub2JzZXJ2ZSIsIm9ic2VydmUiLCJhY3RpdmUiLCJsYXp5TG9hZCIsInNldFRpbWVvdXQiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ0b3AiLCJpbm5lckhlaWdodCIsImJvdHRvbSIsImdldENvbXB1dGVkU3R5bGUiLCJkaXNwbGF5IiwiZmlsdGVyIiwiaW1hZ2UiLCJsZW5ndGgiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwic2VsZiIsImZpbGxOZWlnaGJvcmhvb2RzSFRNTCIsImNhdGNoIiwiZXJyb3IiLCJzZWxlY3QiLCJvcHRpb24iLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwibmVpZ2hib3Job29kIiwidmFsdWUiLCJpbmRleE9mIiwiYXBwZW5kIiwiZmlsbEN1aXNpbmVzSFRNTCIsImN1aXNpbmUiLCJpbml0TWFwIiwibG9jIiwibGF0IiwibG5nIiwibWFwIiwiZ29vZ2xlIiwibWFwcyIsIk1hcCIsImdldEVsZW1lbnRCeUlkIiwiem9vbSIsImNlbnRlciIsInNjcm9sbHdoZWVsIiwiYWRkTGlzdGVuZXIiLCJ1cGRhdGVSZXN0YXVyYW50cyIsImNTZWxlY3QiLCJuU2VsZWN0IiwiY0luZGV4Iiwic2VsZWN0ZWRJbmRleCIsIm5JbmRleCIsImZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZCIsInJlc2V0UmVzdGF1cmFudHMiLCJmaWxsUmVzdGF1cmFudHNIVE1MIiwidWwiLCJtIiwic2V0TWFwIiwiY3JlYXRlUmVzdGF1cmFudEhUTUwiLCJyZXN0YXVyYW50IiwiYWRkTWFya2Vyc1RvTWFwIiwiZ2V0QXZlcmFnZU5vdGUiLCJyZXZpZXdzIiwiYXZlcmFnZU5vdGUiLCJOdW1iZXIiLCJyZXZpZXciLCJyYXRpbmciLCJNYXRoIiwicm91bmQiLCJsaSIsImZpZ3VyZSIsImZpZ2NhcHRpb24iLCJwaWN0dXJlIiwic291cmNlIiwic2Vjb25kU291cmNlIiwidGhTb3VyY2UiLCJzb3VyY2VXZWJwIiwic2Vjb25kU291cmNlV2VicCIsInRoU291cmNlV2VicCIsImNvbnRhaW5lck5vdGUiLCJub3RlIiwiaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudCIsIm1lZGlhIiwiY2xhc3NOYW1lIiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50IiwiYWx0IiwibmFtZSIsImFkZHJlc3MiLCJtb3JlIiwiaHJlZiIsInVybEZvclJlc3RhdXJhbnQiLCJpZCIsIm1hcmtlciIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJsb2NhdGlvbiIsInVybCIsInB1c2giXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQSxJQUFJQSxvQkFBSjtBQUNBLElBQUlDLHNCQUFKO0FBQ0EsSUFBSUMsaUJBQUo7O0FBRUEsSUFBSUMsVUFBVSxFQUFkOztBQUVBLElBQU1DLGNBQWNDLFNBQVNDLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBcEI7QUFBQSxJQUNFQyxTQUFTRixTQUFTQyxhQUFULENBQXVCLFFBQXZCLENBRFg7QUFBQSxJQUVFRSxnQkFBZ0JILFNBQVNDLGFBQVQsQ0FBdUIsaUJBQXZCLENBRmxCO0FBQUEsSUFHRUcsc0JBQXNCSixTQUFTQyxhQUFULENBQXVCLG9CQUF2QixDQUh4QjtBQUFBLElBSUVJLGVBQWVMLFNBQVNDLGFBQVQsQ0FBdUIsYUFBdkIsQ0FKakI7QUFBQSxJQUtFSyxvQkFBb0JOLFNBQVNDLGFBQVQsQ0FBdUIsbUJBQXZCLENBTHRCOztBQU1FO0FBQ0FNLGFBQWFQLFNBQVNDLGFBQVQsQ0FBdUIsZ0JBQXZCLENBUGY7QUFBQSxJQVFFTyxzQkFBc0JSLFNBQVNDLGFBQVQsQ0FBdUIsdUJBQXZCLENBUnhCO0FBQUEsSUFTRVEsaUJBQWlCVCxTQUFTQyxhQUFULENBQXVCLGtCQUF2QixDQVRuQjtBQUFBLElBVUVTLFNBQVNWLFNBQVNDLGFBQVQsQ0FBdUIsTUFBdkIsQ0FWWDtBQUFBLElBV0VVLFNBQVNYLFNBQVNDLGFBQVQsQ0FBdUIsYUFBdkIsQ0FYWDtBQVlBOzs7QUFHQUQsU0FBU1ksZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFlBQU07O0FBRWxEQztBQUNBQztBQUNELENBSkQ7O0FBT0E7OztBQUdBVCxhQUFhTyxnQkFB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QixVQUF4QjtBQUNBMEcsS0FBRzFHLFlBQUgsQ0FBZ0IsY0FBaEIsRUFBZ0MsSUFBaEM7QUFDQTBHLEtBQUcxRyxZQUFILENBQWdCLGVBQWhCLEVBQWlDZ0csV0FBV2dDLEVBQTVDO0FBQ0EsU0FBT3RCLEVBQVA7QUFDRCxDQXhGRDs7QUEwRkE7OztBQUdBLElBQU1ULGtCQUFrQixTQUFsQkEsZUFBa0IsR0FBb0M7QUFBQSxNQUFuQzNILFdBQW1DLHVFQUFyQmtGLEtBQUtsRixXQUFnQjs7QUFDMURBLGNBQVkwRCxPQUFaLENBQW9CLHNCQUFjO0FBQ2hDO0FBQ0EsUUFBTWlHLFNBQVNqSCxTQUFTa0gsc0JBQVQsQ0FBZ0NsQyxVQUFoQyxFQUE0Q3hDLEtBQUtrQixHQUFqRCxDQUFmO0FBQ0FDLFdBQU9DLElBQVAsQ0FBWS9ELEtBQVosQ0FBa0JxRSxXQUFsQixDQUE4QitDLE1BQTlCLEVBQXNDLE9BQXRDLEVBQStDLFlBQU07QUFDbkQ1SCxhQUFPOEgsUUFBUCxDQUFnQkwsSUFBaEIsR0FBdUJHLE9BQU9HLEdBQTlCO0FBQ0QsS0FGRDtBQUdBNUUsU0FBSy9FLE9BQUwsQ0FBYTRKLElBQWIsQ0FBa0JKLE1BQWxCO0FBQ0QsR0FQRDtBQVFELENBVEQiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBEQkhlbHBlciAqL1xyXG5sZXQgcmVzdGF1cmFudHM7XHJcbmxldCBuZWlnaGJvcmhvb2RzO1xyXG5sZXQgY3Vpc2luZXM7XHJcblxyXG52YXIgbWFya2VycyA9IFtdO1xyXG5cclxuY29uc3QgbWFpbkNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyksXHJcbiAgZm9vdGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9vdGVyJyksXHJcbiAgZmlsdGVyT3B0aW9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5maWx0ZXItb3B0aW9ucycpLFxyXG4gIGZpbHRlclJlc3VsdEhlYWRpbmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZmlsdGVyLW9wdGlvbnMgaDMnKSxcclxuICBmaWx0ZXJCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVudUZpbHRlcicpLFxyXG4gIGxpc3RPZlJlc3RhdXJhbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Jlc3RhdXJhbnRzLWxpc3QnKSxcclxuICAvLyBzZWN0aW9uUmVzdGF1cmFudHNMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QtY29udGFpbmVyJyksXHJcbiAgc2VjdGlvbk1hcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYXAtY29udGFpbmVyJyksXHJcbiAgbmVpZ2hib3Job29kc1NlbGVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZWlnaGJvcmhvb2RzLXNlbGVjdCcpLFxyXG4gIGN1aXNpbmVzU2VsZWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2N1aXNpbmVzLXNlbGVjdCcpLFxyXG4gIG1hcERpdiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYXAnKSxcclxuICBsb2FkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFwLWxvYWRlcicpO1xyXG4vKipcclxuICogRmV0Y2ggbmVpZ2hib3Job29kcyBhbmQgY3Vpc2luZXMgYXMgc29vbiBhcyB0aGUgcGFnZSBpcyBsb2FkZWQuXHJcbiAqL1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gIFxyXG4gIGZldGNoTmVpZ2hib3Job29kcygpO1xyXG4gIGZldGNoQ3Vpc2luZXMoKTtcclxufSk7XHJcblxyXG5cclxuLyoqXHJcbiAqIE9wZW4gb3IgY2xvc2UgdGhlIG9wdGlvbnMvZmlsdGVyIG1lbnUuXHJcbiAqL1xyXG5maWx0ZXJCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgaWYgKGZpbHRlck9wdGlvbnMuY2xhc3NMaXN0LmNvbnRhaW5zKCdvcHRpb25zQ2xvc2UnKSkge1xyXG4gICAgb3Blbk1lbnUoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgY2xvc2VNZW51KCk7XHJcbiAgfVxyXG59KTtcclxuZnVuY3Rpb24gb3Blbk1lbnUoKSB7XHJcbiAgZmlsdGVyT3B0aW9ucy5jbGFzc0xpc3QucmVtb3ZlKCdvcHRpb25zQ2xvc2UnKTtcclxuICBtYWluQ29udGVudC5jbGFzc0xpc3QucmVtb3ZlKCdtb3ZlVXAnKTtcclxuICBmb290ZXIuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZVVwJyk7XHJcbiAgZmlsdGVyT3B0aW9ucy5jbGFzc0xpc3QuYWRkKCdvcHRpb25zT3BlbicpO1xyXG4gIGZpbHRlck9wdGlvbnMuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xyXG4gIG1haW5Db250ZW50LmNsYXNzTGlzdC5hZGQoJ21vdmVEb3duJyk7XHJcbiAgZm9vdGVyLmNsYXNzTGlzdC5hZGQoJ21vdmVEb3duJyk7XHJcbiAgZmlsdGVyQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3ByZXNzZWQnKTtcclxuICBmaWx0ZXJCdXR0b24uYmx1cigpO1xyXG4gIGZpbHRlclJlc3VsdEhlYWRpbmcuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICctMScpO1xyXG4gIGZpbHRlclJlc3VsdEhlYWRpbmcuZm9jdXMoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xvc2VNZW51KCkge1xyXG4gIGZpbHRlck9wdGlvbnMuY2xhc3NMaXN0LnJlbW92ZSgnb3B0aW9uc09wZW4nKTtcclxuICBmaWx0ZXJPcHRpb25zLmNsYXNzTGlzdC5hZGQoJ29wdGlvbnNDbG9zZScpO1xyXG4gIGZpbHRlck9wdGlvbnMuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XHJcbiAgZmlsdGVyQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ3ByZXNzZWQnKTtcclxuICBtYWluQ29udGVudC5jbGFzc0xpc3QucmVtb3ZlKCdtb3ZlRG93bicpO1xyXG4gIG1haW5Db250ZW50LmNsYXNzTGlzdC5hZGQoJ21vdmVVcCcpO1xyXG4gIGZvb3Rlci5jbGFzc0xpc3QucmVtb3ZlKCdtb3ZlRG93bicpO1xyXG4gIGZvb3Rlci5jbGFzc0xpc3QuYWRkKCdtb3ZlVXAnKTtcclxuICBmaWx0ZXJSZXN1bHRIZWFkaW5nLnJlbW92ZUF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlZ2lzdGVyIHRvIHNlcnZpY2Ugd29ya2VyIGlmIHRoZSBicm93c2VyIGlzIGNvbXBhdGlibGUuXHJcbiAqL1xyXG5pZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xyXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xyXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJ3N3LmpzJykudGhlbihyZWdpc3RyYXRpb24gPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZygncmVnaXN0cmF0aW9uIHRvIHNlcnZpY2VXb3JrZXIgY29tcGxldGUgd2l0aCBzY29wZSA6JywgcmVnaXN0cmF0aW9uLnNjb3BlKTtcclxuICAgIH0pO1xyXG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChldmVudCkgPT4ge1xyXG4gICAgICBpZiAoZXZlbnQuZGF0YS5tZXNzYWdlID09PSAnY29uZmlybWVkJykge1xyXG4gICAgICAgIERCSGVscGVyLnN3aXRjaExvYWRlclRvTWFwKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1N3aXRjaCBkb25lJyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIElmIG9wdGlvbnMvZmlsdGVyIG1lbnUgaXMgb3BlbiBhbmQgZW50ZXIgaXMgcHJlc3NlZCBpdCBtYWtlcyBmb2N1cyBza2lwIHRvIHJlc3RhdXJhbnRzIGxpc3QuXHJcbiAqL1xyXG5kb2N1bWVudC5vbmtleXByZXNzID0gZnVuY3Rpb24gKGUpIHtcclxuICBjb25zb2xlLmxvZyhlLmNvZGUpO1xyXG4gIGlmIChlLmNoYXJDb2RlID09PSAxMyAmJiBmaWx0ZXJPcHRpb25zLmNsYXNzTGlzdC5jb250YWlucygnb3B0aW9uc09wZW4nKSkge1xyXG4gICAgY2xvc2VNZW51KCk7XHJcbiAgICBjb25zb2xlLmxvZyhzZWN0aW9uTWFwLmNsaWVudEhlaWdodCk7XHJcbiAgICBsaXN0T2ZSZXN0YXVyYW50cy5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJzAnKTtcclxuICAgIGxpc3RPZlJlc3RhdXJhbnRzLmZvY3VzKCk7XHJcbiAgICAvLyB3aW5kb3cuc2Nyb2xsVG8oMCwgc2VjdGlvbk1hcC5jbGllbnRIZWlnaHQqMik7XHJcbiAgfVxyXG59O1xyXG5cclxuXHJcblxyXG5mdW5jdGlvbiBhY3RpdmF0ZUxhenlMb2FkaW5nKCkge1xyXG4gIFxyXG4gIHZhciBsYXp5SW1hZ2VzID0gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubGF6eScpKTtcclxuXHJcbiAgXHJcbiAgaWYgKCdJbnRlcnNlY3Rpb25PYnNlcnZlcicgaW4gd2luZG93KSB7XHJcbiAgICBjb25zb2xlLmxvZygnU3RhcnRpbmcgaW50ZXJzZWN0aW9uT2JzZXJ2ZXInKTtcclxuICAgIGxldCBsYXp5SW1hZ2VPYnNlcnZlciA9IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihmdW5jdGlvbiAoZW50cmllcywgb2JzZXJ2ZXIpIHtcclxuICAgICAgZW50cmllcy5mb3JFYWNoKGZ1bmN0aW9uIChlbnRyeSkge1xyXG4gICAgICAgIGlmIChlbnRyeS5pc0ludGVyc2VjdGluZykge1xyXG4gICAgICAgICAgbGV0IGxhenlJbWFnZSA9IGVudHJ5LnRhcmdldDtcclxuICAgICAgICAgIGlmIChsYXp5SW1hZ2UubG9jYWxOYW1lID09PSAnc291cmNlJykge1xyXG4gICAgICAgICAgICBsYXp5SW1hZ2Uuc3Jjc2V0ID0gbGF6eUltYWdlLmRhdGFzZXQuc3Jjc2V0O1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGF6eUltYWdlLnNyYyA9IGxhenlJbWFnZS5kYXRhc2V0LnNyYztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBsYXp5SW1hZ2UuY2xhc3NMaXN0LnJlbW92ZSgnbGF6eScpO1xyXG4gICAgICAgICAgbGF6eUltYWdlT2JzZXJ2ZXIudW5vYnNlcnZlKGxhenlJbWFnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGxhenlJbWFnZXMuZm9yRWFjaChmdW5jdGlvbiAobGF6eUltYWdlKSB7XHJcbiAgICAgIGxhenlJbWFnZU9ic2VydmVyLm9ic2VydmUobGF6eUltYWdlKTtcclxuICAgIH0pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBQb3NzaWJseSBmYWxsIGJhY2sgdG8gYSBtb3JlIGNvbXBhdGlibGUgbWV0aG9kIGhlcmVcclxuICAgIGxldCBsYXp5SW1hZ2VzID0gW10uc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubGF6eScpKTtcclxuICAgIGxldCBhY3RpdmUgPSBmYWxzZTtcclxuICAgIGNvbnNvbGUubG9nKCdTdGFydGluZyBhZGFwdGF0aXZlIGxhenkgbG9hZGluZycpO1xyXG4gICAgY29uc3QgbGF6eUxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGlmIChhY3RpdmUgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBsYXp5SW1hZ2VzLmZvckVhY2goZnVuY3Rpb24gKGxhenlJbWFnZSkge1xyXG4gICAgICAgICAgICBpZiAoKGxhenlJbWFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3AgPD0gd2luZG93LmlubmVySGVpZ2h0ICYmIGxhenlJbWFnZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5ib3R0b20gPj0gMCkgJiYgZ2V0Q29tcHV0ZWRTdHlsZShsYXp5SW1hZ2UpLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7XHJcbiAgICAgICAgICAgICAgbGF6eUltYWdlLnNyYyA9IGxhenlJbWFnZS5kYXRhc2V0LnNyYztcclxuICAgICAgICAgICAgICBsYXp5SW1hZ2Uuc3Jjc2V0ID0gbGF6eUltYWdlLmRhdGFzZXQuc3Jjc2V0O1xyXG4gICAgICAgICAgICAgIGxhenlJbWFnZS5jbGFzc0xpc3QucmVtb3ZlKCdsYXp5Jyk7XHJcblxyXG4gICAgICAgICAgICAgIGxhenlJbWFnZXMgPSBsYXp5SW1hZ2VzLmZpbHRlcihmdW5jdGlvbiAoaW1hZ2UpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBpbWFnZSAhPT0gbGF6eUltYWdlO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICBpZiAobGF6eUltYWdlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGxhenlMb2FkKTtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCBsYXp5TG9hZCk7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCBsYXp5TG9hZCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBhY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICB9LCAyMDApO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgbGF6eUxvYWQpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGxhenlMb2FkKTtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIGxhenlMb2FkKTtcclxuICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgYW5kIHNldCB0aGVpciBIVE1MLlxyXG4gKi9cclxuY29uc3QgZmV0Y2hOZWlnaGJvcmhvb2RzID0gKCkgPT4ge1xyXG4gIERCSGVscGVyLmZldGNoTmVpZ2hib3Job29kcygpXHJcbiAgICAudGhlbihuZWlnaGJvcmhvb2RzID0+IHtcclxuICAgICAgc2VsZi5uZWlnaGJvcmhvb2RzID0gbmVpZ2hib3Job29kcztcclxuICAgICAgZmlsbE5laWdoYm9yaG9vZHNIVE1MKCk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVycm9yID0+IGNvbnNvbGUuZXJyb3IoZXJyb3IpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgbmVpZ2hib3Job29kcyBIVE1MLlxyXG4gKi9cclxuY29uc3QgZmlsbE5laWdoYm9yaG9vZHNIVE1MID0gKG5laWdoYm9yaG9vZHMgPSBzZWxmLm5laWdoYm9yaG9vZHMpID0+IHtcclxuICBjb25zdCBzZWxlY3QgPSBuZWlnaGJvcmhvb2RzU2VsZWN0O1xyXG4gIG5laWdoYm9yaG9vZHMuZm9yRWFjaChuZWlnaGJvcmhvb2QgPT4ge1xyXG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XHJcbiAgICBvcHRpb24uaW5uZXJIVE1MID0gbmVpZ2hib3Job29kO1xyXG4gICAgb3B0aW9uLnZhbHVlID0gbmVpZ2hib3Job29kO1xyXG4gICAgb3B0aW9uLnNldEF0dHJpYnV0ZSgncm9sZScsICdvcHRpb24nKTtcclxuICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2V0c2l6ZScsICc0Jyk7XHJcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdhcmlhLXBvc2luc2V0JywgbmVpZ2hib3Job29kcy5pbmRleE9mKG5laWdoYm9yaG9vZCkrMik7XHJcbiAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XHJcbiAgfSk7XHJcbn07XHJcbi8qKlxyXG4gKiBGZXRjaCBhbGwgY3Vpc2luZXMgYW5kIHNldCB0aGVpciBIVE1MLlxyXG4gKi9cclxuY29uc3QgZmV0Y2hDdWlzaW5lcyA9ICgpID0+IHtcclxuICBEQkhlbHBlci5mZXRjaEN1aXNpbmVzKClcclxuICAgIC50aGVuKGN1aXNpbmVzID0+IHtcclxuICAgICAgc2VsZi5jdWlzaW5lcyA9IGN1aXNpbmVzO1xyXG4gICAgICBmaWxsQ3Vpc2luZXNIVE1MKCk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVycm9yID0+IGNvbnNvbGUuZXJyb3IoZXJyb3IpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgY3Vpc2luZXMgSFRNTC5cclxuICovXHJcbmNvbnN0IGZpbGxDdWlzaW5lc0hUTUwgPSAoY3Vpc2luZXMgPSBzZWxmLmN1aXNpbmVzKSA9PiB7XHJcbiAgY29uc3Qgc2VsZWN0ID0gY3Vpc2luZXNTZWxlY3Q7XHJcbiAgY3Vpc2luZXMuZm9yRWFjaChjdWlzaW5lID0+IHtcclxuICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xyXG4gICAgb3B0aW9uLmlubmVySFRNTCA9IGN1aXNpbmU7XHJcbiAgICBvcHRpb24udmFsdWUgPSBjdWlzaW5lO1xyXG4gICAgb3B0aW9uLnNldEF0dHJpYnV0ZSgncm9sZScsICdvcHRpb24nKTtcclxuICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2V0c2l6ZScsICc0Jyk7XHJcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdhcmlhLXBvc2luc2V0JywgY3Vpc2luZXMuaW5kZXhPZihjdWlzaW5lKSArIDIpO1xyXG4gICAgc2VsZWN0LmFwcGVuZChvcHRpb24pO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEluaXRpYWxpemUgR29vZ2xlIG1hcCwgY2FsbGVkIGZyb20gSFRNTC5cclxuICovXHJcbndpbmRvdy5pbml0TWFwID0gKCkgPT4ge1xyXG5cclxuICBsZXQgbG9jID0ge1xyXG4gICAgbGF0OiA0MC43MjIyMTYsXHJcbiAgICBsbmc6IC03My45ODc1MDFcclxuICB9O1xyXG4gIHNlbGYubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcclxuICAgIHpvb206IDEyLFxyXG4gICAgY2VudGVyOiBsb2MsXHJcbiAgICBzY3JvbGx3aGVlbDogZmFsc2VcclxuICB9KTtcclxuXHJcbiAgc2VsZi5tYXAuYWRkTGlzdGVuZXIoJ2lkbGUnLCAoKSA9PiB7XHJcbiAgICBEQkhlbHBlci5zd2l0Y2hMb2FkZXJUb01hcCgpO1xyXG4gIH0pO1xyXG4gIHVwZGF0ZVJlc3RhdXJhbnRzKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVXBkYXRlIHBhZ2UgYW5kIG1hcCBmb3IgY3VycmVudCByZXN0YXVyYW50cy5cclxuICovXHJcbmNvbnN0IHVwZGF0ZVJlc3RhdXJhbnRzID0gKCkgPT4ge1xyXG4gIGNvbnN0IGNTZWxlY3QgPSBjdWlzaW5lc1NlbGVjdDtcclxuICBjb25zdCBuU2VsZWN0ID0gbmVpZ2hib3Job29kc1NlbGVjdDtcclxuXHJcbiAgY29uc3QgY0luZGV4ID0gY1NlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG4gIGNvbnN0IG5JbmRleCA9IG5TZWxlY3Quc2VsZWN0ZWRJbmRleDtcclxuXHJcbiAgY29uc3QgY3Vpc2luZSA9IGNTZWxlY3RbY0luZGV4XS52YWx1ZTtcclxuICBjb25zdCBuZWlnaGJvcmhvb2QgPSBuU2VsZWN0W25JbmRleF0udmFsdWU7XHJcblxyXG4gIERCSGVscGVyLmZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QpXHJcbiAgICAudGhlbihyZXN0YXVyYW50cyA9PiB7XHJcbiAgICAgIHJlc2V0UmVzdGF1cmFudHMocmVzdGF1cmFudHMpO1xyXG4gICAgICBmaWxsUmVzdGF1cmFudHNIVE1MKCk7XHJcbiAgICB9KS5jYXRjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGVycm9yKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2xlYXIgY3VycmVudCByZXN0YXVyYW50cywgdGhlaXIgSFRNTCBhbmQgcmVtb3ZlIHRoZWlyIG1hcCBtYXJrZXJzLlxyXG4gKi9cclxuY29uc3QgcmVzZXRSZXN0YXVyYW50cyA9IChyZXN0YXVyYW50cykgPT4ge1xyXG4gIC8vIFJlbW92ZSBhbGwgcmVzdGF1cmFudHNcclxuICBzZWxmLnJlc3RhdXJhbnRzID0gW107XHJcbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudHMtbGlzdCcpO1xyXG4gIHVsLmlubmVySFRNTCA9ICcnO1xyXG5cclxuICAvLyBSZW1vdmUgYWxsIG1hcCBtYXJrZXJzXHJcblxyXG4gIHNlbGYubWFya2Vycy5mb3JFYWNoKG0gPT4gbS5zZXRNYXAobnVsbCkpO1xyXG4gIHNlbGYubWFya2VycyA9IFtdO1xyXG4gIHNlbGYucmVzdGF1cmFudHMgPSByZXN0YXVyYW50cztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYWxsIHJlc3RhdXJhbnRzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxyXG4gKi9cclxuY29uc3QgZmlsbFJlc3RhdXJhbnRzSFRNTCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50cy1saXN0Jyk7XHJcbiAgcmVzdGF1cmFudHMuZm9yRWFjaChyZXN0YXVyYW50ID0+IHtcclxuICAgIHVsLmFwcGVuZChjcmVhdGVSZXN0YXVyYW50SFRNTChyZXN0YXVyYW50KSk7XHJcbiAgfSk7XHJcbiAgYWRkTWFya2Vyc1RvTWFwKCk7XHJcbiAgY29uc29sZS5sb2coJ1Jlc3RhdXJhbnRzIEhUTUwgZmlsbGVkJyk7XHJcbiAgYWN0aXZhdGVMYXp5TG9hZGluZygpO1xyXG4gIC8vIHNldFRpbWVvdXQoKCkgPT4gc3dpdGNoTG9hZGVyVG9NYXAoKSwgNTAwMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJuIHRoZSBhdmVyYWdlIG5vdGUgb2YgdGhlIHJlc3RhdXJhbnQuXHJcbiAqL1xyXG5jb25zdCBnZXRBdmVyYWdlTm90ZSA9IChyZXZpZXdzKSA9PiB7XHJcbiAgbGV0IGF2ZXJhZ2VOb3RlID0gMDtcclxuICByZXZpZXdzLmZvckVhY2gocmV2aWV3ID0+IHtcclxuICAgIGF2ZXJhZ2VOb3RlID0gYXZlcmFnZU5vdGUgKyBOdW1iZXIocmV2aWV3LnJhdGluZyk7XHJcbiAgfSk7XHJcbiAgYXZlcmFnZU5vdGUgPSBhdmVyYWdlTm90ZSAvIHJldmlld3MubGVuZ3RoO1xyXG4gIHJldHVybiAoTWF0aC5yb3VuZChhdmVyYWdlTm90ZSAqIDEwKSkgLyAxMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgcmVzdGF1cmFudCBIVE1MLlxyXG4gKi9cclxuY29uc3QgY3JlYXRlUmVzdGF1cmFudEhUTUwgPSAocmVzdGF1cmFudCkgPT4ge1xyXG4gIFxyXG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICBjb25zdCBmaWd1cmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmaWd1cmUnKTtcclxuICBjb25zdCBmaWdjYXB0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZmlnY2FwdGlvbicpO1xyXG4gIGNvbnN0IHBpY3R1cmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwaWN0dXJlJyk7XHJcbiAgY29uc3Qgc291cmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XHJcbiAgY29uc3Qgc2Vjb25kU291cmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XHJcbiAgY29uc3QgdGhTb3VyY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcclxuICBjb25zdCBzb3VyY2VXZWJwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XHJcbiAgY29uc3Qgc2Vjb25kU291cmNlV2VicCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xyXG4gIGNvbnN0IHRoU291cmNlV2VicCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xyXG4gIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XHJcbiAgY29uc3QgY29udGFpbmVyTm90ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2FzaWRlJyk7XHJcbiAgY29uc3Qgbm90ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuXHJcbiAgc291cmNlV2VicC5kYXRhc2V0LnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhcmdlX3gxLndlYnAgMXgsICR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGFyZ2VfeDIud2VicCAyeGA7XHJcbiAgc291cmNlV2VicC5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXp5LndlYnBgO1xyXG4gIHNvdXJjZVdlYnAubWVkaWEgPSAnKG1pbi13aWR0aDogMTAwMHB4KSc7XHJcbiAgc291cmNlV2VicC5jbGFzc05hbWUgPSAnbGF6eSc7XHJcbiAgc291cmNlLmRhdGFzZXQuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXJnZV94MS5qcGcgMXgsICR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXJnZV94Mi5qcGcgMnhgO1xyXG4gIHNvdXJjZS5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXp5LmpwZ2A7XHJcbiAgc291cmNlLm1lZGlhID0gJyhtaW4td2lkdGg6IDEwMDBweCknO1xyXG4gIHNvdXJjZS5jbGFzc05hbWUgPSAnbGF6eSc7XHJcbiAgXHJcbiAgc2Vjb25kU291cmNlV2VicC5kYXRhc2V0LnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LW1lZGl1bV94MS53ZWJwIDF4LCAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LW1lZGl1bV94Mi53ZWJwIDJ4YDtcclxuICBzZWNvbmRTb3VyY2VXZWJwLnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhenkud2VicGA7XHJcbiAgc2Vjb25kU291cmNlV2VicC5tZWRpYSA9ICcobWluLXdpZHRoOiA0MjBweCknO1xyXG4gIHNlY29uZFNvdXJjZVdlYnAuY2xhc3NOYW1lID0gJ2xhenknO1xyXG4gIHNlY29uZFNvdXJjZS5kYXRhc2V0LnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbWVkaXVtX3gxLmpwZyAxeCwgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LW1lZGl1bV94Mi5qcGcgMnhgO1xyXG4gIHNlY29uZFNvdXJjZS5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXp5LmpwZ2A7XHJcbiAgc2Vjb25kU291cmNlLm1lZGlhID0gJyhtaW4td2lkdGg6IDQyMHB4KSc7XHJcbiAgc2Vjb25kU291cmNlLmNsYXNzTmFtZSA9ICdsYXp5JztcclxuICBcclxuICB0aFNvdXJjZVdlYnAuZGF0YXNldC5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1zbWFsbF94Mi53ZWJwIDJ4LCAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LXNtYWxsX3gxLndlYnAgMXhgO1xyXG4gIHRoU291cmNlV2VicC5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXp5LndlYnBgO1xyXG4gIHRoU291cmNlV2VicC5tZWRpYSA9ICcobWluLXdpZHRoOiAzMjBweCknO1xyXG4gIHRoU291cmNlV2VicC5jbGFzc05hbWUgPSAnbGF6eSc7XHJcbiAgdGhTb3VyY2UuZGF0YXNldC5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LXNtYWxsX3gyLmpwZyAyeCwgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LXNtYWxsX3gxLmpwZyAxeGA7XHJcbiAgdGhTb3VyY2Uuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGF6eS5qcGdgO1xyXG4gIHRoU291cmNlLm1lZGlhID0gJyhtaW4td2lkdGg6IDMyMHB4KSc7XHJcbiAgdGhTb3VyY2UuY2xhc3NOYW1lID0gJ2xhenknO1xyXG4gIFxyXG4gIGltYWdlLmRhdGFzZXQuc3JjID0gYCR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1zbWFsbF94MS5qcGdgO1xyXG4gIGltYWdlLnNyYyA9IGAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGF6eS5qcGdgO1xyXG4gIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyBsYXp5JztcclxuICBpbWFnZS5zZXRBdHRyaWJ1dGUoJ3NpemVzJywgJyhtYXgtd2lkdGg6IDExMDBweCkgODV2dywgKG1pbi13aWR0aDogMTEwMXB4KSA5OTBweCcpO1xyXG4gIGltYWdlLmFsdCA9IGAke3Jlc3RhdXJhbnQubmFtZX0ncyByZXN0YXVyYW50YDtcclxuICBcclxuICBub3RlLmlubmVySFRNTCA9IGAke2dldEF2ZXJhZ2VOb3RlKHJlc3RhdXJhbnQucmV2aWV3cyl9LzVgO1xyXG5cclxuICBjb250YWluZXJOb3RlLmFwcGVuZChub3RlKTtcclxuXHJcbiAgcGljdHVyZS5hcHBlbmQoc291cmNlV2VicCk7XHJcbiAgcGljdHVyZS5hcHBlbmQoc291cmNlKTtcclxuICBwaWN0dXJlLmFwcGVuZChzZWNvbmRTb3VyY2VXZWJwKTtcclxuICBwaWN0dXJlLmFwcGVuZChzZWNvbmRTb3VyY2UpO1xyXG4gIHBpY3R1cmUuYXBwZW5kKHRoU291cmNlV2VicCk7XHJcbiAgcGljdHVyZS5hcHBlbmQodGhTb3VyY2UpO1xyXG4gIHBpY3R1cmUuYXBwZW5kKGltYWdlKTtcclxuICBmaWd1cmUuYXBwZW5kKHBpY3R1cmUpO1xyXG4gIGZpZ3VyZS5hcHBlbmQoZmlnY2FwdGlvbik7XHJcbiAgXHJcbiAgbGkuYXBwZW5kKGNvbnRhaW5lck5vdGUpO1xyXG4gIGxpLmFwcGVuZChmaWd1cmUpO1xyXG4gIFxyXG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xyXG4gIG5hbWUuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xyXG4gIGZpZ2NhcHRpb24uYXBwZW5kKG5hbWUpO1xyXG5cclxuICBjb25zdCBuZWlnaGJvcmhvb2QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgbmVpZ2hib3Job29kLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmVpZ2hib3Job29kO1xyXG4gIGxpLmFwcGVuZChuZWlnaGJvcmhvb2QpO1xyXG5cclxuICBjb25zdCBhZGRyZXNzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG4gIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xyXG4gIGxpLmFwcGVuZChhZGRyZXNzKTtcclxuXHJcbiAgY29uc3QgbW9yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICBtb3JlLmlubmVySFRNTCA9ICdWaWV3IERldGFpbHMnO1xyXG4gIG1vcmUuaHJlZiA9IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XHJcbiAgbW9yZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCBgVmlldyBkZXRhaWxzIG9mICR7cmVzdGF1cmFudC5uYW1lfWApO1xyXG4gIGxpLmFwcGVuZChtb3JlKTtcclxuXHJcbiAgbGkuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2xpc3RpdGVtJyk7XHJcbiAgbGkuc2V0QXR0cmlidXRlKCdhcmlhLXNldHNpemUnLCAnMTAnKTtcclxuICBsaS5zZXRBdHRyaWJ1dGUoJ2FyaWEtcG9zaW5zZXQnLCByZXN0YXVyYW50LmlkKTtcclxuICByZXR1cm4gbGk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkIG1hcmtlcnMgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMgdG8gdGhlIG1hcC5cclxuICovXHJcbmNvbnN0IGFkZE1hcmtlcnNUb01hcCA9IChyZXN0YXVyYW50cyA9IHNlbGYucmVzdGF1cmFudHMpID0+IHtcclxuICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgLy8gQWRkIG1hcmtlciB0byB0aGUgbWFwXHJcbiAgICBjb25zdCBtYXJrZXIgPSBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHNlbGYubWFwKTtcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IG1hcmtlci51cmw7XHJcbiAgICB9KTtcclxuICAgIHNlbGYubWFya2Vycy5wdXNoKG1hcmtlcik7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5cclxuIl19
