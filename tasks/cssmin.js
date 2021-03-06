/*
 * grunt-contrib-cssmin
 * http://gruntjs.com/
 *
 * Copyright (c) 2013 Tim Branyen, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var helper = require('grunt-lib-contrib').init(grunt);
  var path = require('path');
  var CleanCSS = require('clean-css');
  var statSync = require('fs').statSync;

  grunt.registerMultiTask('cssmin', 'Minify CSS files', function() {
    var options = this.options({
      report: false,
      onlyStale: true
    });
    this.files.forEach(function(f) {
      var sourcesModified = false, destinationMtime = 0;
      if(options.onlyStale && grunt.file.exists(f.dest)) {
        destinationMtime = getMtime(f.dest);
      }
      
      var valid = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          // Use mtime of destination and its sources to determine staleness
          if(options.onlyStale && !sourcesModified && getMtime(filepath) >= destinationMtime) {
            sourcesModified = true;
          }
          return true;
        }
      });
      
      if(options.onlyStale && !sourcesModified) {
        grunt.log.writeln('File ' + f.dest + ' is already up to date.');
        return;
      }
      
      var max;
      if(options.report) {
        max = valid.map(grunt.file.read).join(grunt.util.normalizelf(grunt.util.linefeed));
      }
      
      var min = valid.map(function(f) {
        options.relativeTo = path.dirname(f);
        return minifyCSS(grunt.file.read(f), options);
      })
      .join('');

      if (min.length < 1) {
        grunt.log.warn('Destination not written because minified CSS was empty.');
      } else {
        if ( options.banner ) {
          min = options.banner + grunt.util.linefeed + min;
        }
        grunt.file.write(f.dest, min);
        grunt.log.writeln('File ' + f.dest + ' created.');
        if(options.report) {
          helper.minMaxInfo(min, max, options.report);
        }
      }
    });
  });

  var minifyCSS = function(source, options) {
    try {
      return new CleanCSS(options).minify(source);
    } catch (e) {
      grunt.log.error(e);
      grunt.fail.warn('css minification failed.');
    }
  };
  
  var getMtime = function(path) {
    return statSync(path).mtime.getTime();
  };
};
