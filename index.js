const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const fs = require('fs');
const request = require('request');
const mime = require("mime");

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get("/health", function (req, res) {
  console.log("UP");
  res.write(JSON.stringify({"status": "UP"}));
  res.end();
});

app.get('/:path/:filename', function (req, res) {
  console.log('download');
  let filepath = '/files/' + req.params.path + '/' + req.params.filename;
  let filename = req.params.filename;

  if (!fs.existsSync('/files/' + req.params.path)) {
    fs.mkdirSync('/files/' + req.params.path);
  }

  if (!fs.existsSync(filepath)) {
    fs.createReadStream('./samples/new.pptx').pipe(fs.createWriteStream(filepath));
  }

  res.setHeader("Content-Length", fs.statSync(filepath).size);
  res.setHeader("Content-Type", mime.getType(filepath));

  res.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

  let filestream = fs.createReadStream(filepath);
  filestream.pipe(res);
})

app.post('/track', function (req, res) {
  console.log(req.body);
  let filename = req.query.filename;console.log(filename);

  let updateFile = function (response, body, path) {
    if (body.status == 2) {
      request(body.url).pipe(fs.createWriteStream(path + filename));

    }

    response.write(JSON.stringify({error: 0}));
    response.end();
  }

  let readbody = function (request, response, path) {
    let content = "";
    request.on("data", function (data) {
      content += data;
    });
    request.on("end", function () {
      let body = JSON.parse(content);
      updateFile(response, body, path);
    });
  }

  if (req.body.hasOwnProperty("status")) {
    updateFile(res, req.body, '/files/');
  } else {
    readbody(req, res, '/files/')
  }
});

app.listen(4000);