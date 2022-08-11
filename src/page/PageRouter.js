const express = require('express');
const router = express.Router();
const { postPage,getPages } = require('./PageController');
const { postPageValidator } = require('./PageValidator');
const authenticate = require('../middleware/authenticate');
const pagination = require("../middleware/pagination");

// router.get('/api/1.0/diary',authenticate,getDiary );
router.post('/api/1.0/diary/page', authenticate, postPageValidator, postPage);
router.get('/api/1.0/diary/page', authenticate,pagination, getPages);
// router.delete('/api/1.0/diary',authenticate,deleteDiary );
// router.put('/api/1.0/diary',authenticate,updateDiary );
module.exports = router;
