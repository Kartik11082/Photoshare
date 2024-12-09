import React, { useState, useEffect } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import axios from 'axios';
import { Box, Button } from '@mui/material';

// Define the styles for the mentions input
const mentionsInputStyle = {
    control: {
        backgroundColor: '#fff',
        fontSize: 14,
        fontWeight: 'normal',
    },
    input: {
        margin: 0,
        padding: 5,
        border: '1px solid #ddd',
        borderRadius: 4,
        width: '100%',
        minHeight: 60,
    },
    suggestions: {
        list: {
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 4,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        },
        item: {
            padding: '5px 15px',
            borderBottom: '1px solid rgba(0,0,0,0.15)',
            '&focused': {
                backgroundColor: '#1976d2',
                color: 'white',
            },
        },
    },
};

function CommentInput({ photoId, onCommentSubmitted }) {
    const [users, setUsers] = useState([]);
    const [comment, setComment] = useState('');
    const [mentions, setMentions] = useState([]);

    useEffect(() => {
        // Fetch users for mentions
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/user/list');
                const formattedUsers = response.data.map(user => ({
                    id: user._id,
                    display: `${user.first_name} ${user.last_name}`
                }));
                setUsers(formattedUsers);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    const handleSubmit = async () => {
        if (!comment.trim()) return;

        try {
            const response = await axios.post(`/commentsOfPhoto/${photoId}`, {
                comment,
                mentions: mentions.map(mention => mention.id)
            });

            setComment('');
            setMentions([]);
            if (onCommentSubmitted) {
                onCommentSubmitted(response.data.comment);
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    };

    // const handleMentionChange = (event, newValue, newPlainTextValue, mentions) => {
    const handleMentionChange = (event, newValue) => {
        setComment(newValue);
        setMentions(mentions);
        console.log('Mentions:', mentions); // Debug log
    };

    return (
        <Box sx={{ mt: 2, mb: 2 }}>
            <MentionsInput
                value={comment}
                onChange={handleMentionChange}
                style={mentionsInputStyle}
                placeholder="Write a comment... Use @ to mention users"
                a11ySuggestionsListLabel="Suggested mentions"
                singleLine={false}
            >
                <Mention
                    trigger="@"
                    data={users}
                    displayTransform={(id, display) => `@${display}`}
                    appendSpaceOnAdd
                    style={{
                        backgroundColor: '#e8f0fe',
                        padding: '2px 4px',
                        borderRadius: 4,
                    }}
                />
            </MentionsInput>
            <Button
                variant="contained"
                onClick={handleSubmit}
                sx={{ mt: 6 }}
            >
                Post Comment
            </Button>
        </Box>
    );
}

export default CommentInput;