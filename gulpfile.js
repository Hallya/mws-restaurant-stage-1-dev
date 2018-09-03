/* eslint-env node */

const gulp = require('gulp');
const browserify = require('gulp-bro');
const uglify = require('gulp-uglify-es').default;
const connect = require('gulp-connect');
const htmlmin = require('gulp-htmlmin');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const responsive = require('gulp-responsive');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const smoosher = require('gulp-smoosher');

gulp.task('default', ['styles', 'copy-html', 'scripts', 'copy-manifest'],() => {
  gulp.watch('*/**/*.scss', ['styles'])
  gulp.watch(['dev/*.html'], ['copy-html'])
  gulp.watch(['dev/js/**/*.js', 'dev/sw.js'], ['scripts'])
  gulp.watch('dev/manifest.json', ['copy-manifest'])

  connect.server({
    root: 'dist',
    livereload: true,
    port: 9090
  })
});

gulp.task('build', ['styles', 'copy-html', 'scripts-dist', 'copy-manifest'], () => {
  gulp.watch('*/**/*.scss', ['styles'])
  gulp.watch(['dev/*.html'], ['copy-html']);
  gulp.watch(['dev/js/**/*.js', 'dev/sw.js'], ['scripts-dist']);
  gulp.watch('dev/manifest.json', ['copy-manifest']);

  connect.server({
    root: 'dist',
    livereload: true,
    port: 9090,
  })
});

gulp.task('dist', ['styles', 'copy-html', 'scripts-dist', 'copy-data', 'copy-manifest']);

gulp.task('scripts', (done) => {
  gulp.src(['dev/js/main.js', 'dev/js/restaurant_info.js'])
    .pipe(browserify())
    .pipe(gulp.dest('./dist/js'));
  gulp.src('dev/sw.js')
    .pipe(browserify())
    .pipe(gulp.dest('./dist'));
  connect.reload();
    done();
  });
  
gulp.task('scripts-dist', (done) => {
  gulp.src(['./dev/js/main.js', './dev/js/restaurant_info.js'])  
    .pipe(browserify())
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'));
  gulp.src('./dev/sw.js')
    .pipe(browserify())
    .pipe(uglify())
    .pipe(gulp.dest('./dist'));
  connect.reload();
  done();
});

gulp.task('copy-html', () => {
  gulp.src(['dev/index.html'])
    .pipe(smoosher())
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest('dist/'));
  gulp.src(['dev/restaurant.html'])
    .pipe(smoosher())
    .pipe(htmlmin({ collapseWhitespace: true}))
    .pipe(gulp.dest('dist/'));
  connect.reload();
});

gulp.task('copy-data', () => {
  gulp.src('dev/data/*')
    .pipe(gulp.dest('dist/data'));
});

gulp.task('copy-manifest', () => {
  gulp.src('dev/manifest.webmanifest')
    .pipe(gulp.dest('dist'));
  connect.reload();
});

gulp.task('copy-images', () => {
  gulp.src('dev/assets/img/jpg/*')
    .pipe(responsive({
      '*.jpg': [{
        width: 40,
        quality: 10,
        rename: {
          suffix: '-lazy',
        },
      }, {
        width: 280,
        quality: 50,
        rename: {
          suffix: '-small_x1',
          },
      }, {
        width: 350,
        rename: {
          suffix: '-small_x2',
          },
      }, {
        width: 500,
        rename: {
          suffix: '-medium_x1',
        },
      }, {
        width: 600,
        rename: {
          suffix: '-medium_x2',
        },
      }, {
        width: 800,
        rename: {
          suffix: '-large_x1',
        },
      }, {
        rename: { suffix: '-large_x2' },
      }],
    }, {
      quality: 40,
      progressive: true,
      withMetadata: false,
    }))
    .pipe(gulp.dest('dist/assets/img/jpg'));
  gulp.src('dev/assets/img/png/*')
    .pipe(imagemin({
      optimizationLevel: 7,
    }))
    .pipe(gulp.dest('dist/assets/img/png'));
  gulp.src('dev/assets/img/svg/*')
    .pipe(gulp.dest('dist/assets/img/svg'));
});

gulp.task('webp', () => {
  gulp.src('dist/assets/img/jpg/*')
    .pipe(webp())
    .pipe(gulp.dest('dist/assets/img/webp'));
})

gulp.task('svg', () => {
  gulp.src('dev/assets/img/svg/*')
    .pipe(gulp.dest('dist/assets/img/svg'));
})

gulp.task('styles', () => {
  gulp.src('dev/assets/sass/**/*.scss')
    .pipe(sass({ outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(connect.reload());
  gulp.src('dev/assets/css/fonts/*')
    .pipe(gulp.dest('dist/assets/css/fonts/'));
});

gulp.task('styles-uncompressed', () => {
  gulp.src('dev/assets/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(connect.reload());
});