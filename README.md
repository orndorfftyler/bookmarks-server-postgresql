# bookmarks-server

This server manages a JS array of "bookmark" objects (no database).

GET /bookmarks returns a list of bookmarks

GET /bookmarks/:id returns a single bookmark with the given ID, returns 404 Not Found if the ID is not valid

POST /bookmarks accepts a JSON object representing a bookmark and adds it to the list of bookmarks after validation

DELETE /bookmarks/:id deletes the bookmark with the given ID

Built using Express, JavaScript.

