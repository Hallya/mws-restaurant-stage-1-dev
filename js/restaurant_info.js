/* global DBHelper */

var restaurant;
var map;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(registration => {
      console.log('registration to serviceWorker complete with scope :', registration.scope);
    });
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.message === 'confirmed') {
        DBHelper.switchLoaderToMap();
        console.log('Switch done');
      }
    });
  });
}
/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL()
    .then(restaurant => {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      // self.map.addListener('idle', () => {
      //   DBHelper.switchLoaderToMap();
      // });
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      fillBreadcrumb();
    });
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    return console.error('No restaurant id in URL');
  }
  return DBHelper.fetchRestaurantById(id)
    .then(restaurant => self.restaurant = restaurant)
    .then(fillRestaurantHTML)
    .catch(error => console.error(error));
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  address.setAttribute('aria-label', `located at ${restaurant.address}`);
  
  // console.log(`webp: ${DBHelper.imageWebUrlForRestaurant(restaurant)}`);
  console.log(restaurant);
  const source = document.getElementById('restaurant-source');
  const sourceWebp = document.getElementById('restaurant-sourceWebp');

  sourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-large_x1.webp 1x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-large_x2.webp 2x`;
  sourceWebp.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-lazy.webp`;
  sourceWebp.media = '(min-width: 1000px)';
  sourceWebp.type = 'image/webp';
  console.log(`jpg: ${DBHelper.imageUrlForRestaurant(restaurant)}`);
  source.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-large_x2.jpg 2x`;
  source.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  source.media = '(min-width: 1000px)';
  source.type = 'image/jpeg';
  
  const ndSource = document.getElementById('restaurant-ndSource');
  const ndSourceWebp = document.getElementById('restaurant-ndSourceWebp');
  ndSourceWebp.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x1.webp 1x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x2.webp 2x`;
  ndSourceWebp.media = '(min-width: 420px)';
  ndSourceWebp.type = 'image/webp';
  ndSource.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x2.jpg 2x`;
  ndSource.media = '(min-width: 420px)';
  ndSource.type = 'image/jpeg';
  
  const thSource = document.getElementById('restaurant-thSource');
  const thSourceWebp = document.getElementById('restaurant-thSourceWebp');
  thSourceWebp.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x2.webp 2x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x1.webp 1x`;
  thSourceWebp.media = '(min-width: 320px)';
  thSourceWebp.type = 'image/webp';
  thSource.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x2.jpg 2x, ${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg 1x`;
  thSource.media = '(min-width: 320px)';
  thSource.type = 'image/jpeg';
  
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg`;
  image.setAttribute('sizes', '(max-width: 1100px) 85vw, (min-width: 1101px) 990px');
  image.alt = `${restaurant.name}'s  restaurant`;
  image.type = 'image/jpeg';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  const labelFoodType = document.createElement('label');
  labelFoodType.innerHTML = `${restaurant.cuisine_type} food`;
  labelFoodType.setAttribute('hidden', 'hidden');
  labelFoodType.id = 'foodType';
  cuisine.parentNode.insertBefore(labelFoodType, cuisine.nextSibling);

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
  return restaurant;
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.setAttribute('aria-label', `open on ${key}`);
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.setAttribute('aria-label', `${operatingHours[key]},`);
    row.appendChild(time);
    row.setAttribute('role', 'row');
    hours.appendChild(row);
  }
};


/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.className = 'userName';
  name.innerHTML = review.name;
  name.setAttribute('aria-label', `${review.name},`);
  li.appendChild(name);

  const date = document.createElement('p');
  date.className = 'dateReview';
  date.innerHTML = review.date;
  date.setAttribute('aria-label', `${review.date},`);
  li.appendChild(date);

  const rating = document.createElement('p');
  let stars = document.createElement('span');
  rating.className = 'userRating';
  stars.className = 'ratingStars';
  for (let i = 0; i < review.rating; i++) {
    stars.innerHTML += '★';
  }
  stars.setAttribute('aria-label', `${review.rating} stars on 5,`);
  rating.innerHTML = 'Rating: ';
  rating.appendChild(stars);
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'userComments';
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  li.setAttribute('role', 'listitem');
  li.setAttribute('aria-setsize', self.restaurant.reviews.length);
  li.setAttribute('aria-posinset', self.restaurant.reviews.indexOf(review)+1);
  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = ` ${restaurant.name}`;
  li.className = 'fontawesome-arrow-right';
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};