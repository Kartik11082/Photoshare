/**
 * This builds on the webServer of previous projects. It exports the current directory
 * via a webserver and establishes a connection to the MongoDB named 'project6'.
 *
 * It includes session handling using in-memory storage for simplicity.
 */

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const express = require("express");
const session = require("express-session");
const multer = require("multer");
const processFormBody = multer({ storage: multer.memoryStorage() }).single('uploadedphoto');
const fs = require("fs");

const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies.

// Load the Mongoose schema for User, Photo, and SchemaInfo
const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");
const Favorite = require("./schema/favorite.js");

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project6", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Configure session middleware with in-memory storage
app.use(
    session({
        secret: "your_secret_key", // Replace with a strong secret
        resave: false, // Avoid resaving unchanged sessions
        saveUninitialized: false, // Do not save empty sessions
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours session duration
            secure: false, // Set to true only if using HTTPS
        },
    })
);

// Serve static files from the current directory
app.use(express.static(__dirname));

app.get("/", function (request, response) {
    response.send("Simple web server of files from " + __dirname);
});

/**
 * URL /user/list - Returns all the User objects if the user is logged in.
 */


app.get("/test/:p1", async function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params
    // objects.
    console.log("/test called with param1 = ", request.params.p1);

    const param = request.params.p1 || "info";

    if (param === "info") {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will
        // match it.
        try {

            const info = await SchemaInfo.find({});
            if (info.length === 0) {
                // No SchemaInfo found - return 500 error
                return response.status(500).send("Missing SchemaInfo");
            }
            console.log("SchemaInfo", info[0]);
            return response.json(info[0]); // Use `json()` to send JSON responses
        } catch (err) {
            // Handle any errors that occurred during the query
            console.error("Error in /test/info:", err);
            return response.status(500).json(err); // Send the error as JSON
        }

    } else if (param === "counts") {
        // If the request parameter is "counts", we need to return the counts of all collections.
        // To achieve this, we perform asynchronous calls to each collection using `Promise.all`.
        // We store the collections in an array and use `Promise.all` to execute each `.countDocuments()` query concurrently.


        const collections = [
            { name: "user", collection: User },
            { name: "photo", collection: Photo },
            { name: "schemaInfo", collection: SchemaInfo },
        ];

        try {
            await Promise.all(
                collections.map(async (col) => {
                    col.count = await col.collection.countDocuments({});
                    return col;
                })
            );

            const obj = {};
            for (let i = 0; i < collections.length; i++) {
                obj[collections[i].name] = collections[i].count;
            }
            return response.end(JSON.stringify(obj));
        } catch (err) {
            return response.status(500).send(JSON.stringify(err));
        }
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400)
        // status.
        return response.status(400).send("Bad param " + param);
    }
});

app.get("/user/list", async function (req, res) {
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    try {
        const users = await User.find({}, "_id first_name last_name");
        return res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching user list:", err);
        return res.status(400).send("Internal server error");
    }
});

/**
 * URL /user/:id - Returns the information for User (id) if the user is logged in.
 */
app.get("/user/:id", async function (req, res) {
    // console.log("/user/:id:", req.params);
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send("Invalid user ID");
    }

    try {
        const user = await User.findById(id, "_id first_name last_name location description occupation");
        if (!user) {
            return res.status(404).send("User not found");
        }

        console.log("/user/:id:", req.params, user);
        return res.status(200).json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        return res.status(400).send("Internal server error");
    }
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id) if the user is logged in.
 */
