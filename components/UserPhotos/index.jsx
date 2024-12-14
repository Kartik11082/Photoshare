import DeleteIcon from '@mui/icons-material/Delete';
import { Button, Card, CardContent, CardMedia, Divider, IconButton, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CommentInput from "../CommentInput";
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import PhotoUpload from "../PhotoUpload";
import "./styles.css";
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

function UserPhotos({ userId, advancedFeaturesEnabled, currentUser }) {
    const [photos, setPhotos] = useState([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'photo' or 'comment'
    const [deletePhotosDialogOpen, setDeletePhotosDialogOpen] = useState(false);
    const [favorites, setFavorites] = useState(new Set());

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
                // const response = await axios.get('/user/current');
                const response = await axios.get('/currentUser');
                setIsOwnProfile(String(response.data._id) === String(userId));
            } catch (error) {
                setIsOwnProfile(false);
            }
        };
        checkOwnProfile();
    }, [userId]);

    useEffect(() => {
        const loadFavorites = async () => {
            try {
                const response = await axios.get('/favorites');
                const favoriteIds = new Set(response.data.map(fav => fav.photo_id._id));
                setFavorites(favoriteIds);
            } catch (error) {
                console.error('Error loading favorites:', error);
            }
        };

        if (currentUser) {
            loadFavorites();
        }
    }, [currentUser]);

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
                // window.location.reload();
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

    const handleFavoriteToggle = async (photoId) => {
        try {
            if (favorites.has(photoId)) {
                await axios.delete(`/favorites/remove/${photoId}`);
                favorites.delete(photoId);
            } else {
                await axios.post(`/favorites/add/${photoId}`);
                favorites.add(photoId);
            }
            setFavorites(new Set(favorites));
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const renderFavoriteButton = (photoId) => (
        <IconButton
            onClick={() => handleFavoriteToggle(photoId)}
            color={favorites.has(photoId) ? "secondary" : "default"}
        >
            {favorites.has(photoId) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
    );

    const handleDeleteUserPhotos = async () => {
        try {
            // await axios.delete(`/photos/user/${userId}`);
            await axios.delete(`/photos/user/${userId}`);
            setPhotos([]);
            console.log("All photos deleted successfully.");
        } catch (error) {
            console.error("Error deleting photos:", error);
        }
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


    if (!advancedFeaturesEnabled) {
        return (
            <div>
                <Typography variant="h4">Photos of User {userId}</Typography>
                {isOwnProfile && (
                    <>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setDeletePhotosDialogOpen(true)}
                            sx={{ mb: 2 }}
                        >
                            Delete All My Photos
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setShowUploadDialog(true)}
                            sx={{ mb: 2 }}
                        >
                            Add Photo
                        </Button>
                    </>
                )}
                <DeleteConfirmDialog
                    open={deletePhotosDialogOpen}
                    title="Delete All Photos"
                    message="Are you sure you want to delete all your photos? This action cannot be undone."
                    onConfirm={handleDeleteUserPhotos}
                    onCancel={() => setDeletePhotosDialogOpen(false)}
                />
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
                            {currentUser && renderFavoriteButton(photo._id)}
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
                    <>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setDeletePhotosDialogOpen(true)}
                            sx={{ mb: 2 }}
                        >
                            Delete All My Photos
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setShowUploadDialog(true)}
                            sx={{ mb: 2 }}
                        >
                            Add Photo
                        </Button>
                    </>
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
                        {currentUser && renderFavoriteButton(photo._id)}
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
