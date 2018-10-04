const gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename');


gulp.task('build', function () {
    return gulp.src('mdarea.js')
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(rename('mdarea.min.js'))
        .pipe(sourcemaps.write('.', {
            mapFile: path => path.replace(/\.js\.map$/, '.map')
        }))
        .pipe(gulp.dest('.'));
});

gulp.task('watch', function () {
    return gulp.watch(['mdarea.js'], gulp.series('build'));
});

gulp.task('default', gulp.series('build'));
