const express = require("express");
const router = express.Router();
const {signUp, signIn, accountActivation, forgotPassword, resetPassword} = require("../controllers/auth");

router.post('/signup',signUp);

router.post('/account-activation', accountActivation);

router.post('/signin', signIn);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

module.exports = router;