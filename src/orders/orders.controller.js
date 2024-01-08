const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
const { stat } = require("fs");

function list(req, res, next){
    res.json({data: orders})
}

function post(req, res, next){
    const {data: {deliverTo, mobileNumber, status, dishes} = {} } = req.body;
    const newID = nextId();
    const newOrder = {
        id: newID,
        deliverTo,
        mobileNumber,
        status, 
        dishes
    }
    orders.push(newOrder);
    res.status(201).json({data: newOrder})
}

function doesOrderExist(req, res, next){
    const {orderId} = req.params;
    const order = orders.find((order) => order.id === orderId);
    if (order){
        res.locals.order = order;
        return next();
    }
    next({status: 404, message: `Order with id: ${orderId} not found`})
}

function read(req, res, next){
    res.json({data: res.locals.order})
}

function update(req, res, next){
    const order = res.locals.order;
    const {data: {deliverTo, mobileNumber, status, dishes} = {} } = req.body;
    
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({data: order})
}

function deleteOrder(req, res, next){
    const {orderId} = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    orders.splice(index, 1);
    res.sendStatus(204)
}

function bodyDataContainsValidStringForProperty(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName] && data[propertyName] !== "") {
            return next();
        }
        next({ status: 400, message: `Order must include a ${propertyName}`});
    };
}

function bodyContainsArrayOfDishes(req, res, next){
    const { data = {} } = req.body;
    const dishes = data["dishes"];
    if (!dishes) {
        return next({ status: 400, message: `Order must include a dish`}); 
        } else if (!Array.isArray(dishes) || dishes.length < 1){
        return next({ status: 400, message: `Order must include at least one dish`});
    }
    return next();
}

function eachDishContainsAValidQuantity(req, res, next){
    const { data = {} } = req.body;
    const dishes = data["dishes"];
    dishes.forEach((dish, index) => {
        const quantity = dish["quantity"]
        if (!quantity || Number(quantity) <= 0 || !Number.isInteger(quantity)){
            return next({ status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`});
        }
    })
    
    return next();

}

function IDMatchesIfPresent(req, res, next){
    const {orderId} = req.params;
    const {data: {id} = {}} = req.body;
    if (id && id !== orderId){
        return next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`})
    }
    next();
    
}

function bodyDataContainsValidStatus(req, res, next) {
    const validStatus = [ "pending", "preparing", "out-for-delivery", "delivered"];
    const { data: {status} } = req.body;
    if (status && status !== "" && validStatus.includes(status)) {
        return next();
    }
    next({ status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered`});
}

function existingOrderNotMarkedAsDelivered(req, res, next) {
    const {status} = res.locals.order
    if (status !== "delivered") {
        return next();
    }
    next({ status: 400, message: `A delivered order cannot be changed`});
}

function orderMustBePending(req, res, next){
    const {status} = res.locals.order
    if (status === "pending") {
        return next();
    }
    next({ status: 400, message: `An order cannot be deleted unless it is pending`});
}

module.exports = {
    list,
    post: [
        bodyDataContainsValidStringForProperty("deliverTo"),
        bodyDataContainsValidStringForProperty("mobileNumber"),
        bodyContainsArrayOfDishes,
        eachDishContainsAValidQuantity,
        post
    ],
    read: [doesOrderExist, read],
    update: [
        doesOrderExist,
        bodyDataContainsValidStringForProperty("deliverTo"),
        bodyDataContainsValidStringForProperty("mobileNumber"),
        bodyContainsArrayOfDishes,
        eachDishContainsAValidQuantity,
        IDMatchesIfPresent,
        bodyDataContainsValidStatus,
        existingOrderNotMarkedAsDelivered,
        update],
    deleteOrder: [doesOrderExist, orderMustBePending, deleteOrder]
}

// TODO: Implement the /orders handlers needed to make the tests pass
