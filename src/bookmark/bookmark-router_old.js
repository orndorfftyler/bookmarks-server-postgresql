//pretty much always need these
const express = require('express')
const bookmarkRouter = express.Router()
const bodyParser = express.json()
const { v4: uuid } = require('uuid')

// files specific to this project needed by both card and list modules
const logger = require('../logger')
const { bookmarks } = require('../store')
//const { cards, lists } = require('../store')


bookmarkRouter
  .route('/bookmarks')
  .get((req, res) => {
    res
        .json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const {title, url, rating, desc} = req.body;
    
    if (!title) {
        logger.error('title is required');
        return res
            .status(400)
            .send('Invalid data');
    }

    if (!url) {
      logger.error('url is required');
      return res
          .status(400)
          .send('Invalid data');
    }

    if (!rating) {
      logger.error('rating is required');
      return res
          .status(400)
          .send('Invalid data');
    }

    if (!desc) {
      logger.error('desc is required');
      return res
          .status(400)
          .send('Invalid data');
    }

    // get an id
    const id = uuid();

    const bookmark = {
        id,
        title,
        url,
        rating,
        desc
    };

    bookmarks.push(bookmark);   
    
    logger.info(`bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:8000/card/${id}`)
      .json(bookmark);    
  })

  bookmarkRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(b => b.id == id);

    // make sure we founda card
    if (!bookmark) {
        logger.error(`bookmark with id ${id} not found.`);
        return res
            .status(404)
            .send('404 Not Found');
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;
  
    const bmarkIndex = bookmarks.findIndex(b => b.id == id);
  
    if (bmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not found');
    }
  
    bookmarks.splice(bmarkIndex, 1);
  
    logger.info(`bookmark with id ${id} deleted.`);
  
    res
      .status(204)
      .end();
  })

module.exports = bookmarkRouter