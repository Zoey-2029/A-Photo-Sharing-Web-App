"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();

var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var fs = require("fs");

// XXX - Your submission should work without this line. Comment out or delete this line for tests and before submission!
//var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost:27017/myApp', { useNewUrlParser: true, useUnifiedTopology: true });


// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));

app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

app.get('/', function (request, response) {
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }

    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.countDocuments({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    if(!request.session.user_id){
        console.log("No user is logged in");
        console.log("!!!!");
        response.status(401).send("No user is logged in");
        return;
    }

    User.find({}, function(err, users){
        if (err){
            console.log("ERROR");
            response.status(500).send(JSON.stringify(err));
            return;
        }else{
            var filteredUsers = [];
            for (let i = 0;  i < users.length; i++){
                let user = {
                    _id: users[i]._id,
                    first_name : users[i].first_name,
                    last_name: users[i].last_name
                }
                filteredUsers[i] = user;
            }
            console.log("get usersList");
            response.status(200).send(filteredUsers);
        }
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if(!request.session.user_id){
        console.log("ERROR");
        response.status(401).send("No user is logged in");
        return;
    }

    var id = request.params.id;
    User.findOne({_id: id}, function(err, user){
        if (err){
            console.log('User with _id:' + id + ' not found.');
            response.status(400).send(JSON.stringify(err));
            return;
        }else{
            var filteredUser = JSON.parse(JSON.stringify(user));
            delete filteredUser.__v;
            delete filteredUser.login_name; 
            delete filteredUser.password;
            response.status(200).send(filteredUser);
        }
    });
});

app.get("/updateUserUseage/:user_id", function(request, response){
    if(!request.session.user_id){
        console.log("ERROR");
        response.status(401).send("No user is logged in");
        return;
    }

    Photo.find({user_id : request.params.user_id}, function(err, photos){
        if (err){
            console.log('User not found.');
            response.status(400).send(JSON.stringify(err));
            return;
        }

        if (photos.length !== 0){
            photos.sort((a, b) => (a.date_time < b.date_time) ? 1 : -1);
            var recentUploadedPhoto = {
                date_time: photos[0].date_time,
                file_name : photos[0].file_name,
                image_data: photos[0].image_data
            }
            photos.sort((a, b) => (a.comments.length < b.comments.length) ? 1 : -1);
            var mostCommentedPhoto ={
                date_time: photos[0].date_time,
                file_name : photos[0].file_name,
                comments: photos[0].comments.length,
                image_data: photos[0].image_data
            };
            
            response.status(200).send({
                recentUploadedPhoto: recentUploadedPhoto,
                mostCommentedPhoto: mostCommentedPhoto
            })
        }else{
            response.status(200).send({
                recentUploadedPhoto: null,
                mostCommentedPhoto: null
            });
        }
    })
})

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response){
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }

    Photo.find({user_id: request.params.id}, function (err, photos){
        if (err){
            response.status(400).send(JSON.stringify(err));
            return;
        }
        var allPhotos = JSON.parse(JSON.stringify(photos));
            
        async.each(allPhotos, function(photo, mainCallback){
            delete photo.__v;
            async.each(photo.comments, function(comment, childCallback){
                var userId = comment.user_id;
                delete comment.user_id;
                
                var promise = User.findOne({_id : userId}).exec();
                promise.then(function(user){
                    var userObj ={
                        _id : user._id,
                        first_name : user.first_name, 
                        last_name : user.last_name
                    };
                    comment.user = userObj;
                    childCallback();
                });

            }, function(err){
                if (err){
                    console.log("error in updating comments of user photos");
                }else{
                    console.log("all comments have been updated");
                }
                mainCallback();
            })
        }, function(err){
            if (err){
                console.log("ERROR");
                response.status(400).send(JSON.stringify(err));
            }else{
    
                for (let i = allPhotos.length - 1; i >= 0; i--){
                    if (allPhotos[i].permittedList[0] !== "none"){
                        if (!allPhotos[i].permittedList.includes(request.session.user_id) && 
                            allPhotos[i].user_id != request.session.user_id){
                            allPhotos.splice(i, 1);
                        }
                    }
                }

                allPhotos.sort((a, b) => (a.date_time < b.date_time) ? 1 : -1);

                console.log("find photos of user with _id " + request.params.id);
                response.status(200).send(allPhotos);
            }
        });
    });
});

