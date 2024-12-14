const router = require("express").Router();
const insertController = require("../controllers/insert.controller");

router.post("/insert-user", insertController.insertUser);
router.post("/insert-post", insertController.insertPost);

module.exports = router;