app.get("/photosOfUser/:id", async function (req, res) {
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    const id = req.params.id;
    try {
        const photos = await Photo.find({ user_id: id }, "_id user_id comments file_name date_time");
        if (!photos.length) {
            return res.status(400).send("No photos found for this user");
        }

        const transformedPhotos = await Promise.all(
            photos.map(async (photo) => {
                const commentsWithUserDetails = await Promise.all(
                    photo.comments.map(async (comment) => {
                        const user = await User.findById(comment.user_id, "first_name last_name");
                        return {
                            comment: comment.comment,
                            date_time: comment.date_time,
                            _id: comment._id,
                            user: {
                                _id: user._id,
                                first_name: user.first_name,
                                last_name: user.last_name,
                            },
                        };
                    })
                );

                return {
                    _id: photo._id,
                    file_name: photo.file_name,
                    date_time: photo.date_time,
                    user_id: photo.user_id,
                    comments: commentsWithUserDetails,
                };
            })
        );

        return res.status(200).json(transformedPhotos);
    } catch (err) {
        console.error("Error fetching photos:", err);
        return res.status(400).send("Internal server error");
    }
});

/**
 * URL /commentsOfPhoto/:photo_id - Add a new comment to a photo
 */
app.post("/commentsOfPhoto/:photo_id", async function (req, res) {
    // console.log("commentsOfPhoto Input:", req.params, req.body);
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    const photoId = req.params.photo_id;
    const { comment, mentions } = req.body;

    if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ message: "Comment text is required." });
    }

    try {
        const photo = await Photo.findById(photoId);
        if (!photo) {
            return res.status(404).json({ message: "Photo not found." });
        }

        // Format mentions data
        const formattedMentions = Array.isArray(mentions) ? mentions.map(mentionId => ({
            user_id: mentionId,
            date_time: new Date()
        })) : [];

        // Create new comment
        const newComment = {
            comment: comment.trim(),
            user_id: req.session.userIdRecord,
            date_time: new Date(),
            mentions: formattedMentions
        };

        // Add comment to photo
        photo.comments.push(newComment);
        await photo.save();

        // Get the user details for the response
        const user = await User.findById(req.session.userIdRecord, "first_name last_name");

        // Return the new comment with user details
        return res.status(200).json({
            comment: {
                ...newComment,
                _id: photo.comments[photo.comments.length - 1]._id,
                user: {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            }
        });
    } catch (err) {
        console.error("Error adding comment:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

/**
 * Login endpoint
 */
app.post("/admin/login", async (req, res) => {
    const { login_name, password } = req.body;

    if (!login_name || !password) {
        return res.status(400).json({ message: "Both login name and password are required." });
    }

    try {
        const user = await User.findOne({ login_name });

        if (!user || user.password !== password) {
            return res.status(400).json({ message: "Invalid login name or password." });
        }

        req.session.userIdRecord = user._id; // Store user ID in session
        console.log(`User ${login_name} logged in successfully.`);
        return res.status(200).json({ first_name: user.first_name, _id: user._id });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(400).json({ message: "An error occurred. Please try again later." });
    }
});

/**
 * Logout endpoint
 */
app.post("/admin/logout", (req, res) => {
    if (!req.session || !req.session.userIdRecord) {
        return res.status(400).json({ message: "User is not logged in." });
    }

    return req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(400).json({ message: "Error during logout. Please try again." });
        }
        console.log("Logout successful.");
        return res.status(200).send();
    });
});

app.post("/photos/new", function (req, res) {
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    processFormBody(req, res, async function (error) {
        if (error || !req.file) {
            console.error("Error uploading photo:", error);
            return res.status(400).json({ message: "No photo file provided" });
        }

        try {
            // Create unique filename using timestamp
            const timestamp = new Date().valueOf();
            const filename = 'U' + String(timestamp) + req.file.originalname;

            // Write file to images directory
            await fs.promises.writeFile("./images/" + filename, req.file.buffer);

            // Create new photo object in database using the logged-in user's ID
            const photo = new Photo({
                file_name: filename,
                date_time: new Date(),
                user_id: req.session.userIdRecord,
                comments: []
            });

            await photo.save();
            return res.status(200).json(photo);
        } catch (err) {
            console.error("Error saving photo:", err);
            return res.status(500).json({ message: "Error saving photo" });
        }
    });
    return null;
});

