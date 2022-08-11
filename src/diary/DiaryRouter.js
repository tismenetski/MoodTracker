const express = require('express');
const router = express.Router();
const {getDiary, postDiary , deleteDiary , updateDiary} = require('./DiaryController')
const authenticate = require('../middleware/authenticate');




router.get('/api/1.0/diary',authenticate,getDiary );
router.post('/api/1.0/diary',authenticate,postDiary );
router.delete('/api/1.0/diary',authenticate,deleteDiary );
router.put('/api/1.0/diary',authenticate,updateDiary );
module.exports = router