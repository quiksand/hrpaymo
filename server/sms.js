const db = require('../database/queries');
const lib = require('../lib');
const express = require('express');
const router = express.Router();

const getPhoneNumberParts = (phoneNumber) => {
  if (phoneNumber.length === 10) {
    return {phone_number: phoneNumber, country_code: '1'}
  } 
  else if (phoneNumber.length === 11) {
    return { phone_number: phoneNumber.slice(1), country_code: phoneNumber[0]}    
  }
  else {
    return false;
  }
}

const verify = (req, res) => {
  let phoneDetails = getPhoneNumberParts(req.body.p)
  if (phoneDetails.phone_number && phoneDetails.country_code && req.body.token) {
    lib.verify.verifyPhoneToken(phoneDetails.phone_number, phoneDetails.country_code, req.body.token)
      .then(response => {
        console.log('Confirm phone success confirming code: ', response);
        if (response.success) {
          db.updatePhoneNumber(req.body.p, req.body.uid)
          .then(resp => {
            db.verifyPhone(resp.id, resp.phone)
            res.status(200).json(response);
          })
          .catch(err => {
            console.log('error updating database', err);
            res.status(200).json(err);
          })
        } 
        else { res.status(200).json(err) }//got response but was unsuccessful
      })
      .catch(err => {
        console.log('error creating phone reg request', err);
        res.status(500).json(err);
      })
  } 
  else {
    console.log('Failed in Confirm Phone request body: ', req.body);
    res.status(500).json({ error: "Missing fields" });
  }
};

const request = (req, res) => {
  console.log('verifying phone number', req.query.p, req.query.uid)
  let phoneDetails = getPhoneNumberParts(req.query.p);
  if (!phoneDetails) {res.status(500).end()} //error if phone number is invalid length
  db.updatePhoneNumber(req.query.p, req.query.uid)
    .then((row) => {
      console.log('successfully updated database for user', row)
    })
    .catch(err => {
      console.log('could not update user in db', err)
    })
  lib.verify.requestPhoneVerification(phoneDetails.phone_number, phoneDetails.country_code)
    .then(response => {
      console.log('Success register phone API call: ', response);
      res.status(200).json(response);
    })
    .catch(err => {
      console.log('error creating phone reg request', err);
      res.status(500).json(err);
    })
};

const getUserPhone = (req, res) => {
  db.getUserPhoneNumber(req.params.userId)
    .then(results => {
      res.status(200).json({
        phone: results
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).end();
    });
};

router.post('/verification/verify', verify);
router.get('/verification/start', request);
router.get('/userphone/:userId', getUserPhone);

module.exports = router;