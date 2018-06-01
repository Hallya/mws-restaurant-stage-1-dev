const launch = {
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
        threshold: [0],
        rootMargin: "200px"
      }
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
      }, options);
      lazyImages.forEach(function (lazyImage) {
        lazyImageObserver.observe(lazyImage);
      });
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
  getAverageNote: (reviews) => {
    let averageNote = 0;
    reviews.forEach(review => {
      averageNote = averageNote + Number(review.rating);
    });
    averageNote = averageNote / reviews.length;
    return (Math.round(averageNote * 10)) / 10;
  }
};
module.exports = launch;