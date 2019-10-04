// Load the SDK and UUID
var AWS = require('aws-sdk');
var uuid = require('uuid');

var express = require('express')
var multer = require('multer')
var multerS3 = require('multer-s3')
var bodyParser = require('body-parser');
 
var app = express()
var rekognition = new AWS.Rekognition({apiVersion: process.env.API_VERSION});
const dotenv = require('dotenv');
dotenv.config();

var s3 = new AWS.S3();
var listenPort = process.env.PORT;
app.use(express.static('public'));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({ extended: true , limit: '100mb', parameterLimit: 500000}));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            console.log(file);
            console.log(file.originalurl);
            var A = Date.now();
            console.log(cb);
            console.log(req);
            cb(null, A + file.originalname); //use Date.now() for unique file keys
        }
    })
});
var cpUpload = upload.fields([{ name: 'imgSelfie', maxCount: 1 }, { name: 'imgIDCard', maxCount: 1 }])
app.post('/faceCompare', cpUpload, function(req, res, next) {
	console.log(req.files['imgSelfie']);
	 var params = {
	  SimilarityThreshold: 80, 
	  SourceImage: {
	   S3Object: {
	    Bucket: process.env.AWS_BUCKET, 
	    Name: req.files['imgSelfie'][0].key
	   }
	  }, 
	  TargetImage: {
	   S3Object: {
	    Bucket: process.env.AWS_BUCKET, 
	    Name: req.files['imgIDCard'][0].key
	   }
	  }
	 };
	 rekognition.compareFaces(params, function(err, data) {
	   if (err){
	   	console.log(err, err.stack); // an error occurred
	   } 
	   else {
	   	let result = {
	   		statusCode:200,
	   		data: data
	   	}
		res.json(result);
	   }
	});


});

app.listen(listenPort, function () {
    console.log('Admin webserver listening on port ' + listenPort);
});

// AWS.config.getCredentials(function(err) {
//   if (err) console.log(err.stack);
//   // credentials not loaded
//   else {
//     console.log("Access key:", AWS.config.credentials.accessKeyId);
//     console.log("Secret access key:", AWS.config.credentials.secretAccessKey);
//   }
// });


// console.log("Region: ", AWS.config.region);


// // Create unique bucket name
// var bucketName = 'node-sdk-sample-' + uuid.v4();
// // Create name for uploaded object key
// var keyName = 'hello_world.txt';

// // Create a promise on S3 service object
// var bucketPromise = new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName}).promise();

// // Handle promise fulfilled/rejected states
// bucketPromise.then(
//   function(data) {
//     // Create params for putObject call
//     var objectParams = {Bucket: bucketName, Key: keyName, Body: 'Hello World!'};
//     // Create object upload promise
//     var uploadPromise = new AWS.S3({apiVersion: '2006-03-01'}).putObject(objectParams).promise();
//     uploadPromise.then(
//       function(data) {
//         console.log("Successfully uploaded data to " + bucketName + "/" + keyName);
//       });
// }).catch(
//   function(err) {
//     console.error(err, err.stack);
// });

