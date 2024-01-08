const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next){
    res.json({data: dishes})
}

function bodyDataContainsValidStringForProperty(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName] && data[propertyName] !== "") {
            return next();
        }
        next({ status: 400, message: `Dish must include a ${propertyName}`});
    };
}

function bodyDataContainsValidPositiveIntegerForProperty(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        const value = data[propertyName];

        if (!value){
            return next({ status: 400, message: `Must include a ${propertyName}` });
        } else if (Number(value) <= 0 || !Number.isInteger(value)){
            return next({ status: 400, message: `Must include a ${propertyName} that is an integer greater than 0` });
        }
        return next();
    };
}

function IDMatchesIfPresent(req, res, next){
    const {dishId} = req.params;
    const {data: {id} = {}} = req.body;
    if (id && id !== dishId){
        return next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`})
    }
    next();
}

function post(req, res, next){
    const {data: {name, description, price, image_url} = {}} = req.body;
    const newId = nextId();
    const newDish = {
        name,
        description,
        price,
        image_url,
        id: newId
    }
    dishes.push(newDish);
    res.status(201).json({data: newDish})

}

function doesDishExist(req, res, next){
    const {dishId} = req.params;
    const dish = dishes.find((dish) => dish.id === dishId)
    if (dish){
        res.locals.dish = dish;
        return next();
    }
    next({status: 404, message: `Dish does not exist: ${dishId}`})
}

function read(req, res, next){
    res.json({data: res.locals.dish})
}

function update(req, res, next){
    const dish = res.locals.dish;
    const {data: {name, description, price, image_url = {}}} = req.body;

    dish.name = name;
    dish.description = description,
    dish.price = price;
    dish.image_url = image_url;

    res.json({data: dish})
}


module.exports = {
    list,
    post: [
        bodyDataContainsValidStringForProperty("name"),
        bodyDataContainsValidStringForProperty("description"),
        bodyDataContainsValidStringForProperty("image_url"),
        bodyDataContainsValidPositiveIntegerForProperty("price"),
        post],
    read: [doesDishExist, read],
    update: [
        doesDishExist,
        IDMatchesIfPresent,
        bodyDataContainsValidStringForProperty("name"),
        bodyDataContainsValidStringForProperty("description"),
        bodyDataContainsValidStringForProperty("image_url"),
        bodyDataContainsValidPositiveIntegerForProperty("price"),
        update]
}