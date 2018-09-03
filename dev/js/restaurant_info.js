const DBHelper = require('./dbhelper');
const Launch = require('./helpers');

var restaurant;
var map;

const mapLoader = document.getElementById('map-loader');

/**
 * Try to register to service worker.
 */
window.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    const pathToServiceWorker = window.location.hostname === 'hallya.github.io' ? '/mws-restaurant-stage-1/sw.js' : '../sw.js'
    const registration = await navigator.serviceWorker.register(pathToServiceWorker).catch(error => console.error('Couldn\'t register to SW'))
    console.log('Registration to SW succeed with scope', registration.scope);
  }
})

/**
 * Try to register to tag events.
 */
window.addEventListener('load', async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready.catch(error => console.error('Couldn\'t get registration object from SW'))
    registration.sync.register('post-review');
    registration.sync.register('fetch-new-reviews');
    console.log('Registered to SW & "post-review" sync tag & "fetch-new-reviews" tag')
  }
})

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = async () => {
  const restaurant = await fetchRestaurantFromURL().catch(error => console.error(error));
  const mapPlaceHolder = document.createElement('div');

  mapPlaceHolder.setAttribute('aria-hidden', 'true');
  mapPlaceHolder.setAttribute('aria-hidden', 'true');
  mapPlaceHolder.id = "map";

  self.map = new google.maps.Map(mapPlaceHolder, {
    zoom: 16,
    center: {
      lat: restaurant.latlng.lat,
      lng: restaurant.latlng.lng
    },
    streetViewControl: false,
    zoomControl: true,
    fullscreenControl: true,
    mapTypeId: 'roadmap',
    mapTypeControl: false,
  })

  document.getElementById('map-container').appendChild(mapPlaceHolder);
  self.map.addListener('tilesloaded', function () {
      mapLoader.classList.toggle('hidden');
  });
  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  fillBreadcrumb();
  Launch.lazyLoading()
};

/**
 * Get restaurant from id in URL.
 */
