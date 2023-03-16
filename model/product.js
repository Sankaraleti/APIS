const mongoose = require('mongoose');

const productTransactionSchema = new mongoose.Schema({
    id: Number,
    name: String,
    category: String,
    dateOfSale: String,
    price: Number,
    sold: Boolean
});

const ProductTransaction = mongoose.model('ProductTransaction', productTransactionSchema);
module.exports = ProductTransaction;