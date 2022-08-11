const Page = require('./Page');
const DiaryService = require('../diary/DiaryService')
const createPage = async(data) => {

    const page = await Page.create(data);
    return page;

}


const getPages = async(page,size,userId) => {


    const diary = await DiaryService.getDiaryByUserId(userId);

    const pages = await Page.findAndCountAll({
        where : {diaryId : diary.id},
        limit: size,
        offset: page * size
    });

    return {
        content : pages.rows,
        page,
        size,
        totalPages : Math.ceil(pages.count / size)
    }

}


module.exports = {
    createPage, getPages
}