var express = require('express')
var path = require('path');
var app = express()
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var pug = require('pug');


app.set('port', (process.env.PORT || 5000))
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.render('home');
})

app.get('/results', function (req, res) {
  res.render('results');
})

app.get('/find/:brand', function (req, res) {
  url = "http://www.atlanticcigar.com/shop-by-brand.aspx";
  var alphaArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  var brand = req.params.brand;
  var firstChar = brand.charAt(0);
  var detectNum = false;
  var foundBrand = false;

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  if(!isNaN(brand.charAt(0))) {
    console.log("Numeric value " + firstChar + " at character index 0 detected.");
    detectNum = true;
  }
  else {
    firstChar = firstChar.toUpperCase();
    brand = capitalizeFirstLetter(brand);
    console.log("Searching for: " + brand);
  }

  request(url, function (error, response, html) {
    if(!error) {
      var $ = cheerio.load(html);
      var secondChild = $('.list-brands').children().eq(1);
      console.log(secondChild.text());
      $('.list-brands').find('li').filter(function () {
        var data = $(this);
        // console.log("searching for " + brand);

        // console.log(data.children().text());
        if(data.children().text().includes(brand)) {
          var foundBrand = true;
        }
      })

      if(foundBrand) {
        console.log("Found brand!");
      }
      else {
        console.log("Brand not found");
      }


    }

    else {
      throw error;
    }

    res.send("done searching");
  })
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
        console.log("blender: " + blender);
        json.blender = blender;

        /* Get the shape of the cigar */
        var shape = getDetail(data, "Shape");
        console.log("shape: " + shape);
        json.shape = shape;

        /* Get the size of the cigar */
        var size = getDetail(data, "Size");
        console.log("size: " + size);
        json.size = size;
      });

      function getDetail(data, detail) {
        console.log("Getting " + detail);
        var detailsArray = data.text().trim().split(/\s+/);
        if(data.text().includes(detail + ":")) {
          var index = detailsArray.indexOf(detail + ":");
          var detailsArraySliced = detailsArray.slice(index + 1);

          for(var i = 0; i < detailsArraySliced.length; i++) {
            if(detailsArraySliced[i].includes(":")) {
              var end = i;
              break;
            }
          }

          var slicedDetail = detailsArraySliced.slice(0, end);
        }
        else {
          console.log("Detail not found.");
        }
        return slicedDetail.join(" ");
      }



    /* Store data into JSON file */
    fs.appendFile('output.json', JSON.stringify(json, null, 4), function(err) {
      console.log("File written");
    });
  }

  else {
    throw error;
  }
  })

  res.send("Done scraping.");
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
