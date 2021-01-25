const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe.only('Bookmarks Endpoints', function() {

    let db

    before('make knex instance', () => {
      db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
      })
      app.set('db', db)
    })
  
    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks_table').truncate())

    afterEach('cleanup', () => db('bookmarks_table').truncate())
  
    describe(`GET /bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
            return supertest(app)
                .get('/bookmarks')
                .expect(200, [])
            })
        })
      context('Given there are bookmarks in the database', () => {
        const testBookmarks = makeBookmarksArray()
  
        beforeEach('insert bookmarks', () => {
          return db
            .into('bookmarks_table')
            .insert(testBookmarks)
        })
  
        it('responds with 200 and all of the bookmarks', () => {
          return supertest(app)
            .get('/bookmarks')
            .expect(200, testBookmarks)
        })
      })
    })
  
    describe(`GET /bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
            const id = 1
            return supertest(app)
                .get(`/bookmarks/${id}`)
                .expect(404, { error: { message: `bookmark doesn't exist` } })
            })
        })
      context('Given there are bookmarks in the database', () => {
        const testBookmarks = makeBookmarksArray()
  
        beforeEach('insert bookmarks', () => {
          return db
            .into('bookmarks_table')
            .insert(testBookmarks)
        })
  
        it('responds with 200 and the specified bookmark', () => {
          const id = 2
          const expectedBookmark = testBookmarks[id - 1]
          return supertest(app)
            .get(`/bookmarks/${id}`)
            .expect(200, expectedBookmark)
        })
      })
    })    
})