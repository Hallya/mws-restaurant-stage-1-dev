/* global DBHelper */
import DBHelper from './dbhelper';
import Launch from './helpers';
var restaurant;
var map;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const pathToServiceWorker = window.location.hostname === 'hallya.github.io' ? '/mws-restaurant-stage-1/sw.js' : '../sw.js'
    navigator.serviceWorker.register(pathToServiceWorker).then(registration => console.log('registration to serviceWorker complete with scope :', registration.scope));
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
      })
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      fillBreadcrumb();
    })
    .then(Launch.lazyLoading)
    .catch(error => console.error(error));
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
    console.log('restaurant already fetch');
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
  
  const figure = document.getElementsByTagName('figure')[0];
  const figcaption = document.getElementsByTagName('figcaption')[0];
  const picture = document.createElement('picture');
  
  const sourceWebp = document.createElement('source');
  sourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-large_x1.webp 1x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-large_x2.webp 2x`;
  sourceWebp.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-lazy.webp`;
  sourceWebp.className = 'lazy';
  sourceWebp.media = '(min-width: 1000px)';
  sourceWebp.type = 'image/webp';
  const source = document.createElement('source');
  source.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-large_x2.jpg 2x`;
  source.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  source.className = 'lazy';
  source.media = sourceWebp.media;
  source.type = 'image/jpeg';
  
  
  const ndSourceWebp = document.createElement('source');
  ndSourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x1.webp 1x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x2.webp 2x`;
  ndSourceWebp.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  ndSourceWebp.className = 'lazy';
  ndSourceWebp.media = '(min-width: 420px)';
  ndSourceWebp.type = 'image/webp';
  const ndSource = document.createElement('source');
  ndSource.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x2.jpg 2x`;
  ndSource.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  ndSource.className = 'lazy';
  ndSource.media = ndSourceWebp.media;
  ndSource.type = 'image/jpeg';
  
  const thSourceWebp = document.createElement('source');
  thSourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x2.webp 2x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x1.webp 1x`;
  thSourceWebp.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  thSourceWebp.className = 'lazy';
  thSourceWebp.media = '(min-width: 320px)';
  thSourceWebp.type = 'image/webp';
  const thSource = document.createElement('source');
  thSource.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x2.jpg 2x, ${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg 1x`;
  thSource.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  thSource.className = 'lazy';
  thSource.media = thSourceWebp.media;
  thSource.type = 'image/jpeg';
  
  const image = document.createElement('img');
  image.className = 'restaurant-img lazy';
  image.dataset.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg`;
  image.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-lazy.jpg`;
  image.setAttribute('sizes', '(max-width: 1100px) 85vw, (min-width: 1101px) 990px');
  image.alt = `${restaurant.name}'s  restaurant`;
  image.type = 'image/jpeg';

  picture.appendChild(sourceWebp);
  picture.appendChild(source);
  picture.appendChild(ndSourceWebp);
  picture.appendChild(ndSource);
  picture.appendChild(thSourceWebp);
  picture.appendChild(thSource);
  picture.appendChild(image);
  figure.insertBefore(picture, figcaption);
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