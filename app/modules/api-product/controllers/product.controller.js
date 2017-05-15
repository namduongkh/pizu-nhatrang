'use strict';
const mongoose = require('mongoose');
const Product = mongoose.model('Product');
const Boom = require('boom');
const ErrorHandler = require("../../../utils/error.js");
const download = require('image-downloader')
const fs = require('fs')
const async = require('async')
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'openness.sender.email@gmail.com',
        pass: 'phongnguyen.94'
    }
});

function checkSlug(request, reply) {
    let { slug } = request.payload;
    Product.findOne({
            slug: slug
        })
        .then(function(product) {
            if (product) {
                return reply(slug + "-" + new Date().getTime());
            } else {
                return reply(slug)
            }
        });
}

exports.createProduct = {
    pre: [{
        method: checkSlug,
        assign: 'slug'
    }],
    handler: function(request, reply) {
        let { title, image, description, price, imageLink, bannerLink, intro } = request.payload;
        let slug = request.pre.slug.toLowerCase();
        let product = new Product({ title, slug, image, description, price, intro });
        product.save()
            .then(function(product) {
                let parallel = [];
                if (imageLink) {
                    parallel.push(function(cb) {
                        let productDir = global.BASE_PATH + '/public/files/products/' + product._id;
                        if (!fs.existsSync(productDir)) {
                            fs.mkdirSync(productDir);
                        };
                        const options = {
                            url: imageLink,
                            dest: productDir
                        }
                        download.image(options)
                            .then(({ filename, image }) => {
                                product.image = filename.replace(productDir + "/", "");
                                cb(null, true);
                            }).catch((err) => {
                                console.log("err", err);
                                cb(err, true);
                            })
                    });
                }
                if (bannerLink) {
                    parallel.push(function(cb) {
                        let productDir = global.BASE_PATH + '/public/files/products/' + product._id;
                        if (!fs.existsSync(productDir)) {
                            fs.mkdirSync(productDir);
                        };
                        if (!fs.existsSync(productDir + "/banner")) {
                            fs.mkdirSync(productDir + "/banner");
                        };
                        const options = {
                            url: bannerLink,
                            dest: productDir + "/banner"
                        }
                        download.image(options)
                            .then(({ filename, image }) => {
                                product.image = filename.replace(productDir + "/banner/", "");
                                cb(null, true);
                            }).catch((err) => {
                                console.log("err", err);
                                cb(err, true);
                            })
                    });
                }
                async.parallel(parallel, function() {
                    return product.save();
                });
            })
            .then(function(product) {
                return reply(product);
            })
            .catch(function(err) {
                console.log("err", err);
                return reply(Boom.badRequest());
            });
    }
};

exports.updateProduct = {
    handler: function(request, reply) {
        let { productId, title, slug, image, description, price, intro } = request.payload;
        Product.findOne({
                _id: productId
            })
            .then(function(product) {
                product.title = title;
                product.slug = slug;
                product.image = image;
                product.description = description;
                product.price = price;
                return product.save();
            })
            .then(function(product) {
                return reply(product);
            })
    }
};

exports.detailProduct = {
    handler: function(request, reply) {
        let { slug } = request.payload;
        Product.findOne({
                slug: slug
            })
            .then(function(product) {
                return reply(product);
            });
    }
};

exports.productList = {
    handler: function(request, reply) {
        Product.find()
            .sort("-created")
            .lean()
            .then(function(products) {
                return reply(products);
            });
    }
};

exports.order = {
    handler: function(request, reply) {
        let { product_name, product_count, product_price, user_name, user_phone, user_email, user_note, user_address } = request.payload;
        // setup email data with unicode symbols
        let mailOptions = {
            from: 'openness.sender.email@gmail.com', // sender address
            to: 'namduong.kh94@gmail.com', // list of receivers
            subject: 'Đơn đặt hàng ' + product_name + " " + new Date().toLocaleDateString(), // Subject line
            // text: 'Hello world ?', // plain text body
            html: `\
                <p>Sản phẩm: ${product_name}</p>
                <p>Số lượng: ${product_count}</p>
                <p>Giá bán: ${product_price}</p>
                <p>Người mua: ${user_name}</p>
                <p>SĐT: ${user_phone}</p>
                <p>Địa chỉ: ${user_address}</p>
                <p>Email: ${user_email || ''}</p>
                <p>Ghi chú: ${user_note || ''}</p>
            ` // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reply(false);
                // return console.log(error);
            }
            return reply(true);
            // console.log('Message %s sent: %s', info.messageId, info.response);
        });
    }
};

exports.deleteProduct = {
    handler: function(request, reply) {
        let { removeFolder } = request.server.plugins['api-upload'];
        let { product_id } = request.payload;
        Product.findOne({ _id: product_id }).then(function(product) {
                // return reply(true);
                return product.remove();
            })
            .then(function() {
                removeFolder("/files/products/" + product_id, function() {});
                return reply(true);
            })
            .catch(function() {
                return reply(false);
            });
    }
};