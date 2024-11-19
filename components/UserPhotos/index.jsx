import React, { useState, useEffect } from "react";
import { Typography, Card, CardContent, CardMedia, Divider, Button, TextField } from "@mui/material";
import { Link } from "react-router-dom";
import axios from "axios";
import "./styles.css";
import PhotoUpload from '../PhotoUpload';

function UserPhotos({ userId, advancedFeaturesEnabled }) {
    const [photos, setPhotos] = useState([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [newComment, setNewComment] = useState("");  // New state for comment text
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [loading, setLoading] = useState(true); // Add loading state

    useEffect(() => {
        const checkOwnProfile = async () => {
            try {
                const response = await axios.get('/user/current');
                setIsOwnProfile(String(response.data._id) === String(userId));
            } catch (error) {
                console.error("Error checking user profile:", error);
                setIsOwnProfile(false);
            }
        };

        checkOwnProfile();
    }, [userId]);

    useEffect(() => {
        console.log("Fetching user photos");
        const fetchPhotos = async () => {
            try {
                const response = await axios.get(`/photosOfUser/${userId}`);
                setPhotos(response.data);
            } catch (error) {
                console.error("Error fetching photos:", error);
                if (error.response?.status !== 404) {
                    // Only show error if it's not a "no photos" error
                    console.error("Error fetching photos:", error);
                }
            } finally {
                setLoading(false);
            }
        };

        const delayFetch = setTimeout(fetchPhotos, 1000);
        return () => clearTimeout(delayFetch);
    }, [userId]);

    if (loading) {
        return <Typography variant="body1">Loading...</Typography>;
    }

    if (photos.length === 0) {
        return <Typography variant="body1">Loading photos...</Typography>;
    }

    const goToNextPhoto = () => {
        if (currentPhotoIndex < photos.length - 1) {
            setCurrentPhotoIndex(currentPhotoIndex + 1);
        }
    };

    const goToPreviousPhoto = () => {
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(currentPhotoIndex - 1);
        }
    };

    // const renderComments = (comments) => {
    //     if (!comments || comments.length === 0) {
    //         return <Typography variant="body2">No comments available.</Typography>;
    //     }

    //     console.log("Comments structure:", comments);

    //     return comments.map((comment) => {
    //         if (!comment || !comment.user) {
    //             console.warn("Invalid comment structure:", comment);
    //             return null; // Skip rendering this comment
    //         }
    //         console.log("Rendering comment:", comment);

    //         return (
    //             <div key={comment._id}>
    //                 <Typography variant="body2">
    //                     <Link to={`/users/${comment.user._id}`}>
    //                         {comment.user.first_name || 'Unknown'} {comment.user.last_name || ''}
    //                     </Link>{" "}
    //                     commented on {new Date(comment.date_time).toLocaleString()}:
    //                 </Typography>
    //                 <Typography variant="body1">{comment.comment}</Typography>
    //                 <Divider sx={{ margin: "10px 0" }} />
    //             </div>
    //         );
    //     }).filter(Boolean);
    // };
    const renderComments = (comments) => {
        if (!comments || comments.length === 0) {
            return <Typography variant="body2">No comments available.</Typography>;
        }

        return comments.map((comment) => {
            if (!comment || !comment.user) {
                console.warn("Invalid comment structure:", comment);
                return null; // Skip rendering invalid comments
            }

            return (
                <div key={comment._id}>
                    <Typography variant="body2">
                        <Link to={`/users/${comment.user._id}`}>
                            {comment.user.first_name || "Unknown"} {comment.user.last_name || ""}
                        </Link>{" "}
                        commented on {new Date(comment.date_time).toLocaleString()}:
                    </Typography>
                    <Typography variant="body1">{comment.comment}</Typography>
                    <Divider sx={{ margin: "10px 0" }} />
                </div>
            );
        }).filter(Boolean); // Filter out any invalid/null comments
    };


    // const handleCommentSubmit = async (photoId) => {
    //     if (!newComment.trim()) {
    //         console.log("Comment cannot be empty!");
    //         return;
    //     }

    //     try {
    //         const response = await axios.post(`/commentsOfPhoto/${photoId}`, {
    //             comment: newComment,
    //         }, {
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //         });

    //         const updatedPhotos = photos.map((photo) => {
    //             if (photo._id === photoId) {
    //                 const newCommentWithUser = {
    //                     ...response.data.comment,
    //                     user: {
    //                         _id: "current_user_id",
    //                         first_name: "Current",
    //                         last_name: "User"
    //                     }
    //                 };

    //                 return {
    //                     ...photo,
    //                     comments: [...photo.comments, newCommentWithUser]
    //                 };
    //             } else {
    //                 return photo;
    //             }
    //         });

    //         setPhotos(updatedPhotos);
    //         setNewComment("");

    //     } catch (error) {
    //         console.error("Error submitting comment:", error);
    //     }
    // };
    const handleCommentSubmit = async (photoId) => {
        if (!newComment.trim()) {
            console.log("Comment cannot be empty!");
            return;
        }

        try {
            const response = await axios.post(`/commentsOfPhoto/${photoId}`, {
                comment: newComment,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const newCommentData = response.data.comment;

            // Fetch user details using the user API
            const userResponse = await axios.get(`/user/${newCommentData.user_id}`);
            const userData = userResponse.data;

            const updatedPhotos = photos.map((photo) => {
                if (photo._id === photoId) {
                    return {
                        ...photo,
                        comments: [...photo.comments, {
                            ...newCommentData,
                            user: {
                                _id: userData._id,
                                first_name: userData.first_name,
                                last_name: userData.last_name
                            }
                        }],
                    };
                }
                return photo;
            });

            setPhotos(updatedPhotos);
            setNewComment("");

        } catch (error) {
            console.error("Error submitting comment:", error);
        }
    };

    const handlePhotoUploaded = (newPhoto) => {
        setPhotos(prevPhotos => [newPhoto, ...prevPhotos]);
    };

    if (!advancedFeaturesEnabled) {
        return (
            <div>
                <Typography variant="h4">Photos of User {userId}</Typography>
                {isOwnProfile && (
                    <PhotoUpload userId={userId} onPhotoUploaded={handlePhotoUploaded} />
                )}
                {photos.map((photo) => (
                    <Card key={photo._id} sx={{ marginBottom: 2 }}>
                        <CardMedia
                            component="img"
                            height="400"
                            image={`./images/${photo.file_name}`}
                            alt="User Photo"
                        />
                        <CardContent>
                            <Typography variant="body2">
                                Uploaded on: {new Date(photo.date_time).toLocaleString()}
                            </Typography>
                            <Divider sx={{ margin: "10px 0" }} />
                            <Typography variant="h6">Comments:</Typography>
                            {renderComments(photo.comments)}
                            <TextField
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                label="Add a comment"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                            />
                            <Button
                                onClick={() => handleCommentSubmit(photo._id)}
                                variant="contained"
                                color="primary"
                            >
                                Submit Comment
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    } else {
        const photo = photos[currentPhotoIndex];
        return (
            <div>
                <Typography variant="h4">Photos of User {userId}</Typography>
                {isOwnProfile && (
                    <PhotoUpload userId={userId} onPhotoUploaded={handlePhotoUploaded} />
                )}
                <div className="moveButton">
                    <Button
                        onClick={goToPreviousPhoto}
                        disabled={currentPhotoIndex === 0}
                        variant="contained"
                        color="primary"
                        sx={{ marginRight: 1 }}
                    >
                        Previous
                    </Button>
                    <Button
                        onClick={goToNextPhoto}
                        disabled={currentPhotoIndex === photos.length - 1}
                        variant="contained"
                        color="primary"
                    >
                        Next
                    </Button>
                </div>
                <Card key={photo._id} sx={{ marginBottom: 2 }}>
                    <CardMedia
                        component="img"
                        height="400"
                        image={`./images/${photo.file_name}`}
                        alt="User Photo"
                    />
                    <CardContent>
                        <Typography variant="body2">
                            Uploaded on: {new Date(photo.date_time).toLocaleString()}
                        </Typography>
                        <Divider sx={{ margin: "10px 0" }} />
                        <Typography variant="h6">Comments:</Typography>
                        {renderComments(photo.comments)}
                        <TextField
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            label="Add a comment"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                        />
                        <Button
                            onClick={() => handleCommentSubmit(photo._id)}
                            variant="contained"
                            color="primary"
                        >
                            Submit Comment
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
}

export default UserPhotos;
