const express = require('express');
const router = express.Router();
const db = require('./config/db_config');
const { signupValidation, loginValidation } = require('./validation');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Register New User
router.post('/register', signupValidation, (req, res, next) => {
    db.query(
        `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(
            req.body.email
        )});`,
        (err, result) => {
            if (result.length) {
                return res.status(409).send({
                    msg: 'This user is already in use!'
                });
            } else {
                // username is available
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).send({
                            msg: err
                        });
                    } else {
                        // has hashed pw => add to database
                        db.query(
                            `INSERT INTO users (email, password) VALUES (${db.escape(
                                req.body.email
                            )}, ${db.escape(hash)})`,
                            (err, result) => {
                                if (err) {
                                    throw err;
                                    return res.status(400).send({
                                        msg: err
                                    });
                                }
                                return res.status(201).send({
                                    msg: 'The user has been registerd with us!'
                                });
                            }
                        );
                    }
                });
            }
        }
    );
});

//Login or Sign In User
router.post('/login', loginValidation, (req, res, next) => {
    db.query(
        `SELECT * FROM users WHERE email = ${db.escape(req.body.email)};`,
        (err, result) => {
            // user does not exists
            if (err) {
                throw err;
                return res.status(400).send({
                    msg: err
                });
            }
            if (!result.length) {
                return res.status(401).send({
                    msg: 'Email or password is incorrect!'
                });
            }
            // check password
            bcrypt.compare(
                req.body.password,
                result[0]['password'],
                (bErr, bResult) => {
                    // wrong password
                    if (bErr) {
                        throw bErr;
                        return res.status(401).send({
                            msg: 'Email or password is incorrect!'
                        });
                    }
                    if (bResult) {
                        const token = jwt.sign({ id: result[0].id }, 'the-super-strong-secrect', { expiresIn: '1h' });
                        db.query(
                            `UPDATE users SET last_login = now(), token='${token}' WHERE user_id = '${result[0].user_id}'`
                        );
                        return res.status(200).send({
                            msg: 'Logged in!',
                            token,
                            user: result[0]
                        });
                    }
                    return res.status(401).send({
                        msg: 'Username or password is incorrect!'
                    });
                }
            );
        }
    );
});
//Add New Item If User Loged In
router.post('/add-items', async function (req, res, next) {

    try {

        if (
            !req.headers.authorization ||
            !req.headers.authorization.startsWith('Bearer') ||
            !req.headers.authorization.split(' ')[1]
        ) {
            return res.status(422).json({
                message: "Please provide the token",
            });
        }
        const theToken = req.headers.authorization.split(' ')[1];
        
        db.query(`SELECT * FROM users WHERE token='${theToken}'`, function (err, result) {

            if (err) {
                return res.send({ error: false, message: 'Something went wrong.' });
            }
            if (result.length != 1) {
                return res.send({ error: false, message: 'Please Login First.' });
            }
            if (result) {
                const respo = db.query(`INSERT INTO items (item_name) VALUES ('${req.body.item_name}')`);

                if (respo) {
                    return res.status(201).send({
                        msg: 'The Item add successfully!'
                    });
                }

            }

        });
    } catch (err) {
        console.error(`Error while add new item`, err.message);
        next(err);
    }
});
//Update Item
router.put('/update-item/:item_id', async function (req, res, next) {
    
    try {

        if (
            !req.headers.authorization ||
            !req.headers.authorization.startsWith('Bearer') ||
            !req.headers.authorization.split(' ')[1]
        ) {
            return res.status(422).json({
                message: "Please provide the token",
            });
        }
        const theToken = req.headers.authorization.split(' ')[1];
        
        db.query(`SELECT * FROM users WHERE token='${theToken}'`, function (err, result) {

            if (err) {
                return res.send({ error: false, message: 'Something went wrong.' });
            }
            if (result.length != 1) {
                return res.send({ error: false, message: 'Please Login First.' });
            }
            if (result) {
                const respo = db.query(`UPDATE items SET item_name = '${req.body.item_name}' WHERE item_id = '${req.params.item_id}'`);

                if (respo) {
                    return res.status(201).send({
                        msg: 'The Item add successfully!'
                    });
                }

            }

        });
    } catch (err) {
        console.error(`Error while add new item`, err.message);
        next(err);
    }
});
//Delete Item
router.delete('/delete-item/:item_id', async function (req, res, next) {
    console.log('req.params', req.params.item_id)
    try {

        if (
            !req.headers.authorization ||
            !req.headers.authorization.startsWith('Bearer') ||
            !req.headers.authorization.split(' ')[1]
        ) {
            return res.status(422).json({
                message: "Please provide the token",
            });
        }
        const theToken = req.headers.authorization.split(' ')[1];
        
        db.query(`SELECT * FROM users WHERE token='${theToken}'`, function (err, result) {

            if (err) {
                return res.send({ error: false, message: 'Something went wrong.' });
            }
            if (result.length != 1) {
                return res.send({ error: false, message: 'Please Login First.' });
            }
            if (result) {
                const respo = db.query(`DELETE FROM items WHERE item_id = ${req.params.item_id}`);

                if (respo) {
                    return res.status(201).send({
                        msg: 'The Item deleted successfully!'
                    });
                }

            }

        });
    } catch (err) {
        console.error(`Error while delete item`, err.message);
        next(err);
    }
});

module.exports = router;

