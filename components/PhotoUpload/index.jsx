import React, { useRef, useState } from 'react';
import {
    Button,
    Box,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import axios from 'axios';

function PhotoUpload({ onClose, onPhotoUploaded }) {
    const [uploadStatus, setUploadStatus] = useState('');
    const [error, setError] = useState('');
    const uploadInput = useRef(null);

    const handleUploadButtonClicked = async (e) => {
        e.preventDefault();
        setError('');
        setUploadStatus('');

        if (!uploadInput.current?.files?.length) {
            setError('Please select a file first');
            return;
        }

        const domForm = new FormData();
        domForm.append('uploadedphoto', uploadInput.current.files[0]);

        try {
            const response = await axios.post('/photos/new', domForm);
            setUploadStatus('Photo uploaded successfully!');
            if (onPhotoUploaded) {
                onPhotoUploaded(response.data);
            }
            // Clear the file input
            uploadInput.current.value = '';
            // Close dialog after successful upload
            setTimeout(() => onClose(), 1500);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Error uploading photo');
        }
    };

    return (
        <Dialog open={true} onClose={onClose}>
            <DialogTitle>Upload New Photo</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2, mt: 2 }}>
                    <input
                        type="file"
                        accept="image/*"
                        ref={uploadInput}
                        style={{ marginBottom: '10px' }}
                    />
                    {error && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                            {error}
                        </Alert>
                    )}
                    {uploadStatus && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                            {uploadStatus}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleUploadButtonClicked}
                    color="primary"
                >
                    Upload Photo
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default PhotoUpload;