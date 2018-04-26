/* eslint-env node */

const gulp = require('gulp');
const browserify = require('gulp-bro');
const babelify = require('babelify');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const gutil = require('gulp-util');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const responsive = require('gulp-responsive');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const inlineCss = require('gulp-inline-css');
const inlinesource = require('gulp-inline-source');
const smoosher = require('gulp-smoosher');
const uncss = require('gulp-uncss');

gulp.task('default', ['styles', 'copy-html', 'scripts', 'copy-manifest'],() => {
  gulp.watch('*/**/*.scss', ['styles']).on('change', browserSync.reload);
  // gulp.watch('js/**/*.js', ['lint']);
  gulp.watch(['dev/*.html'], ['copy-html']);
  gulp.watch(['dev/js/**/*.js', 'dev/sw.js'], ['scripts']).on('change', browserSync.reload);
  gulp.watch('dev/manifest.json', ['copy-manifest']).on('change', browserSync.reload);
  gulp.watch([
    'dist/index.html',
    'dist/restaurant.html'
  ]).on('change', browserSync.reload);
  browserSync.init({server: 'dist'});
});

gulp.task('dist', ['styles', 'copy-html', 'scripts-dist', 'copy-data', 'copy-manifest']);

gulp.task('scripts', () => {
  gulp.src(['dev/js/main.js', 'dev/js/restaurant_info.js'])
    .pipe(browserify({
      transform: [
        babelify.configure({ presets: ['es2015'] }),
        ['uglifyify', { global: true, sourceMap: false }]
      ]
    }))  
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
  gulp.src('dev/sw.js')
    .pipe(browserify({
      transform: [
        babelify.configure({ presets: ['es2015'] }),
        ['uglifyify', { global: true, sourceMap: false }]
      ]
    })) 
    .pipe(gulp.dest('dist'));
  // gulp.src('dev/node_modules/idb/lib/idb.js')
  //   .pipe(gulp.dest('dist/js'));
  });
  
  gulp.task('scripts-dist', () => {
    gulp.src('dev/js/**/*.js')
      .pipe(sourcemaps.init())
      .pipe(babel({ presets: ['@babel/env'] }))
      .pipe(sourcemaps.write())
      .pipe(uglify())
      .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
      .pipe(gulp.dest('dist/js'));
    gulp.src('dev/sw.js')
      .pipe(sourcemaps.init())
      .pipe(babel({ presets: ['@babel/env'] }))
      .pipe(sourcemaps.write())
      .pipe(uglify())
      .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })  
      .pipe(gulp.dest('dist'));
});

gulp.task('copy-html', () => {
  const options = {
    applyStyleTags: true,
    applyLinkTags: true,
    removeStyleTags: false,
    removeLinkTags: false,
    removeStyleTags: true
  }
  gulp.src(['dev/index.html'])
    .pipe(smoosher())
    // .pipe(inlineCss(options))
    .pipe(gulp.dest('dist/'));
  gulp.src(['dev/restaurant.html'])
    .pipe(smoosher())
    .pipe(gulp.dest('dist/'));
});

gulp.task('copy-data', () => {
  gulp.src('dev/data/*')
    .pipe(gulp.dest('dist/data'));
});

gulp.task('copy-manifest', () => {
  gulp.src('dev/manifest.webmanifest')
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-images', () => {
  gulp.src('dev/assets/img/jpg/*')
    .pipe(responsive({
      '*.jpg': [{
        width: 50,
        rename: {
          suffix: '-lazy',
        },
      }, {
        width: 400,
        rename: {
          suffix: '-small_x1',
        },
      }, {
        width: 500,
        rename: {
          suffix: '-small_x2',
        },
      }, {
        width: 600,
        rename: {
          suffix: '-medium_x1',
        },
      }, {
        width: 700,
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
      quality: 70,
      progressive: true,
      withMetadata: false,
    }))
    .pipe(imagemin({
      progressive: true
    }))
    .pipe(gulp.dest('dist/assets/img/jpg'));
  gulp.src('dev/assets/img/png/*')
    .pipe(imagemin({
      optimizationLevel: 7,
    }))
    .pipe(gulp.dest('dist/assets/img/png'));
  gulp.src('dist/assets/img/jpg/*')
    .pipe(webp())
    .pipe(gulp.dest('dist/assets/img/webp'));
  gulp.src('dev/assets/img/svg/*')
    .pipe(gulp.dest('dist/assets/img/svg'));
});

gulp.task('styles', () => {
  gulp.src('dev/assets/sass/**/*.scss')
    .pipe(sass({ outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
    .pipe(gulp.dest('dev/assets/css'))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(browserSync.stream());
  gulp.src('dev/assets/css/fonts/*')
    .pipe(gulp.dest('dist/assets/css/fonts/'));
});

// gulp.task('lint', () => {
// 	return gulp.src(['js/**/*.js', '!node_modules/**'])
// 		.pipe(eslint())
// 		.pipe(eslint.format())
// 		.pipe(eslint.failAfterError());
// });

// gulp.task('tests', () => {
// 	gulp.src('tests/spec/extraSpec.js')
// 		.pipe(jasmine({
// 			integration: true,
// 			vendor: 'js/**/*.js'
// 		}));
// });