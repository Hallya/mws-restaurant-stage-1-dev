'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DBHelper = function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: 'fetchRestaurants',


    /**
     * Fetch all restaurants.
     */
    value: function fetchRestaurants() {
      return fetch(DBHelper.DATABASE_URL).then(function (response) {
        return response.json();
      }).catch(function (error) {
        return console.error('Request failed. Returned status of ' + error);
      });
    }

    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: 'fetchRestaurantById',
    value: function fetchRestaurantById(id) {
      // fetch all restaurants with proper error handling.
      return fetch(DBHelper.DATABASE_URL).then(function (response) {
        return response.json();
      }).then(function (data) {
        return data.restaurants[id - 1];
      }).catch(function (error) {
        return console.error('Restaurant does not exist: ' + error);
      });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisine',
    value: function fetchRestaurantByCuisine(cuisine) {
      // Fetch all restaurants  with proper error handling
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        return restaurants.restaurants.filter(function (r) {
          return r.cuisine_type == cuisine;
        });
      }).catch(function (error) {
        return console.error(error);
      });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByNeighborhood',
    value: function fetchRestaurantByNeighborhood(neighborhood) {
      // Fetch all restaurants
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        return restaurants.restaurants.filter(function (r) {
          return r.neighborhood == neighborhood;
        });
      }).catch(function (error) {
        return console.error(error);
      });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisineAndNeighborhood',
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
      // Fetch all restaurants
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        var results = restaurants.restaurants;
        if (cuisine !== 'all') {
          results = restaurants.restaurants.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
        }
        if (neighborhood !== 'all') {
          results = restaurants.restaurants.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
        }
        return results;
      }).catch(function (error) {
        return console.error(error);
      });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: 'fetchNeighborhoods',
    value: function fetchNeighborhoods() {
      // Fetch all restaurants
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        // Get all neighborhoods from all restaurants
        var neighborhoods = restaurants.restaurants.map(function (restaurant) {
          return restaurant.neighborhood;
        });
        // Remove duplicates from neighborhoods
        var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
          return neighborhoods.indexOf(v) == i;
        });
        return uniqueNeighborhoods;
      }).catch(function (error) {
        return console.error(error);
      });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: 'fetchCuisines',
    value: function fetchCuisines() {
      // Fetch all restaurants
      return DBHelper.fetchRestaurants().then(function (restaurants) {
        // Get all cuisines from all restaurants
        var cuisines = restaurants.restaurants.map(function (restaurant) {
          return restaurant.cuisine_type;
        });
        // Remove duplicates from cuisines
        var uniqueCuisines = cuisines.filter(function (v, i) {
          return cuisines.indexOf(v) == i;
        });
        return uniqueCuisines;
      }).catch(function (error) {
        return console.error(error);
      });
    }

    /**
     * Restaurant page URL.
     */

  }, {
    key: 'urlForRestaurant',
    value: function urlForRestaurant(restaurant) {
      return 'restaurant.html?id=' + restaurant.id;
    }

    /**
     * Restaurant image URL.
     */

  }, {
    key: 'imageUrlForRestaurant',
    value: function imageUrlForRestaurant(restaurant) {
      return 'assets/img/jpg/' + restaurant.photograph;
    }
  }, {
    key: 'imageWebpUrlForRestaurant',
    value: function imageWebpUrlForRestaurant(restaurant) {
      return 'assets/img/webp/' + restaurant.photograph;
    }

    /**q
     * Map marker for a restaurant.
     */

  }, {
    key: 'mapMarkerForRestaurant',
    value: function mapMarkerForRestaurant(restaurant, map) {
      var marker = new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP });
      return marker;
    }
  }, {
    key: 'switchLoaderToMap',
    value: function switchLoaderToMap() {
      if (document.getElementById('map').classList.contains('hidden')) {
        document.getElementById('map').classList.remove('hidden');
        document.getElementById('map-loader').classList.add('hidden');
      }
      return;
    }
  }, {
    key: 'sendMessage',
    value: function sendMessage(message) {
      return new Promise(function (resolve, reject) {
        var messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = function (event) {
          if (event.data.error) {
            reject(event.data.error);
          } else {
            resolve(event.data);
          }
        };
        navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
      });
    }
  }, {
    key: 'DATABASE_URL',
    get: function get() {
      // const path = window.location.hostname === 'hallya.github.io' ? 'data/restaurants.json' : 'http://localhost:1337/restaurants';
      var path = 'data/restaurants.json';
      return path;
    }
  }]);

  return DBHelper;
}();
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIl0sIm5hbWVzIjpbIkRCSGVscGVyIiwiZmV0Y2giLCJEQVRBQkFTRV9VUkwiLCJ0aGVuIiwicmVzcG9uc2UiLCJqc29uIiwiY2F0Y2giLCJjb25zb2xlIiwiZXJyb3IiLCJpZCIsImRhdGEiLCJyZXN0YXVyYW50cyIsImN1aXNpbmUiLCJmZXRjaFJlc3RhdXJhbnRzIiwiZmlsdGVyIiwiciIsImN1aXNpbmVfdHlwZSIsIm5laWdoYm9yaG9vZCIsInJlc3VsdHMiLCJuZWlnaGJvcmhvb2RzIiwibWFwIiwicmVzdGF1cmFudCIsInVuaXF1ZU5laWdoYm9yaG9vZHMiLCJ2IiwiaSIsImluZGV4T2YiLCJjdWlzaW5lcyIsInVuaXF1ZUN1aXNpbmVzIiwicGhvdG9ncmFwaCIsIm1hcmtlciIsImdvb2dsZSIsIm1hcHMiLCJNYXJrZXIiLCJwb3NpdGlvbiIsImxhdGxuZyIsInRpdGxlIiwibmFtZSIsInVybCIsInVybEZvclJlc3RhdXJhbnQiLCJhbmltYXRpb24iLCJBbmltYXRpb24iLCJEUk9QIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImNsYXNzTGlzdCIsImNvbnRhaW5zIiwicmVtb3ZlIiwiYWRkIiwibWVzc2FnZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwibWVzc2FnZUNoYW5uZWwiLCJNZXNzYWdlQ2hhbm5lbCIsInBvcnQxIiwib25tZXNzYWdlIiwiZXZlbnQiLCJuYXZpZ2F0b3IiLCJzZXJ2aWNlV29ya2VyIiwiY29udHJvbGxlciIsInBvc3RNZXNzYWdlIiwicG9ydDIiLCJwYXRoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7SUFBTUEsUTs7Ozs7Ozs7O0FBUUo7Ozt1Q0FHMEI7QUFDeEIsYUFBT0MsTUFBTUQsU0FBU0UsWUFBZixFQUNKQyxJQURJLENBQ0M7QUFBQSxlQUFZQyxTQUFTQyxJQUFULEVBQVo7QUFBQSxPQURELEVBRUpDLEtBRkksQ0FFRTtBQUFBLGVBQVNDLFFBQVFDLEtBQVIseUNBQW9EQSxLQUFwRCxDQUFUO0FBQUEsT0FGRixDQUFQO0FBR0Q7O0FBRUQ7Ozs7Ozt3Q0FHMkJDLEUsRUFBSTtBQUM3QjtBQUNBLGFBQU9SLE1BQU1ELFNBQVNFLFlBQWYsRUFDSkMsSUFESSxDQUNDO0FBQUEsZUFBWUMsU0FBU0MsSUFBVCxFQUFaO0FBQUEsT0FERCxFQUVKRixJQUZJLENBRUMsZ0JBQVE7QUFDWixlQUFPTyxLQUFLQyxXQUFMLENBQWlCRixLQUFLLENBQXRCLENBQVA7QUFDRCxPQUpJLEVBS0pILEtBTEksQ0FLRTtBQUFBLGVBQVNDLFFBQVFDLEtBQVIsaUNBQTRDQSxLQUE1QyxDQUFUO0FBQUEsT0FMRixDQUFQO0FBTUQ7O0FBRUQ7Ozs7Ozs2Q0FHZ0NJLE8sRUFBUztBQUN2QztBQUNBLGFBQU9aLFNBQVNhLGdCQUFULEdBQ0pWLElBREksQ0FDQztBQUFBLGVBQWVRLFlBQVlBLFdBQVosQ0FBd0JHLE1BQXhCLENBQStCO0FBQUEsaUJBQUtDLEVBQUVDLFlBQUYsSUFBa0JKLE9BQXZCO0FBQUEsU0FBL0IsQ0FBZjtBQUFBLE9BREQsRUFFSk4sS0FGSSxDQUVFO0FBQUEsZUFBU0MsUUFBUUMsS0FBUixDQUFjQSxLQUFkLENBQVQ7QUFBQSxPQUZGLENBQVA7QUFHRDs7QUFFRDs7Ozs7O2tEQUdxQ1MsWSxFQUFjO0FBQ2pEO0FBQ0EsYUFBT2pCLFNBQVNhLGdCQUFULEdBQ0pWLElBREksQ0FDQztBQUFBLGVBQWVRLFlBQVlBLFdBQVosQ0FBd0JHLE1BQXhCLENBQStCO0FBQUEsaUJBQUtDLEVBQUVFLFlBQUYsSUFBa0JBLFlBQXZCO0FBQUEsU0FBL0IsQ0FBZjtBQUFBLE9BREQsRUFFSlgsS0FGSSxDQUVFO0FBQUEsZUFBU0MsUUFBUUMsS0FBUixDQUFjQSxLQUFkLENBQVQ7QUFBQSxPQUZGLENBQVA7QUFHRDs7QUFFRDs7Ozs7OzREQUcrQ0ksTyxFQUFTSyxZLEVBQWM7QUFDcEU7QUFDQSxhQUFPakIsU0FBU2EsZ0JBQVQsR0FDSlYsSUFESSxDQUNDLHVCQUFlO0FBQ25CLFlBQUllLFVBQVVQLFlBQVlBLFdBQTFCO0FBQ0EsWUFBSUMsWUFBWSxLQUFoQixFQUF1QjtBQUNyQk0sb0JBQVVQLFlBQVlBLFdBQVosQ0FBd0JHLE1BQXhCLENBQStCO0FBQUEsbUJBQUtDLEVBQUVDLFlBQUYsSUFBa0JKLE9BQXZCO0FBQUEsV0FBL0IsQ0FBVjtBQUNEO0FBQ0QsWUFBSUssaUJBQWlCLEtBQXJCLEVBQTRCO0FBQzFCQyxvQkFBVVAsWUFBWUEsV0FBWixDQUF3QkcsTUFBeEIsQ0FBK0I7QUFBQSxtQkFBS0MsRUFBRUUsWUFBRixJQUFrQkEsWUFBdkI7QUFBQSxXQUEvQixDQUFWO0FBQ0Q7QUFDRCxlQUFPQyxPQUFQO0FBQ0QsT0FWSSxFQVdKWixLQVhJLENBV0U7QUFBQSxlQUFTQyxRQUFRQyxLQUFSLENBQWNBLEtBQWQsQ0FBVDtBQUFBLE9BWEYsQ0FBUDtBQVlEOztBQUVEOzs7Ozs7eUNBRzRCO0FBQzFCO0FBQ0EsYUFBT1IsU0FBU2EsZ0JBQVQsR0FDSlYsSUFESSxDQUNDLHVCQUFlO0FBQ25CO0FBQ0EsWUFBTWdCLGdCQUFnQlIsWUFBWUEsV0FBWixDQUF3QlMsR0FBeEIsQ0FBNEI7QUFBQSxpQkFBY0MsV0FBV0osWUFBekI7QUFBQSxTQUE1QixDQUF0QjtBQUNBO0FBQ0EsWUFBTUssc0JBQXNCSCxjQUFjTCxNQUFkLENBQXFCLFVBQUNTLENBQUQsRUFBSUMsQ0FBSjtBQUFBLGlCQUFVTCxjQUFjTSxPQUFkLENBQXNCRixDQUF0QixLQUE0QkMsQ0FBdEM7QUFBQSxTQUFyQixDQUE1QjtBQUNBLGVBQU9GLG1CQUFQO0FBQ0QsT0FQSSxFQVFKaEIsS0FSSSxDQVFFO0FBQUEsZUFBU0MsUUFBUUMsS0FBUixDQUFjQSxLQUFkLENBQVQ7QUFBQSxPQVJGLENBQVA7QUFTRDs7QUFFRDs7Ozs7O29DQUd1QjtBQUNyQjtBQUNBLGFBQU9SLFNBQVNhLGdCQUFULEdBQ0pWLElBREksQ0FDQyx1QkFBZTtBQUNuQjtBQUNBLFlBQU11QixXQUFXZixZQUFZQSxXQUFaLENBQXdCUyxHQUF4QixDQUE0QjtBQUFBLGlCQUFjQyxXQUFXTCxZQUF6QjtBQUFBLFNBQTVCLENBQWpCO0FBQ0E7QUFDQSxZQUFNVyxpQkFBaUJELFNBQVNaLE1BQVQsQ0FBZ0IsVUFBQ1MsQ0FBRCxFQUFJQyxDQUFKO0FBQUEsaUJBQVVFLFNBQVNELE9BQVQsQ0FBaUJGLENBQWpCLEtBQXVCQyxDQUFqQztBQUFBLFNBQWhCLENBQXZCO0FBQ0EsZUFBT0csY0FBUDtBQUNELE9BUEksRUFPRnJCLEtBUEUsQ0FPSTtBQUFBLGVBQVNDLFFBQVFDLEtBQVIsQ0FBY0EsS0FBZCxDQUFUO0FBQUEsT0FQSixDQUFQO0FBUUQ7O0FBRUQ7Ozs7OztxQ0FHd0JhLFUsRUFBWTtBQUNsQyxxQ0FBOEJBLFdBQVdaLEVBQXpDO0FBQ0Q7O0FBRUQ7Ozs7OzswQ0FHNkJZLFUsRUFBWTtBQUN2QyxpQ0FBMEJBLFdBQVdPLFVBQXJDO0FBQ0Q7Ozs4Q0FFZ0NQLFUsRUFBWTtBQUMzQyxrQ0FBMkJBLFdBQVdPLFVBQXRDO0FBQ0Q7O0FBRUQ7Ozs7OzsyQ0FHOEJQLFUsRUFBWUQsRyxFQUFLO0FBQzdDLFVBQU1TLFNBQVMsSUFBSUMsT0FBT0MsSUFBUCxDQUFZQyxNQUFoQixDQUF1QjtBQUNwQ0Msa0JBQVVaLFdBQVdhLE1BRGU7QUFFcENDLGVBQU9kLFdBQVdlLElBRmtCO0FBR3BDQyxhQUFLckMsU0FBU3NDLGdCQUFULENBQTBCakIsVUFBMUIsQ0FIK0I7QUFJcENELGFBQUtBLEdBSitCO0FBS3BDbUIsbUJBQVdULE9BQU9DLElBQVAsQ0FBWVMsU0FBWixDQUFzQkMsSUFMRyxFQUF2QixDQUFmO0FBT0EsYUFBT1osTUFBUDtBQUNEOzs7d0NBRTBCO0FBQ3pCLFVBQUlhLFNBQVNDLGNBQVQsQ0FBd0IsS0FBeEIsRUFBK0JDLFNBQS9CLENBQXlDQyxRQUF6QyxDQUFrRCxRQUFsRCxDQUFKLEVBQWlFO0FBQy9ESCxpQkFBU0MsY0FBVCxDQUF3QixLQUF4QixFQUErQkMsU0FBL0IsQ0FBeUNFLE1BQXpDLENBQWdELFFBQWhEO0FBQ0FKLGlCQUFTQyxjQUFULENBQXdCLFlBQXhCLEVBQXNDQyxTQUF0QyxDQUFnREcsR0FBaEQsQ0FBb0QsUUFBcEQ7QUFDRDtBQUNEO0FBQ0Q7OztnQ0FFa0JDLE8sRUFBUztBQUMxQixhQUFPLElBQUlDLE9BQUosQ0FBWSxVQUFVQyxPQUFWLEVBQW1CQyxNQUFuQixFQUEyQjtBQUM1QyxZQUFJQyxpQkFBaUIsSUFBSUMsY0FBSixFQUFyQjtBQUNBRCx1QkFBZUUsS0FBZixDQUFxQkMsU0FBckIsR0FBaUMsVUFBVUMsS0FBVixFQUFpQjtBQUNoRCxjQUFJQSxNQUFNOUMsSUFBTixDQUFXRixLQUFmLEVBQXNCO0FBQ3BCMkMsbUJBQU9LLE1BQU05QyxJQUFOLENBQVdGLEtBQWxCO0FBQ0QsV0FGRCxNQUVPO0FBQ0wwQyxvQkFBUU0sTUFBTTlDLElBQWQ7QUFDRDtBQUNGLFNBTkQ7QUFPQStDLGtCQUFVQyxhQUFWLENBQXdCQyxVQUF4QixDQUFtQ0MsV0FBbkMsQ0FBK0NaLE9BQS9DLEVBQ0UsQ0FBQ0ksZUFBZVMsS0FBaEIsQ0FERjtBQUVELE9BWE0sQ0FBUDtBQVlEOzs7d0JBdkp5QjtBQUN4QjtBQUNBLFVBQU1DLE9BQU8sdUJBQWI7QUFDQSxhQUFPQSxJQUFQO0FBQ0QiLCJmaWxlIjoiZGJoZWxwZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBEQkhlbHBlciB7XHJcblxyXG4gIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xyXG4gICAgLy8gY29uc3QgcGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSA9PT0gJ2hhbGx5YS5naXRodWIuaW8nID8gJ2RhdGEvcmVzdGF1cmFudHMuanNvbicgOiAnaHR0cDovL2xvY2FsaG9zdDoxMzM3L3Jlc3RhdXJhbnRzJztcclxuICAgIGNvbnN0IHBhdGggPSAnZGF0YS9yZXN0YXVyYW50cy5qc29uJztcclxuICAgIHJldHVybiBwYXRoO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIHJlc3RhdXJhbnRzLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRzKCkge1xyXG4gICAgcmV0dXJuIGZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcclxuICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuanNvbigpKVxyXG4gICAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcihgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke2Vycm9yfWApKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEZldGNoIGEgcmVzdGF1cmFudCBieSBpdHMgSUQuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5SWQoaWQpIHtcclxuICAgIC8vIGZldGNoIGFsbCByZXN0YXVyYW50cyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgIHJldHVybiBmZXRjaChEQkhlbHBlci5EQVRBQkFTRV9VUkwpXHJcbiAgICAgIC50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLmpzb24oKSlcclxuICAgICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGRhdGEucmVzdGF1cmFudHNbaWQgLSAxXTtcclxuICAgICAgfSlcclxuICAgICAgLmNhdGNoKGVycm9yID0+IGNvbnNvbGUuZXJyb3IoYFJlc3RhdXJhbnQgZG9lcyBub3QgZXhpc3Q6ICR7ZXJyb3J9YCkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIHR5cGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZShjdWlzaW5lKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHMgIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nXHJcbiAgICByZXR1cm4gREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpXHJcbiAgICAgIC50aGVuKHJlc3RhdXJhbnRzID0+IHJlc3RhdXJhbnRzLnJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIuY3Vpc2luZV90eXBlID09IGN1aXNpbmUpKVxyXG4gICAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcihlcnJvcikpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBuZWlnaGJvcmhvb2Qgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXHJcbiAgICovXHJcbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kKG5laWdoYm9yaG9vZCkge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICByZXR1cm4gREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpXHJcbiAgICAgIC50aGVuKHJlc3RhdXJhbnRzID0+IHJlc3RhdXJhbnRzLnJlc3RhdXJhbnRzLmZpbHRlcihyID0+IHIubmVpZ2hib3Job29kID09IG5laWdoYm9yaG9vZCkpXHJcbiAgICAgIC5jYXRjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGVycm9yKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgYW5kIGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QoY3Vpc2luZSwgbmVpZ2hib3Job29kKSB7XHJcbiAgICAvLyBGZXRjaCBhbGwgcmVzdGF1cmFudHNcclxuICAgIHJldHVybiBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKClcclxuICAgICAgLnRoZW4ocmVzdGF1cmFudHMgPT4ge1xyXG4gICAgICAgIGxldCByZXN1bHRzID0gcmVzdGF1cmFudHMucmVzdGF1cmFudHM7XHJcbiAgICAgICAgaWYgKGN1aXNpbmUgIT09ICdhbGwnKSB7XHJcbiAgICAgICAgICByZXN1bHRzID0gcmVzdGF1cmFudHMucmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuZWlnaGJvcmhvb2QgIT09ICdhbGwnKSB7XHJcbiAgICAgICAgICByZXN1bHRzID0gcmVzdGF1cmFudHMucmVzdGF1cmFudHMuZmlsdGVyKHIgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChlcnJvciA9PiBjb25zb2xlLmVycm9yKGVycm9yKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBGZXRjaCBhbGwgbmVpZ2hib3Job29kcyB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cclxuICAgKi9cclxuICBzdGF0aWMgZmV0Y2hOZWlnaGJvcmhvb2RzKCkge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICByZXR1cm4gREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpXHJcbiAgICAgIC50aGVuKHJlc3RhdXJhbnRzID0+IHtcclxuICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcclxuICAgICAgICBjb25zdCBuZWlnaGJvcmhvb2RzID0gcmVzdGF1cmFudHMucmVzdGF1cmFudHMubWFwKHJlc3RhdXJhbnQgPT4gcmVzdGF1cmFudC5uZWlnaGJvcmhvb2QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gbmVpZ2hib3Job29kc1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpO1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVOZWlnaGJvcmhvb2RzO1xyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcihlcnJvcikpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmV0Y2ggYWxsIGN1aXNpbmVzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxyXG4gICAqL1xyXG4gIHN0YXRpYyBmZXRjaEN1aXNpbmVzKCkge1xyXG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXHJcbiAgICByZXR1cm4gREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygpXHJcbiAgICAgIC50aGVuKHJlc3RhdXJhbnRzID0+IHtcclxuICAgICAgICAvLyBHZXQgYWxsIGN1aXNpbmVzIGZyb20gYWxsIHJlc3RhdXJhbnRzXHJcbiAgICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5yZXN0YXVyYW50cy5tYXAocmVzdGF1cmFudCA9PiByZXN0YXVyYW50LmN1aXNpbmVfdHlwZSk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBjdWlzaW5lc1xyXG4gICAgICAgIGNvbnN0IHVuaXF1ZUN1aXNpbmVzID0gY3Vpc2luZXMuZmlsdGVyKCh2LCBpKSA9PiBjdWlzaW5lcy5pbmRleE9mKHYpID09IGkpO1xyXG4gICAgICAgIHJldHVybiB1bmlxdWVDdWlzaW5lcztcclxuICAgICAgfSkuY2F0Y2goZXJyb3IgPT4gY29uc29sZS5lcnJvcihlcnJvcikpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGF1cmFudCBwYWdlIFVSTC5cclxuICAgKi9cclxuICBzdGF0aWMgdXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICByZXR1cm4gKGByZXN0YXVyYW50Lmh0bWw/aWQ9JHtyZXN0YXVyYW50LmlkfWApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzdGF1cmFudCBpbWFnZSBVUkwuXHJcbiAgICovXHJcbiAgc3RhdGljIGltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSB7XHJcbiAgICByZXR1cm4gKGBhc3NldHMvaW1nL2pwZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaH1gKTtcclxuICB9XHJcbiAgXHJcbiAgc3RhdGljIGltYWdlV2VicFVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xyXG4gICAgcmV0dXJuIChgYXNzZXRzL2ltZy93ZWJwLyR7cmVzdGF1cmFudC5waG90b2dyYXBofWApO1xyXG4gIH1cclxuXHJcbiAgLyoqcVxyXG4gICAqIE1hcCBtYXJrZXIgZm9yIGEgcmVzdGF1cmFudC5cclxuICAgKi9cclxuICBzdGF0aWMgbWFwTWFya2VyRm9yUmVzdGF1cmFudChyZXN0YXVyYW50LCBtYXApIHtcclxuICAgIGNvbnN0IG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xyXG4gICAgICBwb3NpdGlvbjogcmVzdGF1cmFudC5sYXRsbmcsXHJcbiAgICAgIHRpdGxlOiByZXN0YXVyYW50Lm5hbWUsXHJcbiAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSxcclxuICAgICAgbWFwOiBtYXAsXHJcbiAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1B9XHJcbiAgICApO1xyXG4gICAgcmV0dXJuIG1hcmtlcjtcclxuICB9XHJcblxyXG4gIHN0YXRpYyBzd2l0Y2hMb2FkZXJUb01hcCgpIHtcclxuICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJykuY2xhc3NMaXN0LmNvbnRhaW5zKCdoaWRkZW4nKSkge1xyXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJykuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XHJcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAtbG9hZGVyJykuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBzdGF0aWMgc2VuZE1lc3NhZ2UobWVzc2FnZSkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgdmFyIG1lc3NhZ2VDaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XHJcbiAgICAgIG1lc3NhZ2VDaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC5kYXRhLmVycm9yKSB7XHJcbiAgICAgICAgICByZWplY3QoZXZlbnQuZGF0YS5lcnJvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJlc29sdmUoZXZlbnQuZGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5jb250cm9sbGVyLnBvc3RNZXNzYWdlKG1lc3NhZ2UsXHJcbiAgICAgICAgW21lc3NhZ2VDaGFubmVsLnBvcnQyXSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn0iXX0=
