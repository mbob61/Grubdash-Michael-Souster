const router = require("express").Router();
const controller = require("./orders.controller")
const methodNotAllowed = require("../errors/methodNotAllowed")

router.route("/")
    .get(controller.list)
    .post(controller.post)
    .all(methodNotAllowed);

router.route("/:orderId")
    .get(controller.read)
    .put(controller.update)
    .delete(controller.deleteOrder)
    .all(methodNotAllowed)

// TODO: Implement the /orders routes needed to make the tests pass

module.exports = router;