/**
 * URL /user/current - Returns the current logged-in user's information
 */
// app.get("/user/current", async (req, res) => {
//     console.log("/user/current api call", req.params);
//     console.log("/user/current api call", req);
//     // Check if the session exists
//     if (!req.session || !req.session.userIdRecord) {
//         console.log("User not logged in. Session:", req.session);
//         return res.status(401).json({ message: "User not logged in." });
//     }

//     try {
//         const user = await User.findById(req.session.userIdRecord, "_id first_name last_name location description occupation");
//         console.log("/user/current:", user);

//         if (!user) {
//             return res.status(404).json({ message: "User not found." });
//         }

//         return res.status(200).json(user);
//     } catch (err) {
//         console.error("Error fetching current user:", err);
//         return res.status(500).json({ message: "Internal server error." });
//     }
// });
app.get("/user/current", async (req, res) => {
    // console.log("/user/current session data:", req.session);

    if (!req.session || !req.session.userIdRecord) {
        console.log("User not logged in.");
        return res.status(401).json({ message: "User not logged in." });
    }

    try {
        const user = await User.findById(req.session.userIdRecord, "_id first_name last_name location description occupation");
        console.log("Fetched user:", user);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json(user);
    } catch (err) {
        console.error("Error fetching current user:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// New endpoint to get the currently logged-in user from local storage
app.get("/currentUser", async (req, res) => {
    console.log("/currentUser session data:", req.session);

    if (!req.session || !req.session.userIdRecord) {
        console.log("User not logged in.");
        return res.status(401).json({ message: "User not logged in." });
    }

    try {
        const user = await User.findById(req.session.userIdRecord, "_id first_name last_name location description occupation");
        console.log("Fetched user:", user);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json(user);
    } catch (err) {
        console.error("Error fetching current user:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// Endpoint to register a new user
app.post("/user", async (req, res) => {
    const { login_name, password, first_name, last_name, location, description, occupation } = req.body;

    // Validation
    if (!login_name || !password || !first_name || !last_name) {
        return res.status(400).json({ message: "Required fields are missing" });
    }

    try {
        // Check if login_name already exists
        const existingUser = await User.findOne({ login_name });
        if (existingUser) {
            return res.status(400).json({ message: "Login name already exists" });
        }

        // Create new user
        const newUser = new User({ login_name, password, first_name, last_name, location, description, occupation });
        await newUser.save();

        // Respond with necessary user properties
        return res.status(200).json({ login_name: newUser.login_name, _id: newUser._id });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/mentionsOfUser/:id", async function (req, res) {
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    const userId = req.params.id;
    try {
        const photos = await Photo.find({
            "comments.mentions.user_id": userId
        }).populate('user_id', 'first_name last_name');

        const transformedPhotos = photos.map(photo => ({
            _id: photo._id,
            file_name: photo.file_name,
            date_time: photo.date_time,
            user_id: photo.user_id._id,
            owner_first_name: photo.user_id.first_name,
            owner_last_name: photo.user_id.last_name
        }));

        return res.status(200).json(transformedPhotos);
    } catch (err) {
        console.error("Error fetching mentions:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Delete a photo
app.delete("/photos/:photo_id", async function (req, res) {
    console.log("Deleting photos:", req.params)
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    try {
        const photo = await Photo.findById(req.params.photo_id);
        if (!photo) {
            return res.status(404).json({ message: "Photo not found" });
        }

        // Check if user owns the photo
        if (photo.user_id.toString() !== req.session.userIdRecord) {
            return res.status(403).json({ message: "Not authorized to delete this photo" });
        }

        await Photo.deleteOne({ _id: req.params.photo_id });
        return res.status(200).json({ message: "Photo deleted successfully" });
    } catch (err) {
        console.error('Error deleting photo:', err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Delete a comment
app.delete("/comments/:photo_id/:comment_id", async function (req, res) {
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    try {
        const photo = await Photo.findById(req.params.photo_id);
        if (!photo) {
            return res.status(404).json({ message: "Photo not found" });
        }

        const comment = photo.comments.id(req.params.comment_id);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Check if user owns the comment
        if (comment.user_id.toString() !== req.session.userIdRecord) {
            return res.status(403).json({ message: "Not authorized to delete this comment" });
        }

        photo.comments.pull(req.params.comment_id);
        await photo.save();
        return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
        console.error('Error deleting comment:', err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Delete user account
app.delete("/user/:user_id", async function (req, res) {
    // console.log("Session data:", req.params, req.session); // Log session data for debugging
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    if (req.params.user_id !== req.session.userIdRecord) {
        return res.status(403).json({ message: "Not authorized to delete this account" });
    }

    try {
        // Delete all photos by this user
        await Photo.deleteMany({ user_id: req.params.user_id });

        // Remove comments by this user from all photos
        await Photo.updateMany(
            { "comments.user_id": req.params.user_id },
            { $pull: { comments: { user_id: req.params.user_id } } }
        );

        // Delete the user
        await User.deleteOne({ _id: req.params.user_id });

        // Clear the session
        req.session.destroy();

        return res.status(200).json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error('Error deleting account:', err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Add a photo to favorites
app.post("/favorites/add/:photo_id", async (req, res) => {
    if (!req.session.userIdRecord) {
        return res.status(401).json({ error: "Not logged in" });
    }

    try {
        const favorite = new Favorite({
            user_id: req.session.userIdRecord,
            photo_id: req.params.photo_id
        });
        await favorite.save();
        res.status(200).json(favorite);
    } catch (err) {
        if (err.code === 11000) { // Duplicate key error
            res.status(400).json({ error: "Photo already in favorites" });
        } else {
            res.status(500).json({ error: "Server error" });
        }
    }
});

// Remove a photo from favorites
app.delete("/favorites/remove/:photo_id", async (req, res) => {
    if (!req.session.userIdRecord) {
        return res.status(401).json({ error: "Not logged in" });
    }

    try {
        await Favorite.deleteOne({
            user_id: req.session.userIdRecord,
            photo_id: req.params.photo_id
        });
        res.status(200).json({ message: "Removed from favorites" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get user's favorites
app.get("/favorites", async (req, res) => {
    if (!req.session.userIdRecord) {
        return res.status(401).json({ error: "Not logged in" });
    }

    try {
        const favorites = await Favorite.find({ user_id: req.session.userIdRecord })
            .populate({
                path: 'photo_id',
                populate: { path: 'user_id' }
            });
        res.status(200).json(favorites);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Start the server
const server = app.listen(3000, function () {
    const port = server.address().port;
    console.log("Listening at http://localhost:%s exporting the directory %s", port, __dirname);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Validate user credentials
    const user = await User.findOne({ username });
    if (!user || !user.validatePassword(password)) {
        return res.status(401).json({ message: "Invalid credentials." });
    }

    req.session.userIdRecord = user._id; // Store user ID in session
    return res.status(200).json({ message: "Login successful." });
});

// Endpoint to delete all photos for a specific user by user ID
app.delete("/photos/user/:user_id", async function (req, res) {
    // Check if the user is logged in
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    // Check if the user ID in the request matches the logged-in user
    if (req.params.user_id !== req.session.userIdRecord.toString()) {
        return res.status(403).json({ message: "Not authorized to delete these photos." });
    }

    try {
        // Delete all photos associated with the user ID
        const result = await Photo.deleteMany({ user_id: req.params.user_id });

        // Check if any photos were deleted
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "No photos found for this user." });
        }

        return res.status(200).json({ message: "All photos deleted successfully." });
    } catch (err) {
        console.error('Error deleting all photos:', err);
        return res.status(500).json({ message: "Internal server error." });
    }
});
