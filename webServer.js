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
// const SchemaInfo = require("./schema/schemaInfo.js");

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


app.get("/user/list", async function (req, res) {
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    try {
        const users = await User.find({}, "_id first_name last_name");
        return res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching user list:", err);
        return res.status(500).send("Internal server error");
    }
});

/**
 * URL /user/:id - Returns the information for User (id) if the user is logged in.
 */
app.get("/user/:id", async function (req, res) {
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
        return res.status(200).json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        return res.status(500).send("Internal server error");
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
            return res.status(404).send("No photos found for this user");
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
        return res.status(500).send("Internal server error");
    }
});

/**
 * URL /commentsOfPhoto/:photo_id - Add a new comment to a photo
 */
app.post("/commentsOfPhoto/:photo_id", async function (req, res) {
    // Check if user is logged in
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    const photoId = req.params.photo_id;
    const { comment } = req.body;

    // Validate comment
    if (!comment || comment.trim().length === 0) {
        return res.status(400).json({ message: "Comment text is required." });
    }

    try {
        // Find the photo
        const photo = await Photo.findById(photoId);
        if (!photo) {
            return res.status(404).json({ message: "Photo not found." });
        }

        // Create new comment
        const newComment = {
            comment: comment.trim(),
            user_id: req.session.userIdRecord,
            date_time: new Date()
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
                _id: photo.comments[photo.comments.length - 1]._id, // Get the ID MongoDB assigned
                user: {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            }
        });
    } catch (err) {
        console.error("Error adding comment:", err);
        return res.status(500).json({ message: "Internal server error" });
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
        return res.status(500).json({ message: "An error occurred. Please try again later." });
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
            return res.status(500).json({ message: "Error during logout. Please try again." });
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
app.get("/user/current", async function (req, res) {
    // Check if user is logged in
    if (!req.session || !req.session.userIdRecord) {
        return res.status(401).json({ message: "User not logged in." });
    }

    try {
        const user = await User.findById(req.session.userIdRecord);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name
        });
    } catch (err) {
        console.error("Error fetching current user:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Start the server
const server = app.listen(3000, function () {
    const port = server.address().port;
    console.log("Listening at http://localhost:%s exporting the directory %s", port, __dirname);
});
