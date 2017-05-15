'use strict';

exports.createProduct = {
    auth: {
        strategy: 'jwt',
        mode: 'required',
        scope: 'admin'
    },
    handler: function(request, reply) {
        // console.log("Auth", request.auth);
        return reply.view('web-product/views/portal-product-create', {
            meta: {
                title: "Tạo mới sản phẩm"
            }
        });
    }
};

exports.listProduct = {
    auth: {
        strategy: 'jwt',
        mode: 'required',
        scope: 'admin'
    },
    handler: function(request, reply) {
        // console.log("Auth", request.auth);
        return reply.view('web-product/views/portal-product', {
            meta: {
                title: "Quản lý sản phẩm"
            }
        });
    }
};