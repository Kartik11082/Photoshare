import DeleteIcon from '@mui/icons-material/Delete';
import { Button, Card, CardContent, CardMedia, Divider, IconButton, Typography } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CommentInput from "../CommentInput";
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import PhotoUpload from "../PhotoUpload";
import "./styles.css";

function UserPhotos({ userId, advancedFeaturesEnabled, currentUser }) {
    const [photos, setPhotos] = useState([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    // const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'photo' or 'comment'

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

    useEffect(() => {
        const checkOwnProfile = async () => {
            try {
                const response = await axios.get('/user/current');
                setIsOwnProfile(String(response.data._id) === String(userId));
            } catch (error) {
                setIsOwnProfile(false);
            }
        };
        checkOwnProfile();
    }, [userId]);

    const handlePhotoUploaded = (newPhoto) => {
        setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
        if (advancedFeaturesEnabled) {
            setCurrentPhotoIndex(photos.length);
        }
        setShowUploadDialog(false);
    };

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const response = await axios.get(`/photosOfUser/${userId}`);
                setPhotos(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching photos:", error);
                setLoading(false);
            }
        };

        fetchPhotos();
    }, [userId]);

    const refreshPhotos = async () => {
        try {
            const response = await axios.get(`/photosOfUser/${userId}`);
            setPhotos(response.data);
        } catch (error) {
            console.error("Error refreshing photos:", error);
        }
    };

    const handleDeleteClick = (type, id) => {
        setDeleteType(type);
        setItemToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            if (deleteType === 'photo') {
                await axios.delete(`/photos/${itemToDelete}`);
                setPhotos(photos.filter(photo => photo._id !== itemToDelete));
            } else if (deleteType === 'comment') {
                const [photoId, commentId] = itemToDelete.split(':');
                await axios.delete(`/comments/${photoId}/${commentId}`);
                const updatedPhotos = photos.map(photo => {
                    if (photo._id === photoId) {
                        return {
                            ...photo,
                            comments: photo.comments.filter(comment => comment._id !== commentId)
                        };
                    }
                    return photo;
                });
                setPhotos(updatedPhotos);
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        setDeleteType(null);
    };

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

    const renderComments = (comments, photo) => {
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
                    {(isOwnProfile || comment.user._id === currentUser._id) && (
                        <IconButton
                            onClick={() => handleDeleteClick('comment', `${photo._id}:${comment._id}`)}
                            color="error"
                            size="small"
                        >
                            <DeleteIcon />
                        </IconButton>
                    )}
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
    //         });

    //         const newCommentData = response.data.comment;

    //         // Update the photos array with the new comment
    //         const updatedPhotos = photos.map((photo) => {
    //             if (photo._id === photoId) {
    //                 return {
    //                     ...photo,
    //                     comments: [...photo.comments, newCommentData],
    //                 };
    //             }
    //             return photo;
    //         });

    //         setPhotos(updatedPhotos);
    //         setNewComment(""); // Clear the input field

    //     } catch (error) {
    //         console.error("Error submitting comment:", error);
    //         // You might want to show an error message to the user here
    //     }
    // };

    if (!advancedFeaturesEnabled) {
        return (
            <div>
                <Typography variant="h4">Photos of User {userId}</Typography>
                {isOwnProfile && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowUploadDialog(true)}
                        sx={{ mb: 2 }}
                    >
                        Add Photo
                    </Button>
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
                            {renderComments(photo.comments, photo)}
                            <CommentInput
                                photoId={photo._id}
                                onCommentSubmitted={(newCommentData) => {
                                    const updatedPhotos = photos.map((p) => {
                                        if (p._id === photo._id) {
                                            return {
                                                ...p,
                                                comments: [...p.comments, newCommentData],
                                            };
                                        }
                                        return p;
                                    });
                                    setPhotos(updatedPhotos);
                                }}
                            />
                            {isOwnProfile && (
                                <IconButton
                                    onClick={() => handleDeleteClick('photo', photo._id)}
                                    color="error"
                                    size="small"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {showUploadDialog && (
                    <PhotoUpload
                        onClose={() => setShowUploadDialog(false)}
                        onPhotoUploaded={(newPhoto) => {
                            handlePhotoUploaded(newPhoto);
                            refreshPhotos();
                        }}
                    />
                )}
                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    title={`Delete ${deleteType === 'photo' ? 'Photo' : 'Comment'}`}
                    message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteDialogOpen(false)}
                />
            </div>
        );
    } else {
        const photo = photos[currentPhotoIndex];
        return (
            <div>
                <Typography variant="h4">Photos of User {userId}</Typography>
                {isOwnProfile && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowUploadDialog(true)}
                        sx={{ mb: 2 }}
                    >
                        Add Photo
                    </Button>
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
                <Card key={photo?._id} sx={{ marginBottom: 2 }}>
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
                        {renderComments(photo.comments, photo)}
                        <CommentInput
                            photoId={photo._id}
                            onCommentSubmitted={(newCommentData) => {
                                const updatedPhotos = photos.map((p) => {
                                    if (p._id === photo._id) {
                                        return {
                                            ...p,
                                            comments: [...p.comments, newCommentData],
                                        };
                                    }
                                    return p;
                                });
                                setPhotos(updatedPhotos);
                            }}
                        />
                        {isOwnProfile && (
                            <IconButton
                                onClick={() => handleDeleteClick('photo', photo._id)}
                                color="error"
                                size="small"
                            >
                                <DeleteIcon />
                            </IconButton>
                        )}
                    </CardContent>
                </Card>
                {showUploadDialog && (
                    <PhotoUpload
                        onClose={() => setShowUploadDialog(false)}
                        onPhotoUploaded={(newPhoto) => {
                            handlePhotoUploaded(newPhoto);
                            refreshPhotos();
                        }}
                    />
                )}
                <DeleteConfirmDialog
                    open={deleteDialogOpen}
                    title={`Delete ${deleteType === 'photo' ? 'Photo' : 'Comment'}`}
                    message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteDialogOpen(false)}
                />
            </div>
        );
    }
}

export default UserPhotos;
