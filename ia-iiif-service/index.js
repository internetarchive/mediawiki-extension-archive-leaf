const fetch = require('node-fetch');
const express = require('express');

const base = 'http://iiif.archivelab.org/iiif/';

let app = express();
app.disable('x-powered-by');

app.get('/', function (req, res) {
  if ('url' in req.query) {
    let url = req.query.url.replace(/\$/g, '%24');
    fetch(base + url)
    .then(httpRes => {
      res.set('Content-type', httpRes.headers.get('Content-type'));
      httpRes.body.pipe(res);
    })
    .catch((e) => {
      console.error(e);
      res.sendStatus(409);
    });
  } else {
    res.sendStatus(422);
  }
});

app.listen(process.env.PORT || 3000);
