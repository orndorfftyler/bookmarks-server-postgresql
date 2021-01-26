//pretty much always need these
const express = require('express')
const bookmarkRouter = express.Router()
const bodyParser = express.json()
const { v4: uuid } = require('uuid')

// files specific to this project needed by both card and list modules
const logger = require('../logger')
const { bookmarks } = require('../store')
//const { cards, lists } = require('../store')

const BookmarksService = require('../bookmarks-service')
const jsonParser = express.json()
const xss = require('xss')



bookmarkRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks)
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { title, url, rating, desc } = req.body
    const newBookmark = { title, url, rating, desc }
    
    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
      }
    }

    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
    .then(bookmark => {
      res
        .status(201)
        .location(`/bookmarks/${bookmark.id}`)
        .json(bookmark)
    })
  .catch(next)
  })

  bookmarkRouter
  .route('/bookmarks/:id')
  .all((req, res, next) => {
    BookmarksService.getById(
      req.app.get('db'),
      req.params.id
    )
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `bookmark doesn't exist` }
          })
        }
        res.bookmark = bookmark 
        next() 
      })
      .catch(next)
  })
  .get((req, res, next) => {
    res.json({
      id: res.bookmark.id,
      title: xss(res.bookmark.title), 
      url: res.bookmark.url,
      rating: res.bookmark.rating,
      desc: xss(res.bookmark.desc) 
    })

  })
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      req.params.id
    )
    .then(() => {
      res.status(204).end()
    })
    .catch(next)  
  })

module.exports = bookmarkRouter