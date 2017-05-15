'use strict';

const fs = require('fs');
const rimraf = require('rimraf');

module.exports = function(server, options) {
    return {
        removeFolder: function(path_in_files, cb) {
            let full_path = global.BASE_PATH + "/public" + path_in_files;
            if (fs.existsSync(full_path)) {
                rimraf(full_path, function() {
                    cb(null, true);
                });
            } else {
                cb(null, false);
            }
        }
    };
}