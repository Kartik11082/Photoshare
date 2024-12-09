const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    comment: { type: String, required: true },
    date_time: { type: Date, default: Date.now },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mentions: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' }
    }]
});

module.exports = mongoose.model('Comment', commentSchema); 