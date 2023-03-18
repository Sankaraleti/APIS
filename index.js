const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const ProductTransaction = require('./model/product')
require('dotenv').config();

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const app = express();
app.use(express.json());

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const getTransactionsByMonth = async (month) => {
    const value = MONTHS.findIndex(m => m.toLocaleLowerCase() === month.toLocaleLowerCase()) + 1;
    const transactions = await ProductTransaction.find();
    const transactionsByMonth = transactions.filter(t => {
        const transactionMonth = new Date(t.dateOfSale).getMonth() + 1;
        if (transactionMonth == value) {
            return t;
        }
    });

    return { transactionsByMonth, transactions };
}

const validMonth = (month) => {
    if (!MONTHS.includes(month)) {
        return true;
    }
}


// API to initialize the database
app.get('/initialize', async (req, res) => {
    const { data } = await axios('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    try {
        await ProductTransaction.insertMany(data);
        res.status(200).json({ msg: 'Database initialized successfully' });
    } catch (err) {
        res.status(500).send('Error initializing database');
    }
});

//API for stastics
app.get('/statstics/:month', async (req, res) => {
    if (validMonth(req.params.month)) {
        res.status(404).json({ err: 'Month is incorrect' });
        return;
    }
    const { transactionsByMonth, transactions } = await getTransactionsByMonth(req.params.month);
    const totalPrice = transactionsByMonth.reduce((acc, t) => {
        return acc += t.price;
    }, 0)
    const itemsSold = transactionsByMonth.length;
    const itemsUnSold = transactions.length - itemsSold;
    res.status(200).json({ totalPrice, itemsSold, itemsUnSold });
});

//API for Bar chart
app.get('/barChart/:month', async (req, res) => {
    if (validMonth(req.params.month)) {
        res.status(404).json({ err: 'Month is incorrect' });
        return;
    };
    const { transactionsByMonth } = await getTransactionsByMonth(req.params.month);
    const priceRanges = [
        { range: '0-100', count: 0 },
        { range: '101-200', count: 0 },
        { range: '201-300', count: 0 },
        { range: '301-400', count: 0 },
        { range: '401-500', count: 0 },
        { range: '501-600', count: 0 },
        { range: '601-700', count: 0 },
        { range: '701-800', count: 0 },
        { range: '801-900', count: 0 },
        { range: '901-above', count: 0 }
    ];
    transactionsByMonth.forEach((transaction) => {
        const price = transaction.price;
        const rangeIndex = Math.floor(price / 100);
        rangeIndex >= priceRanges.length ?
            priceRanges[priceRanges.length - 1].count++ : priceRanges[rangeIndex].count++;
    });

    res.status(200).json({ priceRanges });
});

//API for PIE chart
app.get('/pieChart/:month', async (req, res) => {
    if (validMonth(req.params.month)) {
        res.status(404).json({ err: 'Month is incorrect' });
        return;
    }
    const { transactionsByMonth } = await getTransactionsByMonth(req.params.month);
    const categories = transactionsByMonth.reduce((acc, transaction) => {
        const { category } = transaction;
        (!acc[category]) ? acc[category] = 1 : acc[category]++;
        return acc;
    }, {});

    res.status(200).json({ categories });
});

//Get all info of trasactions
app.get('/all/:month', async (req, res) => {
    const { month } = req.params;
    if (validMonth(month)) {
        res.status(404).json({ err: 'Month is incorrect' });
        return;
    }
    const { data: statstics } = await axios.get(`http://localhost:5555/statstics/${month}`);
    const { data: barchart } = await axios.get(`http://localhost:5555/barChart/${month}`);
    const { data: pieChart } = await axios.get(`http://localhost:5555/pieChart/${month}`);

    res.status(201).json({ statstics, barchart, pieChart });
});

const port = process.env.PORT || 5555;
app.listen(port, () => console.log(`Server running on port ${port}......`));




