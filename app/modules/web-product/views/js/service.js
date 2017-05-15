(function() {
    'use strict';

    angular.module('Product')
        .service("ProductSvc", ProductSvc);

    function ProductSvc($http) {
        return {
            productList: function() {
                return $http.get(apiPath + "/api/product/productList");
            },
            createProduct: function(data) {
                return $http.post(apiPath + "/api/product/createProduct", data);
            },
            detailProduct: function(data) {
                return $http.post(apiPath + "/api/product/detailProduct", data);
            },
            orderProduct: function(data) {
                return $http.post(apiPath + "/api/product/order", data);
            },
            deleteProduct: function(data) {
                return $http.post(apiPath + "/api/product/deleteProduct", data);
            },
        };
    }
})();