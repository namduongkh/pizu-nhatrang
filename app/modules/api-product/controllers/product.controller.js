'use strict';
const mongoose = require('mongoose');
const Product = mongoose.model('Product');
const Boom = require('boom');
const ErrorHandler = require("../../../utils/error.js");
const download = require('image-downloader')
const fs = require('fs')
const async = require('async')
const nodemailer = require('nodemailer');
const Jimp = require("jimp");
const sizeOf = require('image-size');

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

function genarateOtherImage(server, type, filename, width, height, mode, oldFilename) {
    mode = mode ? mode : 'other';
    let fullPath = global.BASE_PATH + "/public/files/" + type + "/" + filename;
    let thumb = global.BASE_PATH + "/public/files/" + type + "/" + mode;
    if (oldFilename) {
        let { removePath } = server.plugins['api-upload'];
        removePath(type + "/" + mode, oldFilename);
    }
    if (!fs.existsSync(thumb)) {
        fs.mkdirSync(thumb);
    }
    let thumbPath = thumb + "/" + filename;
    if (fs.existsSync(fullPath)) {
        let size = sizeOf(fullPath);
        if ((width && width < size.width) || (height && height < size.height)) {
            width = width ? width : Jimp.AUTO;
            height = height ? height : Jimp.AUTO;
            Jimp.read(fullPath).then(function(image) {
                image.resize(width, height) // resize
                    // .quality(60) // set JPEG quality
                    // .greyscale() // set greyscale
                    .write(thumbPath); // save
            }).catch(function(err) {
                console.error(err);
            });
        }
    }
}

function getImageFromLink(server, url, type, filename, oldFilename, callback) {
    let ext;
    url.replace(/\.(\w+)$/g, function(str) {
        ext = str;
    });
    let productDir = global.BASE_PATH + '/public/files/' + type;
    if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir);
    };
    let dest = productDir;
    if (filename) {
        dest += '/' + filename + ext;
    }
    const options = {
        url: url,
        dest: dest
    }
    download.image(options)
        .then(({ filename, image }) => {
            if (oldFilename) {
                let { removePath } = server.plugins['api-upload'];
                let typeDir = type;
                removePath(typeDir, oldFilename);
            }
            let outFilename = filename.replace(new RegExp(productDir + "/", "g"), "");
            callback(null, outFilename);
        }).catch((err) => {
            console.log("err", err);
            callback(err);
        })
}

exports.createProduct = {
    pre: [{
        method: checkSlug,
        assign: 'slug'
    }],
    handler: function(request, reply) {
        let { title, image, description, price, imageLink, bannerLink, intro } = request.payload;
        let slug = request.pre.slug.toLowerCase();
        let product = new Product({
            title,
            slug,
            image,
            description: description ? description.replace(/href="([^"]+)"/g, "href='#'") : "",
            price,
            intro: intro ? intro.replace(/href="([^"]+)"/g, "href='#'") : ""
        });
        product.save()
            .then(function(product) {
                let parallel = [];
                if (imageLink) {
                    parallel.push(function(cb) {
                        getImageFromLink(request.server, imageLink, "products/" + product._id, "image-" + new Date().getTime(), null, function(err, result) {
                            product.image = result;
                            genarateOtherImage(request.server, "products/" + product._id, result, 100, null, 'small');
                            genarateOtherImage(request.server, "products/" + product._id, result, 350, null, 'medium');
                            cb(err, result);
                        });
                    });
                }
                if (bannerLink) {
                    parallel.push(function(cb) {
                        getImageFromLink(request.server, bannerLink, "products/" + product._id, "banner-" + new Date().getTime(), null, function(err, result) {
                            product.banner = result;
                            cb(err, result);
                        });
                    });
                }
                async.parallel(parallel, function() {
                    return product.save().then(function(product) {
                        return reply(product);
                    });
                });
            })
            // .then(function(product) {
            //     return reply(product);
            // })
            .catch(function(err) {
                console.log("err", err);
                return reply(Boom.badRequest());
            });
    }
};

exports.updateProduct = {
    handler: function(request, reply) {
        let { productId, title, slug, imageLink, bannerLink, description, price, intro } = request.payload;
        if (productId) {
            Product.findOne({
                    _id: productId
                })
                .then(function(product) {
                    if (product) {
                        product.title = title;
                        product.slug = slug;
                        product.description = description ? description.replace(/href="([^"]+)"/g, "href='#'") : "";
                        product.intro = intro ? intro.replace(/href="([^"]+)"/g, "href='#'") : "";
                        product.price = price;
                        let parallel = [];
                        if (imageLink) {
                            parallel.push(function(cb) {
                                getImageFromLink(request.server, imageLink, "products/" + product._id, "image-" + new Date().getTime(), product.image, function(err, result) {
                                    product.image = result;
                                    genarateOtherImage(request.server, "products/" + product._id, result, 100, null, 'small', product.image);
                                    genarateOtherImage(request.server, "products/" + product._id, result, 350, null, 'medium', product.image);
                                    cb(err, result);
                                });
                            });
                        }
                        if (bannerLink) {
                            parallel.push(function(cb) {
                                getImageFromLink(request.server, bannerLink, "products/" + product._id, "banner-" + new Date().getTime(), product.banner, function(err, result) {
                                    product.banner = result;
                                    cb(err, result);
                                });
                            });
                        }
                        async.parallel(parallel, function() {
                            return product.save().then(function(product) {
                                return reply(product);
                            });
                        });
                    } else {
                        return reply(Boom.badRequest("Không có sản phẩm"));
                    }
                })
                // .then(function(product) {
                //     return reply(product);
                // });
                .catch(function(err) {
                    console.log("err", err);
                    return reply(Boom.badRequest());
                });
        } else {
            return reply(Boom.badRequest("Không có sản phẩm"));
        }
    }
};

exports.detailProduct = {
    handler: function(request, reply) {
        let { slug } = request.payload;
        if (slug) {
            Product.findOne({
                    slug: slug
                })
                .then(function(product) {
                    return reply(product);
                });
        } else {
            return reply(Boom.badRequest("Không có slug sản phẩm"));
        }
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

exports.productBanner = {
    handler: function(request, reply) {
        Product.find({
                banner: { $ne: undefined }
            })
            .sort("-created")
            .lean()
            .then(function(products) {
                return reply(products);
            });
    }
};

exports.order = {
    handler: function(request, reply) {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'openness.sender.email@gmail.com',
                pass: 'phongnguyen.94'
            }
        });
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
                console.log("error", error);
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