app.post("/admin/login", function(request, response){

    User.findOne({login_name: request.body.login_name}, function(err, user){
        if (err){
            console.log("ERROR");
            response.status(400).send(JSON.stringify(err));
            return;
        }else{
            if (!user){
                response.status(400).send("Invalid username");
                return;
            }

            if(user.password !== request.body.password){
                response.status(400).send("Invalid password");
                return;
            }

            request.session.user_id = user._id;
            response.status(200).send({_id: user._id});
        }
    })
})

app.post("/admin/logout", function(request, response){
    if(!request.session.user_id){
        response.status(400).send("No user is logged in");
        return;
    }
    request.session.destroy(function(err){
        if (err){
            response.status(400).send(JSON.stringify(err));
            return;
        }else{
            response.status(200).send("user logged out successfully");
        }
    });

})

app.post("/photos/new", function(request, response){
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }

    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).send("File Upload Error");
            return;
        }

        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes
    
        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        var timestamp = new Date().valueOf();
        var filename = 'U' +  String(timestamp) + request.file.originalname;

        Photo.create({
            file_name: filename,
            user_id: request.session.user_id,
            image_data: 'data:image/jpeg;base64,' + request.file.buffer.toString('base64'),
        }, function(err, photo){
            if (err){
                console.log("error in creating photo object");
                response.status(400).send(JSON.stringify(err));
                return;
            }else{
                photo.save();
                request.session.photo_id = photo._id;
                console.log("Photo created with _id: ", photo._id);
                response.status(200).send("Upload a new photo!");
            }
        });
    });
});

app.post("/updatePhotoVisibility", function(request, response){
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }

    Photo.findOne({_id : request.session.photo_id}, function(err, photo){
        if (err){
            console.log("error in creating photo object");
            response.status(400).send(JSON.stringify(err));
            return;
        }

        photo.permittedList = [];

        //public photo
        if (!request.body.sharing_list){
            photo.permittedList.push("none");
        }
        else{
            request.body.sharing_list.forEach(function(user){
                photo.permittedList.push(user.value);
            }); 
        }

        photo.save();
        delete request.session.photo_id;
        response.status(200).send("successfully upload a photo!");
    });
});

app.post("/commentsOfPhoto/:photo_id", function(request, response){
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }
    
    if (request.body.comment === ""){
        response.status(400).send("Empty comment!");
        return;
    }
    
    Photo.findOne({_id : request.params.photo_id}, function(err, photo){
        if (err){
            console.log("photo not found");
            response.status(400).send(JSON.stringify(err));
        }else{
            var newCommentObj = {
                comment: request.body.comment,
                user_id: request.session.user_id,
            }
            
            photo.comments.push(newCommentObj);
            photo.save();
            response.status(200).send("Add a new comment!");
        }
    });
});

