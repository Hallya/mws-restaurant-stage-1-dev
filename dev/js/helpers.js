const
  filterOptions = document.querySelector('.filter-options'),
  filterButton = document.getElementById('menuFilter'),
  filterResultHeading = document.querySelector('.filter-options h3'),
  neighborhoodSelect = document.querySelector('#neighborhoods-select'),
  cuisineSelect = document.querySelector('#cuisines-select'),
  sortSelect = document.querySelector('#sort-select'),
  favorites = document.querySelector('#favorites'),

  launch = {

  /**
   * function go to restaurant page.
   */
  goToRestaurantPage: (e) => {
    e.target.classList.toggle('move-left');
    window.location.assign(e.target.dataset.url)
  },

  /**
   * function to create a fixed cloned element, in order to always keep access to controls for the user.
   */
  fixedOnViewport: (referer, target) => {

    const clonedTarget = target.cloneNode(true);
    clonedTarget.className = 'fixed exclude';
    clonedTarget.id = "";
    clonedTarget.setAttribute('aria-hidden', 'true');
    clonedTarget.tabIndex = -1;
    clonedTarget.children[0].children[0].setAttribute('aria-hidden', 'true');
    clonedTarget.children[0].children[0].tabIndex = -1;
    clonedTarget.children[1].setAttribute('aria-hidden', 'true');
    clonedTarget.children[1].tabIndex = -1;
    target.appendChild(clonedTarget);
    
    if ('IntersectionObserver' in window) {
      const options = {
        root: null,
        threshold: [0.01],
        rootMargin: "0px"
      }
      
      const observer = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          
          if (entry.intersectionRatio <= .01) {
            clonedTarget.classList.remove('exclude');
            clonedTarget.classList.add('shadow');
            target.classList.add('shadow');
          } else {
            if (target.classList.contains('shadow')){ target.classList.remove('shadow');}
            clonedTarget.classList.remove('shadow');
            clonedTarget.classList.add('exclude');
          }
        });
      },options);
      observer.observe(referer);
    }
  },

  /**
   * Show or hide the filter menu in main page
   */
  toggleMenu: () => {
    filterOptions.classList.toggle('optionsOpen');
    [filterOptions, neighborhoodSelect, cuisineSelect, sortSelect, favorites].forEach(filter => {
      filter.hidden = filter.hidden ? false : setTimeout(() => true, 2000);
    });

    // cuisineSelect.hidden = !cuisineSelect.hidden;
    // sortSelect.hidden = !sortSelect.hidden;
    // favorites.hidden = !favorites.hidden;
    filterButton.classList.toggle('pressed');
    filterButton.blur();
    filterResultHeading.setAttribute('tabindex', '-1');
    filterResultHeading.focus();
  },

  /**
   * Check weither the form is valid and apply style to give feedback to user.
   */
  isFormValid: () => {
    if (document.querySelector('form').checkValidity()) {
      document.querySelector('form input[type="submit"]').style.color = "green";
    } else {
      document.querySelector('form input[type="submit"]').style.color = "#ca0000";
    }
  },

  /**
   * Create animation on form creation or removal.
   */
  toggleForm: () => {
    document.getElementById('title-container').classList.toggle("reviews-toggled");
    document.getElementById('reviews-list').classList.toggle("reviews-toggled");
    document.querySelector('section form').classList.toggle("toggled-display");
    setTimeout(() => {
      document.querySelector('section form').classList.toggle("toggled-translate");
    },800)
  },

  /**
   * Function to lazy load image on main page.
   */
  lazyLoading:() => {
    const lazyImages = [].slice.call(document.querySelectorAll('.lazy'));

    if ('IntersectionObserver' in window) {
      const options = {
        root: null,
        threshold: [],
        rootMargin: "200px"
      }
      for (let i = 0.00; i <= 1; i += 0.01){
        options.threshold.push(Math.round(i*100)/100);
      }
      let lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(function (entry) {
          const lazyImage = entry.target;
          if (entry.isIntersecting || entry.intersectionRatio >= .01) {
            if (lazyImage.localName === 'source') {
              lazyImage.srcset = lazyImage.dataset.srcset;
            } else {
              lazyImage.src = lazyImage.dataset.src;
            }
            lazyImage.classList.remove('lazy');
            lazyImageObserver.unobserve(lazyImage);
          }
        });
      }, options);
      lazyImages.forEach(function (lazyImage) {
        lazyImageObserver.observe(lazyImage);
      });
      document.onreadystatechange = () => {
        if (document.readyState == "complete") {
          launch.lazyLoading();
        }
      }
    } else {
      // Possible fallback to a more compatible method here
      let lazyImages = [].slice.call(document.querySelectorAll('.lazy'));

      let active = false;
      const lazyLoad = function () {
        if (active === false) {
          active = true;
          const windowInnerHeight = window.innerHeight + 200;

          // setTimeout(function () {
          lazyImages.forEach(function (lazyImage) {
            if ((lazyImage.getBoundingClientRect().top <= windowInnerHeight
              && lazyImage.getBoundingClientRect().bottom >= 0)
              && getComputedStyle(lazyImage).display !== 'none') {
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
          // }, 200);
        }
      };
      document.addEventListener('scroll', lazyLoad);
      window.addEventListener('resize', lazyLoad);
      window.addEventListener('orientationchange', lazyLoad);
      if (document.readyState == "complete") {
        console.log('document ready for lazy load');
        lazyLoad();
      }
      document.onreadystatechange = function () {
        if (document.readyState == "complete") {
          console.log('document ready for lazy load');
          lazyLoad();
        }
      }
    }
  },

  /**
   * Sort restaurants by there notes on main page.
   */
  sortByNote: (a, b) => {
    const aNote = Number(a.average_rating.replace('/5', ''));
    const bNote = Number(b.average_rating.replace('/5', ''));
    if (aNote < bNote) {
      return 1
    }
    if (aNote > bNote) {
      return -1
    }
    return 0;
  },

  /**
   * Sort increasingly restaurants by there names on main page.
   */
  sortByName: (a, b) => {
    return a.name > b.name;
  },

  /**
   * Sort decreasingly restaurants by there name on main page.
   */
  sortByNameInverted: (a, b) => {
    return a.name < b.name; 
  },


  /**
   * Get the average note for each restaurant.
   */
  getAverageNote: (id, reviews = self.reviews) => {
    let totalRatings = 0;
    let totalReviews = 0;
    reviews && reviews.forEach(review => {
      if (review.restaurant_id === id) {
        totalRatings += Number(review.rating);
        totalReviews++;
      }
    });
    totalRatings = totalRatings / totalReviews;
    return totalRatings && `${(Math.round(totalRatings * 10)) / 10}/5` || 'N/A';
  },
};
module.exports = launch;