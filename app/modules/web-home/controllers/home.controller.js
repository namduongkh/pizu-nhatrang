'use strict';
const mongoose = require('mongoose');
const Product = mongoose.model('Product');

exports.index = {
    handler: function(request, reply) {
        // console.log("Auth", request.auth);
        return reply.view('web-home/views/index', {
            meta: {
                title: "Trang chủ"
            }
        });
    }
};

exports.detail = {
    handler: function(request, reply) {
        // console.log("Auth", request.auth);
        let { slug } = request.params;
        Product.findOne({
                slug: slug
            })
            .select("title image")
            .lean()
            .then(function(product) {
                if (product) {
                    return reply.view('web-home/views/detail', {
                        slug: slug,
                        meta: {
                            title: product.title,
                            image: request.server.configManager.get("web.settings.services.webUrl") + "/files/products/" + product._id + "/" + product.image
                        }
                    });
                } else {
                    return reply.redirect("/khong-tim-thay-noi-dung")
                }
            })

    }
};