const fetchRestaurantFromURL = async () => {
  if (self.restaurant) { // restaurant already fetched!
    return;
  }
  const id = getParameterByName('id');

  if (!id) { // no id found in URL
    return console.error('No restaurant id in URL');
  }

  const results = await Promise.all([
    DBHelper.fetchRestaurantById(id),
    DBHelper.fetchRestaurantReviews(id)
  ]).catch(error => console.error(error));

  self.reviews = results[1] && results[1].reverse();
  self.restaurant = results[0];

  return fillRestaurantHTML();
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
  sourceWebp.srcset = 'assets/img/svg/puff.svg';
  sourceWebp.className = 'lazy';
  sourceWebp.media = '(min-width: 1000px)';
  sourceWebp.type = 'image/webp';
  const source = document.createElement('source');
  source.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-large_x2.jpg 2x`;
  source.srcset = 'assets/img/svg/puff.svg';
  source.className = 'lazy';
  source.media = sourceWebp.media;
  source.type = 'image/jpeg';
  
  
  const ndSourceWebp = document.createElement('source');
  ndSourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x1.webp 1x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-medium_x2.webp 2x`;
  ndSourceWebp.srcset = 'assets/img/svg/puff.svg';
  ndSourceWebp.className = 'lazy';
  ndSourceWebp.media = '(min-width: 420px)';
  ndSourceWebp.type = 'image/webp';
  const ndSource = document.createElement('source');
  ndSource.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x1.jpg 1x, ${DBHelper.imageUrlForRestaurant(restaurant)}-medium_x2.jpg 2x`;
  ndSource.srcset = 'assets/img/svg/puff.svg';
  ndSource.className = 'lazy';
  ndSource.media = ndSourceWebp.media;
  ndSource.type = 'image/jpeg';
  
  const thSourceWebp = document.createElement('source');
  thSourceWebp.dataset.srcset = `${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x2.webp 2x, ${DBHelper.imageWebpUrlForRestaurant(restaurant)}-small_x1.webp 1x`;
  thSourceWebp.srcset = 'assets/img/svg/puff.svg';
  thSourceWebp.className = 'lazy';
  thSourceWebp.media = '(min-width: 320px)';
  thSourceWebp.type = 'image/webp';
  const thSource = document.createElement('source');
  thSource.dataset.srcset = `${DBHelper.imageUrlForRestaurant(restaurant)}-small_x2.jpg 2x, ${DBHelper.imageUrlForRestaurant(restaurant)}-small_x1.jpg 1x`;
  thSource.srcset = 'assets/img/svg/puff.svg';
  thSource.className = 'lazy';
  thSource.media = thSourceWebp.media;
  thSource.type = 'image/jpeg';
  
  const image = document.createElement('img');
  image.className = 'restaurant-img lazy';
  image.dataset.src = `${DBHelper.imageUrlForRestaurant(restaurant)}-large_x1.jpg`;
  image.src = 'assets/img/svg/puff.svg';
  image.setAttribute('sizes', '(max-width: 1100px) 85vw, (min-width: 1101px) 990px');
  image.alt = `${restaurant.name}'s  restaurant`;
  image.type = 'image/jpeg';

  const containerFavorite = document.createElement('button');
  const notFavorite = document.createElement('img');
  const favorite = document.createElement('img');

  containerFavorite.role = 'button';
  containerFavorite.id = restaurant.id;
  containerFavorite.className = 'container--favorite';
  containerFavorite.addEventListener('click',
    () => DBHelper.setFavorite(notFavorite, restaurant, containerFavorite, favorite));
  containerFavorite.setAttribute('aria-label', restaurant.is_favorite === 'true' ? `unset ${restaurant.name} as favorite`:`set ${restaurant.name} as favorite`);
  notFavorite.id = 'not-favorite';
  notFavorite.alt = 'unfavorite restaurant';
  notFavorite.src = 'assets/img/svg/not-favorite.svg';
  notFavorite.className = restaurant.is_favorite === 'true' && 'hidden';
  notFavorite.setAttribute('aria-hidden', restaurant.is_favorite === 'true' ? 'true':'false');
  favorite.id = 'favorite';
  favorite.alt = 'favorite restaurant';
  favorite.src = 'assets/img/svg/favorite.svg';
  favorite.setAttribute('aria-hidden', restaurant.is_favorite === 'true' ? 'false' : 'true');


  containerFavorite.append(favorite);
  containerFavorite.append(notFavorite);
  
  picture.appendChild(sourceWebp);
  picture.appendChild(source);
  picture.appendChild(ndSourceWebp);
  picture.appendChild(ndSource);
  picture.appendChild(thSourceWebp);
  picture.appendChild(thSource);
  picture.appendChild(image);
  figure.insertBefore(picture, figcaption);
  figure.append(containerFavorite);

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
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const titleContainer = document.createElement('div');
  const title = document.createElement('h3');
  const addReview = document.createElement('button');
  const addContent = document.createElement('span');
  const deleteContent = document.createElement('span');

  title.innerHTML = 'Reviews';
  addContent.innerHTML = "+";
  deleteContent.innerHTML = "-";
  deleteContent.className = "toggled";
  titleContainer.id = "title-container";

  addReview.addEventListener('click', showForm);
  addReview.appendChild(addContent);
  addReview.appendChild(deleteContent);

  titleContainer.appendChild(title);
  titleContainer.appendChild(addReview);

  container.appendChild(titleContainer);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    return container.appendChild(noReviews);
  }

  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * create and display a form on click event.
 */
const showForm = async () => {

  const form = document.createElement('form');
  const labelNameInput = document.createElement('label');
  const nameInput = document.createElement('input');
  const ratingFieldset = document.createElement('fieldset');
  const appreciation = ['awful', 'bad', 'ok', 'good', 'excellent'];
  
  form.autocomplete = 'on';

  nameInput.id = 'form-name';
  nameInput.type = 'text';
  nameInput.name = 'name';
  nameInput.placeholder = 'Your name';
  nameInput.minLength = '2';
  nameInput.maxLength = '50';
  nameInput.pattern = '^[a-zA-Z\s]+$';
  nameInput.required = true;

  labelNameInput.setAttribute('for', nameInput.id);
  labelNameInput.className = "visuallyHidden";
  labelNameInput.innerHTML = "Enter your name";
  
  ratingFieldset.className = 'new-rating';

  for (let i = 5; i > 0; i--){

    const starInput = document.createElement('input');
    const starLabel = document.createElement('label');
    
    starInput.type = 'radio';
    starInput.id = `star${i}`;
    starInput.setAttribute('aria-label', `It was ${appreciation[i - 1]}`);
    starInput.name = 'rating';
    starInput.value = i;
    starInput.value = i;
    starInput.required = true;
    starInput.addEventListener('input', Launch.isFormValid);
    
    starLabel.for = `star${i}`;
    

    ratingFieldset.appendChild(starInput);
    ratingFieldset.appendChild(starLabel);
  }
  
  const labelCommentsInput = document.createElement('label');
  const commentsInput = document.createElement('textarea');
  const labelSubmitButton = document.createElement('label');
  const submitButton = document.createElement('input');

  commentsInput.id = 'form-comment';
  commentsInput.name = 'comments';
  commentsInput.type = 'text';
  commentsInput.required = true;
  commentsInput.minLength = 3;
  commentsInput.maxLength = 5000;
  commentsInput.placeholder = 'Your comment';
  commentsInput.setAttribute('aria-label', `Type your comments about your experience`)
  commentsInput.addEventListener('keydown', autosize);

  
  labelCommentsInput.setAttribute('for', commentsInput.id);
  labelCommentsInput.className = 'visuallyHidden';
  labelCommentsInput.innerHTML = 'Enter your opinion about this restaurant';

  submitButton.id = 'form-submit';
  submitButton.type = 'submit';
  submitButton.value = 'Save';

  labelSubmitButton.setAttribute('for', submitButton.id);
  labelSubmitButton.className = 'visuallyHidden';

  nameInput.addEventListener('change', Launch.isFormValid);
  commentsInput.addEventListener('input', Launch.isFormValid);

  form.appendChild(labelNameInput);
  form.appendChild(nameInput);
  form.appendChild(ratingFieldset);
  form.appendChild(labelCommentsInput);
  form.appendChild(commentsInput);
  form.appendChild(submitButton);
  form.appendChild(labelSubmitButton);

  form.addEventListener('submit', DBHelper.postReview);

  document.getElementById('title-container').classList.toggle('form-open');
  document.getElementById('title-container').appendChild(form);
  form.classList.toggle('form-toggled');
  setTimeout(() => {
  }, 300)
  document.querySelector('#title-container button').removeEventListener('click', showForm);
  document.querySelector('#title-container button').addEventListener('click', hideForm);
  document.querySelectorAll('#title-container button span').forEach(span => span.classList.toggle('toggled'));
  const result = await Notification.requestPermission();
  switch (result) {
    case 'denied':
      return console.log('Permission wasn\'t granted. Allow a retry.');
      break;
    case 'default':
      return console.log('The permission request was dismissed.');
      break;
    case 'granted':
      return console.log('Notification allowed');
      break;
    default:
      return;
  }
}

/**
 * hide and remove the form on click event.
 */
const hideForm = () => {
  document.querySelector('#title-container form').classList.toggle('form-toggled');
  document.getElementById('title-container').classList.toggle('form-open');
  setTimeout(() => {
    document.querySelector('#title-container form').remove();
  }, 300)
  document.querySelectorAll('#title-container button span').forEach(span => span.classList.toggle('toggled'))
  document.querySelector('#title-container button').removeEventListener('click', hideForm);
  document.querySelector('#title-container button').addEventListener('click', showForm);
}
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
  const convertDate = new Date(Number(review.updatedAt));
  date.innerHTML = convertDate.toDateString();
  date.setAttribute('aria-label', `${date.innerHTML},`);
  li.appendChild(date);

  const rating = document.createElement('p');
  let stars = document.createElement('span');
  rating.className = 'userRating';
  stars.className = 'ratingStars';
  for (let i = 0; i < review.rating; i++) {
    const star = document.createElement('span');
    star.innerHTML += '★';
    star.className = `star${i + 1}`
    stars.appendChild(star);
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
  li.tabIndex = 0;
  li.setAttribute('aria-setsize', self.reviews.length);
  li.setAttribute('aria-posinset', self.reviews.indexOf(review)+1);
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
  li.tabIndex = 0;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
  Launch.fixedOnViewport(document.querySelector('nav'), document.querySelector('#breadcrumb'));
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

/**
 * Modify text area heigth to adapt the content.
 */
function autosize() {
  const el = this;
  document.getElementById('title-container').style.height = 'auto';
  el.style.cssText = 'height:auto; padding:0';
  el.style.cssText = 'height:' + el.scrollHeight + 'px';
}