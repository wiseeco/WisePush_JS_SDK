/*global module:false*/
module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      js: {
        src: ['js/jquery/jquery-1.9.1.min.js',
        'js/jquery/jquery.validate.min.js',
        'js/jquery/jquery.validate.extends.js',
        'js/moment/moment-with-locales.min.js',
        'js/underscore/underscore-min.js',
        'js/wef/mqttws31.js',
        'js/wef/wef.function.js',
        'js/wef/wef.wisepush.js'
          ],
        dest: 'js/wisepush.all.js'
      },
      css: {
        src: [''],
        dest: 'css/wisepush.all.css'
      }
    },
    uglify: {
      js: {
        src: 'js/wisepush.all.js',
        dest: 'js/wisepush.all.min.js'
      }
    },
    cssmin: {
      build: {
        files: {
          'css/wisepush.all.min.css': 'css/wisepush.all.css'
        }
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['lib/**/*.js', 'test/**/*.js']
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test', 'qunit']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify', 'cssmin']);

};
