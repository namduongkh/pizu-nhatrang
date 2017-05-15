'use strict';

const HomeController = require('./controllers/home.controller.js');

exports.register = function(server, options, next) {
    var configManager = server.plugins['hapi-kea-config'];

    server.route({
        method: 'GET',
        path: '/portal/product/createProduct',
        config: HomeController.createProduct
    });

    server.route({
        method: 'GET',
        path: '/portal/product',
        config: HomeController.listProduct
    });

    next();
};

exports.register.attributes = {
    name: 'web-product'
};