/* global DBHelper */
let restaurants;
let neighborhoods;
let cuisines;

// var map;
var markers = [];

const mainContent = document.querySelector('main'),
      footer = document.querySelector('footer'),
      filterOptions = document.querySelector('.filter-options'),
      filterResultHeading = document.querySelector('.filter-options h3'),
      filterButton = document.querySelector('#menuFilter'),
      listOfRestaurants = document.querySelector('#restaurants-list'),

// sectionRestaurantsList = document.querySelector('#list-container'),
sectionMap = document.querySelector('#map-container'),
      neighborhoodsSelect = document.querySelector('#neighborhoods-select'),
      cuisinesSelect = document.querySelector('#cuisines-select'),
      map = document.querySelector('#map'),
      loader = document.querySelector('#map-loader');

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {

  fetchNeighborhoods();
  fetchCuisines();
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

function switchLoaderToMap() {
  setTimeout(() => {
    map.classList.remove('hidden');
    loader.classList.add('hidden');
  }, 1000);
}

/**
 * Register to service worker if the browser is compatible.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(registration => {
      console.log('registration to serviceWorker complete with scope :', registration.scope);
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
    let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
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
    let lazyImages = [].slice.call(document.querySelectorAll('.lazy'));
    let active = false;
    console.log('Starting adaptative lazy loading');
    const lazyLoad = function () {
      if (active === false) {
        active = true;

        setTimeout(function () {
          lazyImages.forEach(function (lazyImage) {
            if (lazyImage.getBoundingClientRect().top <= window.innerHeight && lazyImage.getBoundingClientRect().bottom >= 0 && getComputedStyle(lazyImage).display !== "none") {
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
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods().then(neighborhoods => {
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
  }).catch(error => console.error(error));
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
    option.setAttribute('aria-posinset', neighborhoods.indexOf(neighborhood) + 2);
    select.append(option);
  });
};
/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines().then(cuisines => {
    self.cuisines = cuisines;
    fillCuisinesHTML();
  }).catch(error => console.error(error));
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
};

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = cuisinesSelect;
  const nSelect = neighborhoodsSelect;

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then(restaurants => {
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
  }).catch(error => console.error(error));
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers

  self.markers.forEach(m => m.setMap(null));
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
  addMarkersToMap();
  switchLoaderToMap();
  console.log('Restaurants HTML filled');
  activateLazyLoading();
};

/**
 * Return the average note of the restaurant.
 */
const getAverageNote = reviews => {
  let averageNote = 0;
  reviews.forEach(review => {
    averageNote = averageNote + Number(review.rating);
  });
  averageNote = averageNote / reviews.length;
  return Math.round(averageNote * 10) / 10;
};

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {

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
  source.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-large_x2.jpg 2x`;
  source.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-lazy.jpg`;
  source.media = '(min-width: 1000px)';
  source.className = 'lazy';

  secondSourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x1.webp 1x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x2.webp 2x`;
  secondSourceWebp.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-lazy.webp`;
  secondSourceWebp.media = '(min-width: 420px)';
  secondSourceWebp.className = 'lazy';
  secondSource.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x2.jpg 2x`;
  secondSource.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-lazy.jpg`;
  secondSource.media = '(min-width: 420px)';
  secondSource.className = 'lazy';

  thSourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x2.webp 2x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x1.webp 1x`;
  thSourceWebp.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-lazy.webp`;
  thSourceWebp.media = '(min-width: 320px)';
  thSourceWebp.className = 'lazy';
  thSource.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x2.jpg 2x, ${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg 1x`;
  thSource.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-lazy.jpg`;
  thSource.media = '(min-width: 320px)';
  thSource.className = 'lazy';

  image.dataset.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg`;
  image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  image.className = 'restaurant-img lazy';
  image.setAttribute('sizes', '(max-width: 1100px) 85vw, (min-width: 1101px) 990px');
  image.alt = `${restaurant.name}'s restaurant`;

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
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOlsicmVzdGF1cmFudHMiLCJuZWlnaGJvcmhvb2RzIiwiY3Vpc2luZXMiLCJtYXJrZXJzIiwibWFpbkNvbnRlbnQiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3IiLCJmb290ZXIiLCJmaWx0ZXJPcHRpb25zIiwiZmlsdGVyUmVzdWx0SGVhZGluZyIsImZpbHRlckJ1dHRvbiIsImxpc3RPZlJlc3RhdXJhbnRzIiwic2VjdGlvbk1hcCIsIm5laWdoYm9yaG9vZHNTZWxlY3QiLCJjdWlzaW5lc1NlbGVjdCIsIm1hcCIsImxvYWRlciIsImFkZEV2ZW50TGlzdGVuZXIiLCJmZXRjaE5laWdoYm9yaG9vZHMiLCJmZXRjaEN1aXNpbmVzIiwiY2xhc3NMaXN0IiwiY29udGFpbnMiLCJvcGVuTWVudSIsImNsb3NlTWVudSIsInJlbW92ZSIsImFkZCIsInNldEF0dHJpYnV0ZSIsImJsdXIiLCJmb2N1cyIsInJlbW92ZUF0dHJpYnV0ZSIsInN3aXRjaExvYWRlclRvTWFwIiwic2V0VGltZW91dCIsIm5hdmlnYXRvciIsIndpbmRvdyIsInNlcnZpY2VXb3JrZXIiLCJyZWdpc3RlciIsInRoZW4iLCJyZWdpc3RyYXRpb24iLCJjb25zb2xlIiwibG9nIiwic2NvcGUiLCJvbmtleXByZXNzIiwiZSIsImNvZGUiLCJjaGFyQ29kZSIsImNsaWVudEhlaWdodCIsImFjdGl2YXRlTGF6eUxvYWRpbmciLCJsYXp5SW1hZ2VzIiwic2xpY2UiLCJjYWxsIiwicXVlcnlTZWxlY3RvckFsbCIsImxhenlJbWFnZU9ic2VydmVyIiwiSW50ZXJzZWN0aW9uT2JzZXJ2ZXIiLCJlbnRyaWVzIiwib2JzZXJ2ZXIiLCJmb3JFYWNoIiwiZW50cnkiLCJpc0ludGVyc2VjdGluZyIsImxhenlJbWFnZSIsInRhcmdldCIsImxvY2FsTmFtZSIsInNyY3NldCIsImRhdGFzZXQiLCJzcmMiLCJ1bm9ic2VydmUiLCJvYnNlcnZlIiwiYWN0aXZlIiwibGF6eUxvYWQiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ0b3AiLCJpbm5lckhlaWdodCIsImJvdHRvbSIsImdldENvbXB1dGVkU3R5bGUiLCJkaXNwbGF5IiwiZmlsdGVyIiwiaW1hZ2UiLCJsZW5ndGgiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiREJIZWxwZXIiLCJzZWxmIiwiZmlsbE5laWdoYm9yaG9vZHNIVE1MIiwiY2F0Y2giLCJlcnJvciIsInNlbGVjdCIsIm5laWdoYm9yaG9vZCIsIm9wdGlvbiIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJ2YWx1ZSIsImluZGV4T2YiLCJhcHBlbmQiLCJmaWxsQ3Vpc2luZXNIVE1MIiwiY3Vpc2luZSIsImluaXRNYXAiLCJsb2MiLCJsYXQiLCJsbmciLCJnb29nbGUiLCJtYXBzIiwiTWFwIiwiZ2V0RWxlbWVudEJ5SWQiLCJ6b29tIiwiY2VudGVyIiwic2Nyb2xsd2hlZWwiLCJ1cGRhdGVSZXN0YXVyYW50cyIsImNTZWxlY3QiLCJuU2VsZWN0IiwiY0luZGV4Iiwic2VsZWN0ZWRJbmRleCIsIm5JbmRleCIsImZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZCIsInJlc2V0UmVzdGF1cmFudHMiLCJmaWxsUmVzdGF1cmFudHNIVE1MIiwidWwiLCJtIiwic2V0TWFwIiwicmVzdGF1cmFudCIsImNyZWF0ZVJlc3RhdXJhbnRIVE1MIiwiYWRkTWFya2Vyc1RvTWFwIiwiZ2V0QXZlcmFnZU5vdGUiLCJyZXZpZXdzIiwiYXZlcmFnZU5vdGUiLCJyZXZpZXciLCJOdW1iZXIiLCJyYXRpbmciLCJNYXRoIiwicm91bmQiLCJsaSIsImZpZ3VyZSIsImZpZ2NhcHRpb24iLCJwaWN0dXJlIiwic291cmNlIiwic2Vjb25kU291cmNlIiwidGhTb3VyY2UiLCJzb3VyY2VXZWJwIiwic2Vjb25kU291cmNlV2VicCIsInRoU291cmNlV2VicCIsImNvbnRhaW5lck5vdGUiLCJub3RlIiwiaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudCIsIm1lZGlhIiwiY2xhc3NOYW1lIiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50IiwiYWx0IiwibmFtZSIsImFkZHJlc3MiLCJtb3JlIiwiaHJlZiIsInVybEZvclJlc3RhdXJhbnQiLCJpZCIsIm1hcmtlciIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJldmVudCIsImFkZExpc3RlbmVyIiwibG9jYXRpb24iLCJ1cmwiLCJwdXNoIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBLElBQUlBLFdBQUo7QUFDQSxJQUFJQyxhQUFKO0FBQ0EsSUFBSUMsUUFBSjs7QUFFQTtBQUNBLElBQUlDLFVBQVUsRUFBZDs7QUFFQSxNQUFNQyxjQUFjQyxTQUFTQyxhQUFULENBQXVCLE1BQXZCLENBQXBCO0FBQUEsTUFDRUMsU0FBU0YsU0FBU0MsYUFBVCxDQUF1QixRQUF2QixDQURYO0FBQUEsTUFFRUUsZ0JBQWdCSCxTQUFTQyxhQUFULENBQXVCLGlCQUF2QixDQUZsQjtBQUFBLE1BR0VHLHNCQUFzQkosU0FBU0MsYUFBVCxDQUF1QixvQkFBdkIsQ0FIeEI7QUFBQSxNQUlFSSxlQUFlTCxTQUFTQyxhQUFULENBQXVCLGFBQXZCLENBSmpCO0FBQUEsTUFLRUssb0JBQW9CTixTQUFTQyxhQUFULENBQXVCLG1CQUF2QixDQUx0Qjs7QUFNRTtBQUNBTSxhQUFhUCxTQUFTQyxhQUFULENBQXVCLGdCQUF2QixDQVBmO0FBQUEsTUFRRU8sc0JBQXNCUixTQUFTQyxhQUFULENBQXVCLHVCQUF2QixDQVJ4QjtBQUFBLE1BU0VRLGlCQUFpQlQsU0FBU0MsYUFBVCxDQUF1QixrQkFBdkIsQ0FUbkI7QUFBQSxNQVVFUyxNQUFNVixTQUFTQyxhQUFULENBQXVCLE1BQXZCLENBVlI7QUFBQSxNQVdFVSxTQUFTWCxTQUFTQyxhQUFULENBQXVCLGFBQXZCLENBWFg7O0FBZUE7OztBQUdBRCxTQUFTWSxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsTUFBTTs7QUFFbERDO0FBQ0FDO0FBQ0QsQ0FKRDs7QUFRQTs7O0FBR0FULGFBQWFPLGdCQUFiLENBQThCLE9BQTlCLEVBQXVDLE1BQU07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b0M7QUFDMURBLGNBQVl1RCxPQUFaLENBQW9CNkQsY0FBYztBQUNoQztBQUNBLFVBQU1rQyxTQUFTeEUsU0FBU3lFLHNCQUFULENBQWdDbkMsVUFBaEMsRUFBNENyQyxLQUFLaEUsR0FBakQsQ0FBZjtBQUNBa0YsV0FBT0MsSUFBUCxDQUFZc0QsS0FBWixDQUFrQkMsV0FBbEIsQ0FBOEJILE1BQTlCLEVBQXNDLE9BQXRDLEVBQStDLE1BQU07QUFDbkRySCxhQUFPeUgsUUFBUCxDQUFnQlAsSUFBaEIsR0FBdUJHLE9BQU9LLEdBQTlCO0FBQ0QsS0FGRDtBQUdBNUUsU0FBSzVFLE9BQUwsQ0FBYXlKLElBQWIsQ0FBa0JOLE1BQWxCO0FBQ0QsR0FQRDtBQVFELENBVEQiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBEQkhlbHBlciAqL1xyXG5sZXQgcmVzdGF1cmFudHM7XHJcbmxldCBuZWlnaGJvcmhvb2RzO1xyXG5sZXQgY3Vpc2luZXM7XHJcblxyXG4vLyB2YXIgbWFwO1xyXG52YXIgbWFya2VycyA9IFtdO1xyXG5cclxuY29uc3QgbWFpbkNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyksXHJcbiAgZm9vdGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZm9vdGVyJyksXHJcbiAgZmlsdGVyT3B0aW9ucyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5maWx0ZXItb3B0aW9ucycpLFxyXG4gIGZpbHRlclJlc3VsdEhlYWRpbmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZmlsdGVyLW9wdGlvbnMgaDMnKSxcclxuICBmaWx0ZXJCdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWVudUZpbHRlcicpLFxyXG4gIGxpc3RPZlJlc3RhdXJhbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3Jlc3RhdXJhbnRzLWxpc3QnKSxcclxuICAvLyBzZWN0aW9uUmVzdGF1cmFudHNMaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xpc3QtY29udGFpbmVyJyksXHJcbiAgc2VjdGlvbk1hcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYXAtY29udGFpbmVyJyksXHJcbiAgbmVpZ2hib3Job29kc1NlbGVjdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNuZWlnaGJvcmhvb2RzLXNlbGVjdCcpLFxyXG4gIGN1aXNpbmVzU2VsZWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2N1aXNpbmVzLXNlbGVjdCcpLFxyXG4gIG1hcCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYXAnKSxcclxuICBsb2FkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFwLWxvYWRlcicpO1xyXG5cclxuXHJcblxyXG4vKipcclxuICogRmV0Y2ggbmVpZ2hib3Job29kcyBhbmQgY3Vpc2luZXMgYXMgc29vbiBhcyB0aGUgcGFnZSBpcyBsb2FkZWQuXHJcbiAqL1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gIFxyXG4gIGZldGNoTmVpZ2hib3Job29kcygpO1xyXG4gIGZldGNoQ3Vpc2luZXMoKTtcclxufSk7XHJcblxyXG5cclxuXHJcbi8qKlxyXG4gKiBPcGVuIG9yIGNsb3NlIHRoZSBvcHRpb25zL2ZpbHRlciBtZW51LlxyXG4gKi9cclxuZmlsdGVyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gIGlmIChmaWx0ZXJPcHRpb25zLmNsYXNzTGlzdC5jb250YWlucygnb3B0aW9uc0Nsb3NlJykpIHtcclxuICAgIG9wZW5NZW51KCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNsb3NlTWVudSgpO1xyXG4gIH1cclxufSk7XHJcbmZ1bmN0aW9uIG9wZW5NZW51KCkge1xyXG4gIGZpbHRlck9wdGlvbnMuY2xhc3NMaXN0LnJlbW92ZSgnb3B0aW9uc0Nsb3NlJyk7XHJcbiAgbWFpbkNvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZVVwJyk7XHJcbiAgZm9vdGVyLmNsYXNzTGlzdC5yZW1vdmUoJ21vdmVVcCcpO1xyXG4gIGZpbHRlck9wdGlvbnMuY2xhc3NMaXN0LmFkZCgnb3B0aW9uc09wZW4nKTtcclxuICBmaWx0ZXJPcHRpb25zLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcclxuICBtYWluQ29udGVudC5jbGFzc0xpc3QuYWRkKCdtb3ZlRG93bicpO1xyXG4gIGZvb3Rlci5jbGFzc0xpc3QuYWRkKCdtb3ZlRG93bicpO1xyXG4gIGZpbHRlckJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdwcmVzc2VkJyk7XHJcbiAgZmlsdGVyQnV0dG9uLmJsdXIoKTtcclxuICBmaWx0ZXJSZXN1bHRIZWFkaW5nLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcclxuICBmaWx0ZXJSZXN1bHRIZWFkaW5nLmZvY3VzKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsb3NlTWVudSgpIHtcclxuICBmaWx0ZXJPcHRpb25zLmNsYXNzTGlzdC5yZW1vdmUoJ29wdGlvbnNPcGVuJyk7XHJcbiAgZmlsdGVyT3B0aW9ucy5jbGFzc0xpc3QuYWRkKCdvcHRpb25zQ2xvc2UnKTtcclxuICBmaWx0ZXJPcHRpb25zLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xyXG4gIGZpbHRlckJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdwcmVzc2VkJyk7XHJcbiAgbWFpbkNvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZURvd24nKTtcclxuICBtYWluQ29udGVudC5jbGFzc0xpc3QuYWRkKCdtb3ZlVXAnKTtcclxuICBmb290ZXIuY2xhc3NMaXN0LnJlbW92ZSgnbW92ZURvd24nKTtcclxuICBmb290ZXIuY2xhc3NMaXN0LmFkZCgnbW92ZVVwJyk7XHJcbiAgZmlsdGVyUmVzdWx0SGVhZGluZy5yZW1vdmVBdHRyaWJ1dGUoJ3RhYmluZGV4Jyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN3aXRjaExvYWRlclRvTWFwKCkge1xyXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgbWFwLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xyXG4gICAgbG9hZGVyLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xyXG4gIH0sIDEwMDApO1xyXG59XHJcblxyXG4vKipcclxuICogUmVnaXN0ZXIgdG8gc2VydmljZSB3b3JrZXIgaWYgdGhlIGJyb3dzZXIgaXMgY29tcGF0aWJsZS5cclxuICovXHJcbmlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XHJcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCAoKSA9PiB7XHJcbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3Rlcignc3cuanMnKS50aGVuKHJlZ2lzdHJhdGlvbiA9PiB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdyZWdpc3RyYXRpb24gdG8gc2VydmljZVdvcmtlciBjb21wbGV0ZSB3aXRoIHNjb3BlIDonLCByZWdpc3RyYXRpb24uc2NvcGUpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSWYgb3B0aW9ucy9maWx0ZXIgbWVudSBpcyBvcGVuIGFuZCBlbnRlciBpcyBwcmVzc2VkIGl0IG1ha2VzIGZvY3VzIHNraXAgdG8gcmVzdGF1cmFudHMgbGlzdC5cclxuICovXHJcbmRvY3VtZW50Lm9ua2V5cHJlc3MgPSBmdW5jdGlvbiAoZSkge1xyXG4gIGNvbnNvbGUubG9nKGUuY29kZSk7XHJcbiAgaWYgKGUuY2hhckNvZGUgPT09IDEzICYmIGZpbHRlck9wdGlvbnMuY2xhc3NMaXN0LmNvbnRhaW5zKCdvcHRpb25zT3BlbicpKSB7XHJcbiAgICBjbG9zZU1lbnUoKTtcclxuICAgIGNvbnNvbGUubG9nKHNlY3Rpb25NYXAuY2xpZW50SGVpZ2h0KTtcclxuICAgIGxpc3RPZlJlc3RhdXJhbnRzLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMCcpO1xyXG4gICAgbGlzdE9mUmVzdGF1cmFudHMuZm9jdXMoKTtcclxuICAgIC8vIHdpbmRvdy5zY3JvbGxUbygwLCBzZWN0aW9uTWFwLmNsaWVudEhlaWdodCoyKTtcclxuICB9XHJcbn07XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIGFjdGl2YXRlTGF6eUxvYWRpbmcoKSB7XHJcbiAgXHJcbiAgdmFyIGxhenlJbWFnZXMgPSBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5sYXp5JykpO1xyXG5cclxuICBcclxuICBpZiAoJ0ludGVyc2VjdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cpIHtcclxuICAgIGNvbnNvbGUubG9nKCdTdGFydGluZyBpbnRlcnNlY3Rpb25PYnNlcnZlcicpO1xyXG4gICAgbGV0IGxhenlJbWFnZU9ic2VydmVyID0gbmV3IEludGVyc2VjdGlvbk9ic2VydmVyKGZ1bmN0aW9uIChlbnRyaWVzLCBvYnNlcnZlcikge1xyXG4gICAgICBlbnRyaWVzLmZvckVhY2goZnVuY3Rpb24gKGVudHJ5KSB7XHJcbiAgICAgICAgaWYgKGVudHJ5LmlzSW50ZXJzZWN0aW5nKSB7XHJcbiAgICAgICAgICBsZXQgbGF6eUltYWdlID0gZW50cnkudGFyZ2V0O1xyXG4gICAgICAgICAgaWYgKGxhenlJbWFnZS5sb2NhbE5hbWUgPT09ICdzb3VyY2UnKSB7XHJcbiAgICAgICAgICAgIGxhenlJbWFnZS5zcmNzZXQgPSBsYXp5SW1hZ2UuZGF0YXNldC5zcmNzZXQ7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYXp5SW1hZ2Uuc3JjID0gbGF6eUltYWdlLmRhdGFzZXQuc3JjO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGxhenlJbWFnZS5jbGFzc0xpc3QucmVtb3ZlKCdsYXp5Jyk7XHJcbiAgICAgICAgICBsYXp5SW1hZ2VPYnNlcnZlci51bm9ic2VydmUobGF6eUltYWdlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgbGF6eUltYWdlcy5mb3JFYWNoKGZ1bmN0aW9uIChsYXp5SW1hZ2UpIHtcclxuICAgICAgbGF6eUltYWdlT2JzZXJ2ZXIub2JzZXJ2ZShsYXp5SW1hZ2UpO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFBvc3NpYmx5IGZhbGwgYmFjayB0byBhIG1vcmUgY29tcGF0aWJsZSBtZXRob2QgaGVyZVxyXG4gICAgbGV0IGxhenlJbWFnZXMgPSBbXS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5sYXp5JykpO1xyXG4gICAgbGV0IGFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgY29uc29sZS5sb2coJ1N0YXJ0aW5nIGFkYXB0YXRpdmUgbGF6eSBsb2FkaW5nJyk7XHJcbiAgICBjb25zdCBsYXp5TG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgaWYgKGFjdGl2ZSA9PT0gZmFsc2UpIHtcclxuICAgICAgICBhY3RpdmUgPSB0cnVlO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGxhenlJbWFnZXMuZm9yRWFjaChmdW5jdGlvbiAobGF6eUltYWdlKSB7XHJcbiAgICAgICAgICAgIGlmICgobGF6eUltYWdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCA8PSB3aW5kb3cuaW5uZXJIZWlnaHQgJiYgbGF6eUltYWdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbSA+PSAwKSAmJiBnZXRDb21wdXRlZFN0eWxlKGxhenlJbWFnZSkuZGlzcGxheSAhPT0gXCJub25lXCIpIHtcclxuICAgICAgICAgICAgICBsYXp5SW1hZ2Uuc3JjID0gbGF6eUltYWdlLmRhdGFzZXQuc3JjO1xyXG4gICAgICAgICAgICAgIGxhenlJbWFnZS5zcmNzZXQgPSBsYXp5SW1hZ2UuZGF0YXNldC5zcmNzZXQ7XHJcbiAgICAgICAgICAgICAgbGF6eUltYWdlLmNsYXNzTGlzdC5yZW1vdmUoJ2xhenknKTtcclxuXHJcbiAgICAgICAgICAgICAgbGF6eUltYWdlcyA9IGxhenlJbWFnZXMuZmlsdGVyKGZ1bmN0aW9uIChpbWFnZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGltYWdlICE9PSBsYXp5SW1hZ2U7XHJcbiAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgIGlmIChsYXp5SW1hZ2VzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgbGF6eUxvYWQpO1xyXG4gICAgICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGxhenlMb2FkKTtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIGxhenlMb2FkKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIGFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIH0sIDIwMCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBsYXp5TG9hZCk7XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgbGF6eUxvYWQpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgbGF6eUxvYWQpO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmZXRjaE5laWdoYm9yaG9vZHMgPSAoKSA9PiB7XHJcbiAgREJIZWxwZXIuZmV0Y2hOZWlnaGJvcmhvb2RzKClcclxuICAgIC50aGVuKG5laWdoYm9yaG9vZHMgPT4ge1xyXG4gICAgICBzZWxmLm5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzO1xyXG4gICAgICBmaWxsTmVpZ2hib3Job29kc0hUTUwoKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcihlcnJvcikpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCBuZWlnaGJvcmhvb2RzIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmaWxsTmVpZ2hib3Job29kc0hUTUwgPSAobmVpZ2hib3Job29kcyA9IHNlbGYubmVpZ2hib3Job29kcykgPT4ge1xyXG4gIGNvbnN0IHNlbGVjdCA9IG5laWdoYm9yaG9vZHNTZWxlY3Q7XHJcbiAgbmVpZ2hib3Job29kcy5mb3JFYWNoKG5laWdoYm9yaG9vZCA9PiB7XHJcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcclxuICAgIG9wdGlvbi5pbm5lckhUTUwgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICBvcHRpb24udmFsdWUgPSBuZWlnaGJvcmhvb2Q7XHJcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdyb2xlJywgJ29wdGlvbicpO1xyXG4gICAgb3B0aW9uLnNldEF0dHJpYnV0ZSgnYXJpYS1zZXRzaXplJywgJzQnKTtcclxuICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtcG9zaW5zZXQnLCBuZWlnaGJvcmhvb2RzLmluZGV4T2YobmVpZ2hib3Job29kKSsyKTtcclxuICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcclxuICB9KTtcclxufTtcclxuLyoqXHJcbiAqIEZldGNoIGFsbCBjdWlzaW5lcyBhbmQgc2V0IHRoZWlyIEhUTUwuXHJcbiAqL1xyXG5jb25zdCBmZXRjaEN1aXNpbmVzID0gKCkgPT4ge1xyXG4gIERCSGVscGVyLmZldGNoQ3Vpc2luZXMoKVxyXG4gICAgLnRoZW4oY3Vpc2luZXMgPT4ge1xyXG4gICAgICBzZWxmLmN1aXNpbmVzID0gY3Vpc2luZXM7XHJcbiAgICAgIGZpbGxDdWlzaW5lc0hUTUwoKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcihlcnJvcikpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCBjdWlzaW5lcyBIVE1MLlxyXG4gKi9cclxuY29uc3QgZmlsbEN1aXNpbmVzSFRNTCA9IChjdWlzaW5lcyA9IHNlbGYuY3Vpc2luZXMpID0+IHtcclxuICBjb25zdCBzZWxlY3QgPSBjdWlzaW5lc1NlbGVjdDtcclxuICBjdWlzaW5lcy5mb3JFYWNoKGN1aXNpbmUgPT4ge1xyXG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XHJcbiAgICBvcHRpb24uaW5uZXJIVE1MID0gY3Vpc2luZTtcclxuICAgIG9wdGlvbi52YWx1ZSA9IGN1aXNpbmU7XHJcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdyb2xlJywgJ29wdGlvbicpO1xyXG4gICAgb3B0aW9uLnNldEF0dHJpYnV0ZSgnYXJpYS1zZXRzaXplJywgJzQnKTtcclxuICAgIG9wdGlvbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtcG9zaW5zZXQnLCBjdWlzaW5lcy5pbmRleE9mKGN1aXNpbmUpICsgMik7XHJcbiAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBHb29nbGUgbWFwLCBjYWxsZWQgZnJvbSBIVE1MLlxyXG4gKi9cclxud2luZG93LmluaXRNYXAgPSAoKSA9PiB7XHJcbiAgbGV0IGxvYyA9IHtcclxuICAgIGxhdDogNDAuNzIyMjE2LFxyXG4gICAgbG5nOiAtNzMuOTg3NTAxXHJcbiAgfTtcclxuICBzZWxmLm1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpLCB7XHJcbiAgICB6b29tOiAxMixcclxuICAgIGNlbnRlcjogbG9jLFxyXG4gICAgc2Nyb2xsd2hlZWw6IGZhbHNlXHJcbiAgfSk7XHJcbiAgdXBkYXRlUmVzdGF1cmFudHMoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVcGRhdGUgcGFnZSBhbmQgbWFwIGZvciBjdXJyZW50IHJlc3RhdXJhbnRzLlxyXG4gKi9cclxuY29uc3QgdXBkYXRlUmVzdGF1cmFudHMgPSAoKSA9PiB7XHJcbiAgY29uc3QgY1NlbGVjdCA9IGN1aXNpbmVzU2VsZWN0O1xyXG4gIGNvbnN0IG5TZWxlY3QgPSBuZWlnaGJvcmhvb2RzU2VsZWN0O1xyXG5cclxuICBjb25zdCBjSW5kZXggPSBjU2VsZWN0LnNlbGVjdGVkSW5kZXg7XHJcbiAgY29uc3QgbkluZGV4ID0gblNlbGVjdC5zZWxlY3RlZEluZGV4O1xyXG5cclxuICBjb25zdCBjdWlzaW5lID0gY1NlbGVjdFtjSW5kZXhdLnZhbHVlO1xyXG4gIGNvbnN0IG5laWdoYm9yaG9vZCA9IG5TZWxlY3RbbkluZGV4XS52YWx1ZTtcclxuXHJcbiAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZClcclxuICAgIC50aGVuKHJlc3RhdXJhbnRzID0+IHtcclxuICAgICAgcmVzZXRSZXN0YXVyYW50cyhyZXN0YXVyYW50cyk7XHJcbiAgICAgIGZpbGxSZXN0YXVyYW50c0hUTUwoKTtcclxuICAgIH0pLmNhdGNoKGVycm9yID0+IGNvbnNvbGUuZXJyb3IoZXJyb3IpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDbGVhciBjdXJyZW50IHJlc3RhdXJhbnRzLCB0aGVpciBIVE1MIGFuZCByZW1vdmUgdGhlaXIgbWFwIG1hcmtlcnMuXHJcbiAqL1xyXG5jb25zdCByZXNldFJlc3RhdXJhbnRzID0gKHJlc3RhdXJhbnRzKSA9PiB7XHJcbiAgLy8gUmVtb3ZlIGFsbCByZXN0YXVyYW50c1xyXG4gIHNlbGYucmVzdGF1cmFudHMgPSBbXTtcclxuICBjb25zdCB1bCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN0YXVyYW50cy1saXN0Jyk7XHJcbiAgdWwuaW5uZXJIVE1MID0gJyc7XHJcblxyXG4gIC8vIFJlbW92ZSBhbGwgbWFwIG1hcmtlcnNcclxuXHJcbiAgc2VsZi5tYXJrZXJzLmZvckVhY2gobSA9PiBtLnNldE1hcChudWxsKSk7XHJcbiAgc2VsZi5tYXJrZXJzID0gW107XHJcbiAgc2VsZi5yZXN0YXVyYW50cyA9IHJlc3RhdXJhbnRzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhbGwgcmVzdGF1cmFudHMgSFRNTCBhbmQgYWRkIHRoZW0gdG8gdGhlIHdlYnBhZ2UuXHJcbiAqL1xyXG5jb25zdCBmaWxsUmVzdGF1cmFudHNIVE1MID0gKHJlc3RhdXJhbnRzID0gc2VsZi5yZXN0YXVyYW50cykgPT4ge1xyXG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcclxuICByZXN0YXVyYW50cy5mb3JFYWNoKHJlc3RhdXJhbnQgPT4ge1xyXG4gICAgdWwuYXBwZW5kKGNyZWF0ZVJlc3RhdXJhbnRIVE1MKHJlc3RhdXJhbnQpKTtcclxuICB9KTtcclxuICBhZGRNYXJrZXJzVG9NYXAoKTtcclxuICBzd2l0Y2hMb2FkZXJUb01hcCgpO1xyXG4gIGNvbnNvbGUubG9nKCdSZXN0YXVyYW50cyBIVE1MIGZpbGxlZCcpO1xyXG4gIGFjdGl2YXRlTGF6eUxvYWRpbmcoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gdGhlIGF2ZXJhZ2Ugbm90ZSBvZiB0aGUgcmVzdGF1cmFudC5cclxuICovXHJcbmNvbnN0IGdldEF2ZXJhZ2VOb3RlID0gKHJldmlld3MpID0+IHtcclxuICBsZXQgYXZlcmFnZU5vdGUgPSAwO1xyXG4gIHJldmlld3MuZm9yRWFjaChyZXZpZXcgPT4ge1xyXG4gICAgYXZlcmFnZU5vdGUgPSBhdmVyYWdlTm90ZSArIE51bWJlcihyZXZpZXcucmF0aW5nKTtcclxuICB9KTtcclxuICBhdmVyYWdlTm90ZSA9IGF2ZXJhZ2VOb3RlIC8gcmV2aWV3cy5sZW5ndGg7XHJcbiAgcmV0dXJuIChNYXRoLnJvdW5kKGF2ZXJhZ2VOb3RlICogMTApKSAvIDEwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwuXHJcbiAqL1xyXG5jb25zdCBjcmVhdGVSZXN0YXVyYW50SFRNTCA9IChyZXN0YXVyYW50KSA9PiB7XHJcbiAgXHJcbiAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gIGNvbnN0IGZpZ3VyZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ZpZ3VyZScpO1xyXG4gIGNvbnN0IGZpZ2NhcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmaWdjYXB0aW9uJyk7XHJcbiAgY29uc3QgcGljdHVyZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3BpY3R1cmUnKTtcclxuICBjb25zdCBzb3VyY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcclxuICBjb25zdCBzZWNvbmRTb3VyY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcclxuICBjb25zdCB0aFNvdXJjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NvdXJjZScpO1xyXG4gIGNvbnN0IHNvdXJjZVdlYnAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzb3VyY2UnKTtcclxuICBjb25zdCBzZWNvbmRTb3VyY2VXZWJwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XHJcbiAgY29uc3QgdGhTb3VyY2VXZWJwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XHJcbiAgY29uc3QgaW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcclxuICBjb25zdCBjb250YWluZXJOb3RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXNpZGUnKTtcclxuICBjb25zdCBub3RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xyXG5cclxuICBzb3VyY2VXZWJwLmRhdGFzZXQuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGFyZ2VfeDEud2VicCAxeCwgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXJnZV94Mi53ZWJwIDJ4YDtcclxuICBzb3VyY2VXZWJwLnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhenkud2VicGA7XHJcbiAgc291cmNlV2VicC5tZWRpYSA9ICcobWluLXdpZHRoOiAxMDAwcHgpJztcclxuICBzb3VyY2VXZWJwLmNsYXNzTmFtZSA9ICdsYXp5JztcclxuICBzb3VyY2UuZGF0YXNldC5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhcmdlX3gxLmpwZyAxeCwgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhcmdlX3gyLmpwZyAyeGA7XHJcbiAgc291cmNlLnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhenkuanBnYDtcclxuICBzb3VyY2UubWVkaWEgPSAnKG1pbi13aWR0aDogMTAwMHB4KSc7XHJcbiAgc291cmNlLmNsYXNzTmFtZSA9ICdsYXp5JztcclxuICBcclxuICBzZWNvbmRTb3VyY2VXZWJwLmRhdGFzZXQuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbWVkaXVtX3gxLndlYnAgMXgsICR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbWVkaXVtX3gyLndlYnAgMnhgO1xyXG4gIHNlY29uZFNvdXJjZVdlYnAuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbGF6eS53ZWJwYDtcclxuICBzZWNvbmRTb3VyY2VXZWJwLm1lZGlhID0gJyhtaW4td2lkdGg6IDQyMHB4KSc7XHJcbiAgc2Vjb25kU291cmNlV2VicC5jbGFzc05hbWUgPSAnbGF6eSc7XHJcbiAgc2Vjb25kU291cmNlLmRhdGFzZXQuc3Jjc2V0ID0gYCR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1tZWRpdW1feDEuanBnIDF4LCAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tbWVkaXVtX3gyLmpwZyAyeGA7XHJcbiAgc2Vjb25kU291cmNlLnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhenkuanBnYDtcclxuICBzZWNvbmRTb3VyY2UubWVkaWEgPSAnKG1pbi13aWR0aDogNDIwcHgpJztcclxuICBzZWNvbmRTb3VyY2UuY2xhc3NOYW1lID0gJ2xhenknO1xyXG4gIFxyXG4gIHRoU291cmNlV2VicC5kYXRhc2V0LnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LXNtYWxsX3gyLndlYnAgMngsICR7REJIZWxwZXIuaW1hZ2VXZWJwVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tc21hbGxfeDEud2VicCAxeGA7XHJcbiAgdGhTb3VyY2VXZWJwLnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LWxhenkud2VicGA7XHJcbiAgdGhTb3VyY2VXZWJwLm1lZGlhID0gJyhtaW4td2lkdGg6IDMyMHB4KSc7XHJcbiAgdGhTb3VyY2VXZWJwLmNsYXNzTmFtZSA9ICdsYXp5JztcclxuICB0aFNvdXJjZS5kYXRhc2V0LnNyY3NldCA9IGAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tc21hbGxfeDIuanBnIDJ4LCAke0RCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KX0tc21hbGxfeDEuanBnIDF4YDtcclxuICB0aFNvdXJjZS5zcmNzZXQgPSBgJHtEQkhlbHBlci5pbWFnZVdlYnBVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXp5LmpwZ2A7XHJcbiAgdGhTb3VyY2UubWVkaWEgPSAnKG1pbi13aWR0aDogMzIwcHgpJztcclxuICB0aFNvdXJjZS5jbGFzc05hbWUgPSAnbGF6eSc7XHJcbiAgXHJcbiAgaW1hZ2UuZGF0YXNldC5zcmMgPSBgJHtEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCl9LXNtYWxsX3gxLmpwZ2A7XHJcbiAgaW1hZ2Uuc3JjID0gYCR7REJIZWxwZXIuaW1hZ2VVcmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpfS1sYXp5LmpwZ2A7XHJcbiAgaW1hZ2UuY2xhc3NOYW1lID0gJ3Jlc3RhdXJhbnQtaW1nIGxhenknO1xyXG4gIGltYWdlLnNldEF0dHJpYnV0ZSgnc2l6ZXMnLCAnKG1heC13aWR0aDogMTEwMHB4KSA4NXZ3LCAobWluLXdpZHRoOiAxMTAxcHgpIDk5MHB4Jyk7XHJcbiAgaW1hZ2UuYWx0ID0gYCR7cmVzdGF1cmFudC5uYW1lfSdzIHJlc3RhdXJhbnRgO1xyXG4gIFxyXG4gIG5vdGUuaW5uZXJIVE1MID0gYCR7Z2V0QXZlcmFnZU5vdGUocmVzdGF1cmFudC5yZXZpZXdzKX0vNWA7XHJcblxyXG4gIGNvbnRhaW5lck5vdGUuYXBwZW5kKG5vdGUpO1xyXG5cclxuICBwaWN0dXJlLmFwcGVuZChzb3VyY2VXZWJwKTtcclxuICBwaWN0dXJlLmFwcGVuZChzb3VyY2UpO1xyXG4gIHBpY3R1cmUuYXBwZW5kKHNlY29uZFNvdXJjZVdlYnApO1xyXG4gIHBpY3R1cmUuYXBwZW5kKHNlY29uZFNvdXJjZSk7XHJcbiAgcGljdHVyZS5hcHBlbmQodGhTb3VyY2VXZWJwKTtcclxuICBwaWN0dXJlLmFwcGVuZCh0aFNvdXJjZSk7XHJcbiAgcGljdHVyZS5hcHBlbmQoaW1hZ2UpO1xyXG4gIGZpZ3VyZS5hcHBlbmQocGljdHVyZSk7XHJcbiAgZmlndXJlLmFwcGVuZChmaWdjYXB0aW9uKTtcclxuICBcclxuICBsaS5hcHBlbmQoY29udGFpbmVyTm90ZSk7XHJcbiAgbGkuYXBwZW5kKGZpZ3VyZSk7XHJcbiAgXHJcbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gyJyk7XHJcbiAgbmFtZS5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5hbWU7XHJcbiAgZmlnY2FwdGlvbi5hcHBlbmQobmFtZSk7XHJcblxyXG4gIGNvbnN0IG5laWdoYm9yaG9vZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICBuZWlnaGJvcmhvb2QuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uZWlnaGJvcmhvb2Q7XHJcbiAgbGkuYXBwZW5kKG5laWdoYm9yaG9vZCk7XHJcblxyXG4gIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XHJcbiAgYWRkcmVzcy5pbm5lckhUTUwgPSByZXN0YXVyYW50LmFkZHJlc3M7XHJcbiAgbGkuYXBwZW5kKGFkZHJlc3MpO1xyXG5cclxuICBjb25zdCBtb3JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gIG1vcmUuaW5uZXJIVE1MID0gJ1ZpZXcgRGV0YWlscyc7XHJcbiAgbW9yZS5ocmVmID0gREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcclxuICBtb3JlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIGBWaWV3IGRldGFpbHMgb2YgJHtyZXN0YXVyYW50Lm5hbWV9YCk7XHJcbiAgbGkuYXBwZW5kKG1vcmUpO1xyXG5cclxuICBsaS5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnbGlzdGl0ZW0nKTtcclxuICBsaS5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2V0c2l6ZScsICcxMCcpO1xyXG4gIGxpLnNldEF0dHJpYnV0ZSgnYXJpYS1wb3NpbnNldCcsIHJlc3RhdXJhbnQuaWQpO1xyXG4gIHJldHVybiBsaTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGQgbWFya2VycyBmb3IgY3VycmVudCByZXN0YXVyYW50cyB0byB0aGUgbWFwLlxyXG4gKi9cclxuY29uc3QgYWRkTWFya2Vyc1RvTWFwID0gKHJlc3RhdXJhbnRzID0gc2VsZi5yZXN0YXVyYW50cykgPT4ge1xyXG4gIHJlc3RhdXJhbnRzLmZvckVhY2gocmVzdGF1cmFudCA9PiB7XHJcbiAgICAvLyBBZGQgbWFya2VyIHRvIHRoZSBtYXBcclxuICAgIGNvbnN0IG1hcmtlciA9IERCSGVscGVyLm1hcE1hcmtlckZvclJlc3RhdXJhbnQocmVzdGF1cmFudCwgc2VsZi5tYXApO1xyXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAnY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbWFya2VyLnVybDtcclxuICAgIH0pO1xyXG4gICAgc2VsZi5tYXJrZXJzLnB1c2gobWFya2VyKTtcclxuICB9KTtcclxufTtcclxuXHJcblxyXG4iXX0=
