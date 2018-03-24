/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          sizes: [{
            name: 'small',
            suffix: "_x1",
            width: 400,
            quality: 50
          },{
            name: 'small',
            suffix: "_x2",
            width: 400,
            quality: 90
          },{
            name: 'medium',
            suffix: "_x1",
            width: 640,
            quality: 50
          },{
            name: 'medium',
            suffix: "_x2",
            width: 640,
            quality: 80
          },{
            name: "large",
            width: 1024,
            suffix: "_x1",
            quality: 50
          },{
            name: "large",
            width: 1024,
            suffix: "_x2",
            quality: 80
          }]
        },
        files: [{
          expand: true,
          src: ['*.{gif,jpg,png}'],
          cwd: 'assets/img',
          dest: 'assets/img_resized'
        }]
      }
    },
    
    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['assets/img_resized'],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['assets/img_resized']
        },
      },
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [{
          expand: true,
          src: 'assets/img/*.{jpg}',
          dest: 'assets/img_resized'
        }]
      },
    },
    imageoptim: {
      myTask: {
        options: {
          jpegMini: false,
          imageAlpha: true,
          quitAfter: true
        },
        src: ['images/']
      }
    }

  });
  
  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-imageoptim');
  grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images', 'imageoptim']);
};
