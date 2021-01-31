const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', function() {

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
  
    describe(`GET /api/bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
          context(`Given an XSS attack bookmark`, () => {
            const maliciousBookmark = {
              id: 911,
              title: 'Naughty naughty very naughty <script>alert("xss");</script>',
              url: 'https://url.to.file.which/does-not.exist',
              rating: '3',
              desc: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
            }
      
            beforeEach('insert malicious bookmark', () => {
              return db
                .into('bookmarks_table')
                .insert([ maliciousBookmark ])
            })
      
            it('removes XSS attack content', () => {
              return supertest(app)
                .get(`/api/bookmarks/${maliciousBookmark.id}`)
                .expect(200)
                .expect(res => {
                  expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                  expect(res.body.desc).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
                })
            })
          })

            it(`responds with 404`, () => {
            const id = 1
            return supertest(app)
                .get(`/api/bookmarks/${id}`)
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
            .get(`/api/bookmarks/${id}`)
            .expect(200, expectedBookmark)
        })
      })
    }) 
    
  describe(`POST /bookmarks`, () => {
    it(`creates an bookmark, responding with 201 and the new bookmark`,  function() {
      this.retries(3)
      const newBookmark = {
        title: 'post this bookmark',
        url: 'www.bookmark.com',
        rating: '5',
        desc: 'bookmark to post'
      }
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body.desc).to.eql(newBookmark.desc)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
        })
        .then(postRes =>
          supertest(app)
            .get(`/api/bookmarks/${postRes.body.id}`)
            .expect(postRes.body)
        )
    })
    
    const requiredFields = ['title', 'url', 'rating', 'desc']

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'post this bookmark',
        url: 'www.bookmark.com',
        rating: '5',
        desc: 'bookmark to post'
      }

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field]

        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    })
  })   
  describe(`DELETE /api/bookmarks/:id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const id = 123456
        return supertest(app)
          .delete(`/api/bookmarks/${id}`)
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

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks`)
              .expect(expectedBookmarks)
          )
      })
    })
  }) 
  describe.only(`PATCH /api/bookmarks/:id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const id = 123456
        return supertest(app)
          .patch(`/api/bookmarks/${id}`)
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

      it('responds with 204 and updates the bookmark', () => {
        const idToUpdate = 2
        const updateBookmark = {
          title: 'updated',
          url: 'wwwurl',
          rating: '8',
          desc: 'test'
        }
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send(updateBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .expect(expectedBookmark)
          )
      })
      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .send({ irrelevantField: 'foo' })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title', 'url', 'rating', or 'desc'`
            }
          })
      })
      it(`responds with 204 when updating only a subset of fields`, () => {
          const idToUpdate = 2
          const updateBookmark = {
            title: 'updated bookmark title',
          }
          const expectedBookmark = {
            ...testBookmarks[idToUpdate - 1],
            ...updateBookmark
          }
    
          return supertest(app)
            .patch(`/api/bookmarks/${idToUpdate}`)
            .send({
              ...updateBookmark,
              fieldToIgnore: 'should not be in GET response'
            })
            .expect(204)
            .then(res =>
              supertest(app)
                .get(`/api/bookmarks/${idToUpdate}`)
                .expect(expectedBookmark)
            )
        })

    })
    })

})