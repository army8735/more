var gulp = require('gulp');
var clean = require('gulp-clean');
var util = require('gulp-util');
var through2 = require('through2');
var jsdc = require('jsdc');

var fs = require('fs');
var path = require('path');

function mkdir(dir) {
  if(!fs.existsSync(dir)) {
    var parent = path.dirname(dir);
    mkdir(parent);
    fs.mkdirSync(dir);
  }
}

gulp.task('clean-bulid', function() {
  return gulp.src('./build/*')
    .pipe(clean());
});

function cb(file, enc, cb) {
  var target = file.path.replace(path.sep + 'src' + path.sep,  path.sep + 'build' + path.sep);
  mkdir(path.dirname(target));
  util.log(path.relative(file.cwd, file.path), '->', path.relative(file.cwd, target));
  var content = file._contents;
  content = content.toString('utf-8');
  content = jsdc.parse(content);
  fs.writeFileSync(target, content, { encoding: 'utf-8' });
  cb(null, file);
}

gulp.task('default', ['clean-bulid'], function() {
  gulp.src('./src/**/*.js')
    .pipe(function() {
      return through2.obj(cb);
    }());
});

gulp.task('watch', function() {
  gulp.watch('./src/**/*.js', function() {
    var args = Array.prototype.slice.call(arguments);
    args.forEach(function(arg) {
      gulp.src(arg.path)
        .pipe(function() {
          return through2.obj(cb);
        }());
    });
  });
});