app.post("/user", function(request, response){
    if ( request.body.login_name === "") {
        response.status(400).send("login_name undefined");
        return;
    }
    if ( request.body.password === "") {
        response.status(400).send("password undefined");
        return;
    }
    if (request.body.first_name === "") {
        response.status(400).send("first_name undefined");
        return;
    }
    if ( request.body.last_name === "") {
        response.status(400).send("last_name undefined");
        return;
    }

    User.findOne({login_name : request.body.login_name}, function(err, user){
        if (err){
            response.status(400).send(JSON.stringify(err));
            return;
        }else{
            if (user){
                response.status(400).send("Duplicate login name");
                return;
            }

            User.create({
                login_name: request.body.login_name,
                password: request.body.password,
                first_name: request.body.first_name,
                last_name: request.body.last_name, 
                location: request.body.location,
                occupation: request.body.occupation,
                description: request.body.description
            }, function(err, user){
                if (err){
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                user.save();
                response.status(200).send("Register successfully");
            });

        }
    });

});

app.post("/deletePhoto/:id", function(request, response){
    console.log(request.params.id);
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }

    if (request.body.user_id !== request.session.user_id){
        console.log("try to modify other's photo")
        response.status(401).send("Unable ot modify other's photo");
        return;
    }
    

    Photo.deleteOne({_id : request.params.id}, function(err){
        if (err){
            console.log("ERROR");
            response.status(400).send(JSON.stringify(err));
            return;
        }

        console.log("delete a photo successfully");
        response.status(200).send("delete a photo successfully!");  
    });
    
});

app.post("/deleteComment/:photo_id", function(request, response){
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }

    if (request.body.user_id !== request.session.user_id){
        console.log("try to modify other's comment");
        response.status(401).send("Unable ot modify other's comment");
        return;
    }

    Photo.findOne({_id: request.params.photo_id}, function(err, photo){
        if (err){
            response.status(400).send(JSON.stringify(err));
            return;
        }

        for (let i = 0; i <photo.comments.length; i++){
                
            if (photo.comments[i]._id == request.body._id){
                photo.comments.splice(i, 1);
                break;
            }
        }
        photo.save();
        response.status(200).send("delete a comment!");
        
    });
});

app.post("/deleteUser", function(request, response){
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }
    
    Photo.deleteMany({user_id: request.session.user_id}, function(err){
        if (err){
            response.status(400).send(JSON.stringify(err));
            return;
        }
        console.log("delete photos of current user!");
    });

    User.deleteOne({_id: request.session.user_id}, function(err){
        if (err){
            response.status(400).send(JSON.stringify(err));
            return;
        }
        console.log("delete user!");
      
    });


    Photo.updateMany(
        { "comments.user_id" : request.session.user_id}, 
        {$pull: {comments : {user_id : request.session.user_id}}},
        {multi: true}
    ).then(() =>{
        console.log("delete comments of current user!");
        Photo.updateMany(
            {},
            {$pull : {likes : request.session.user_id}},
            {multi : true}
        )
        .then(() =>{
            console.log("delete likes of current user");
        })
        .then(() =>{
            Photo.updateMany(
                {},
                {$pull: {permittedList : request.session.user_id}},
                {multi : true}
            )
            .then(() => {
                console.log("delete user in permitted list!");
                response.status(200).send("delete current user!"); 
            })
        })
    
    });
    
});

app.get("/sharingList" , function(request, response){
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }

    let options = [];
    let ids = [];
    User.find({}, function(err, users){
        if (err){
            response.status(400).send(JSON.stringify(err));
            return;
        }
        users.forEach(function(user){
            if (user._id !=  request.session.user_id){
                options.push({
                    label: user.first_name,
                    value: user._id
                });
                ids.push(user._id);
            }
        });

        var result = {
            options: options,
            idList : ids,
            loginUserId : request.session.user_id
        };

        console.log("get sharing list of current user!");
        response.status(200).send(result);
    });
});

app.post("/likePhoto", function(request, response){
    if(!request.session.user_id){
        console.log("No user is logged in");
        response.status(401).send("No user is logged in");
        return;
    }

    Photo.findOne({_id : request.body.photo_id}, function(err, photo){
        
        if (err){
            response.status(400).send(JSON.stringify(err));
            return;
        }

        if (request.body.count === -1){
            photo.likes.splice(photo.likes.indexOf(request.session.user_id), 1);
        }else{
            photo.likes.push(request.session.user_id);
        }
        photo.save();
        console.log("update likes of current photo");
        response.status(200).send("update like of current photo");

    });
});

var server = app.listen(8000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


