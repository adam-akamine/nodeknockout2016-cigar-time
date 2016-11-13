var express = require('express')
var path = require('path');
var app = express()
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var pug = require('pug');
var bodyParser = require('body-parser');


app.set('port', (process.env.PORT || 5000))
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded ({
  extended: true
}));
app.use(bodyParser.json());

app.get('/', function(request, response) {
  response.render('home');
})

app.get('/results', function (req, res) {
  res.render('results');
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

app.post('/', function(req, res, next) {
  var alphaArray = ['A', 'B', 'C', null, 'D', 'E', 'F', 'G', null, 'H', 'I', 'J', 'K', null, 'L', 'M', 'N', 'O', null, 'P', 'Q', 'R', 'S', null, 'T', 'U', 'V', 'W', null, 'X', 'Y', 'Z'];
  var url = "http://www.atlanticcigar.com/shop-by-brand.aspx";
  var brand = req.body.cigarBrand;
  console.log("Searching for brand: " + brand);
  var firstChar = brand.charAt(0).toUpperCase();
  var detectNum = false;
  var foundBrand = false;

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  if(!isNaN(brand.charAt(0))) {
    console.log("Numeric value " + firstChar + " at character index 0 detected.");
    detectNum = true;
  }

  request(url, function (error, response, html) {
    if(!error) {
      var $ = cheerio.load(html);
      var alphaList = 0;
      var brandList = [];

      if(detectNum) {
        alphaList = $('.list-brands li').children().first().children();
        for(var i = 0; i < alphaList.length; i++) {
          brandList.push(alphaList.eq(i).text());
        }
        for(var j = 0; j < brandList.length; j++) {
          if(brandList[j].toLowerCase().includes(brand.toLowerCase())) {
            foundBrand = true;
          }
        }
      }
      else {
        var index = alphaArray.indexOf(firstChar) + 1;
        // if(index > 3 && index <= 7) {
        //   index++;
        //   console.log("Adding 1 to index");
        // }
        // else if(index > 7 && index <= 12) {
        //   index+=2;
        //   console.log("Adding 2 to index");

        // }
        // else if(index > 12 && index <= 17) {
        //   index+=3;
        //   console.log("Adding 3 to index");

        // }
        // else if(index > 17 && index <= 22) {
        //   index+=4;
        // }
        // else if(index > 22 && index <= 27) {
        //   index+=5;
        // }
        console.log("index: " + index);
        alphaList = $('.list-brands').children().eq(index).children();
        console.log(alphaList.text());
        console.log(alphaList.length);
        if(alphaList.text().toLowerCase().includes(brand.toLowerCase())) {
          foundBrand = true;
        }
      }

      if(foundBrand) {
        console.log("Found brand!");
        var cigarUrl = "http://www.atlanticcigar.com/cigars/" + brand.toLowerCase().replace(/ /g, "-").replace("#", "") + ".asp";
        res.render('results', {"cigarBrand": brand});
      }
      else {
        console.log("Brand not found");
        res.render('no-results', {"cigarBrand": brand});
      }
    }
    else {
      throw error;
    }
  })
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
