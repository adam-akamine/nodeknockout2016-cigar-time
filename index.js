var express = require('express')
var app = express()
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Hello from Node Knockout 2016!')
})

app.get('/scrape', function (req, res) {
  url = "http://www.atlanticcigar.com/Singles/Illusione-Fume-D'Amour-Juniperos-Lancero-Single.asp";

  request(url, function (error, resonse, html) {
    if(!error) {
      var $ = cheerio.load(html);

      var name, blender, shape, size;

      var json = { name: "", blender: "", shape: "", size:""}

      /* Get the name of the cigar */
      $('.productHeader').filter(function () {
        var data = $(this);

        name = data.children().first().text();
      })
      console.log("name: " + name);
      json.name = name;

      /* Get the blender of the cigar */
      $('.Details').filter(function () {
        data = $(this);


        /* Get the blender of the cigar */
        var blender = getDetail(data, "Blender");
        json.blender = blender;

        /* Get the shape of the cigar */
        var shape = getDetail(data, "Shape");
        json.shape = shape;
      });

      function getDetail(data, detail) {
        console.log("Getting " + detail);
        var detailsArray = data.text().trim().split(/\s+/);
        console.log(detailsArray);
        if(data.text().includes(detail + ":")) {
          var index = detailsArray.indexOf(detail + ":");
          var detailsArraySliced = detailsArray.slice(index + 1);
          var end = 0;
          for(var i = 0; i < detailsArraySliced.length; i++) {
            if(detailsArraySliced[i].includes(":")) {
              end = i;
              break;
            }
          }

          var slicedDetail = detailsArraySliced.slice(0, end);
          console.log("slicedDetail: " + slicedDetail);
          console.log(detail + ": " + slicedDetail.join(" "));
        }
        else {
          console.log("No Shape found.");
        }
        return slicedDetail.join(" ");
      }
    // fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err) {
    //   console.log("File written");
    // });
  }
  })

  res.send("Done scraping.");
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
