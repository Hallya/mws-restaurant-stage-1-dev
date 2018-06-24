const
  filterOptions = document.querySelector('.filter-options'),
  filterButton = document.getElementById('menuFilter');
  filterResultHeading = document.querySelector('.filter-options h3');
  
const launch = {
  goToRestaurantPage: (e) => {
    e.target.classList.toggle('move-left');
    window.location.assign(e.target.dataset.url)
  },
  fixedOnViewport: (referer, target) => {

    const clonedTarget = target.cloneNode(true);
    clonedTarget.className = 'fixed exclude';

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
            // target.classList.add('fixed');
          } else {
            if (target.classList.contains('shadow')){ target.classList.remove('shadow');}
            // if (target.classList.contains('fixed')) { target.classList.remove('fixed'); }
            clonedTarget.classList.remove('shadow');
            clonedTarget.classList.add('exclude');
          }
        });
      },options);
      observer.observe(referer);
    }
  },

  toggleMenu: () => {
    filterOptions.classList.toggle('optionsOpen');
    filterOptions.setAttribute('aria-hidden', 'false');
    filterButton.classList.toggle('pressed');
    filterButton.blur();
    filterResultHeading.setAttribute('tabindex', '-1');
    filterResultHeading.focus();
  },
  isFormValid: () => {
    if (document.querySelector('form').checkValidity()) {
      document.querySelector('form input[type="submit"]').style.color = "green";
    } else {
      document.querySelector('form input[type="submit"]').style.color = "#ca0000";
    }
  },
  toggleForm: () => {
    document.getElementById('title-container').classList.toggle("reviews-toggled");
    document.getElementById('reviews-list').classList.toggle("reviews-toggled");
    document.querySelector('section form').classList.toggle("toggled-display");
    setTimeout(() => {
      document.querySelector('section form').classList.toggle("toggled-translate");
    },800)
  },
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
      let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting || entry.intersectionRatio >= .01) {
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
      // Possibly fall back to a more compatible method here
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
  sortByNote: (a, b) => {
    const aNote = launch.getAverageNote(a.reviews)
    const bNote = launch.getAverageNote(b.reviews)
    if (bNote > aNote) {
      return 1
    }
    if (bNote < aNote) {
      return -1
    }
    return 0;
  },
  sortByName: (a, b) => {
    return a.name > b.name;
  },
  sortByNameInverted: (a, b) => {
    return a.name < b.name; 
  },
  getAverageNote: (id, reviews = self.reviews) => {
    let totalRatings = 0;
    let totalReviews = 0;
    reviews.forEach(review => {
      if (review.restaurant_id === id) {
        totalRatings += Number(review.rating);
        totalReviews++;
      }
    });
    totalRatings = totalRatings / totalReviews;
    return (Math.round(totalRatings * 10)) / 10;
  }
};
module.exports = launch;