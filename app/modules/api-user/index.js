'use strict';

const Controller = require('./controllers/user.controller.js');

exports.register = function(server, options, next) {
    var configManager = server.plugins['hapi-kea-config'];

    server.route({
        method: 'GET',
        path: '/',
        config: Controller.index
    });

    server.route({
        method: 'POST',
        path: '/api/user/login',
        config: Controller.login
    });

    server.route({
        method: 'GET',
        path: '/api/user/logout',
        config: Controller.logout
    });

    server.route({
        method: 'POST',
        path: '/api/user/register',
        config: Controller.register
    });

    server.route({
        method: 'GET',
        path: '/api/user/account',
        config: Controller.account
    });

    next();
};

exports.register.attributes = {
    name: 'api-user'
};