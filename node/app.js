const { create_identity, create_plain_text, encrypt, create_transform_key, transform, decrypt, get_symmetric_key } = require('../pkg/recrypt_as_a_service_lib.js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.send('Recrypt as a Service')
})

app.get('/create_identity', function (req, res) {
  var identity = JSON.parse(create_identity());
  var result = {};
  result['uuid'] = uuidv4();
  result['pk'] = identity['private_key'];
  delete identity['private_key'];

  // Store the public keys
  fs.writeFileSync("people_" + result['uuid'] + "_id.json", JSON.stringify(identity));

  // Give the user the private key and UUID
  res.send( JSON.stringify(result) );
})

app.get('/create_sym_key/:peopleId', function (req, res) {
  var people_id = req.params['peopleId'];
  console.log(people_id);
  var plain_text = JSON.parse(create_plain_text());
  var identity = JSON.parse ( fs.readFileSync("people_" + people_id + "_id.json") );
  var sk = get_symmetric_key(Uint8Array.from(plain_text));

  var args = [plain_text, identity['public_key_x'], identity['public_key_y'], identity['signing_key_pair']];
  // var ev = JSON.parse( encrypt(JSON.stringify(args)) );

  var result = {};
  result['uuid'] = uuidv4();
  result['sk'] = Buffer.from(sk).toString('hex');

  // Store the encrypted secret
  fs.writeFileSync("people_" + people_id + "_ev_" + result['uuid'] + ".json", encrypt(JSON.stringify(args)));

  // Give the user the sym key and UUID for later access
  res.send( JSON.stringify(result) );
})

app.post('/grant_access/:orgId/:symKeyId/:dstId', function (req, res) {
  var org_id = req.params['orgId'];
  var dst_id = req.params['dstId'];
  var sk_id = req.params['symKeyId'];

  var org_identity = JSON.parse( fs.readFileSync("people_" + org_id + "_id.json") );
  org_identity['private_key'] = req.body; // Already parsed into JSON
  var dst_identity = JSON.parse( fs.readFileSync("people_" + dst_id + "_id.json") );
  // Creates the Transform Key, and then prepare to transform the encrypted value
  var args = [org_identity['private_key'], dst_identity['public_key_x'], dst_identity['public_key_y'], org_identity['signing_key_pair']];
  var tk = JSON.parse( create_transform_key(JSON.stringify(args)) );
  var ev = JSON.parse( fs.readFileSync("people_" + org_id + "_ev_" + sk_id + ".json") );
  args = [ev, tk, org_identity['signing_key_pair']];

  // Store the recrypted secret
  fs.writeFileSync("people_" + dst_id + "_tv_" + sk_id + ".json", transform(JSON.stringify(args)));

  // return success
  res.end();
})

app.post('/get_sym_key/:dstId/:symKeyId', function (req, res) {
  var dst_id = req.params['dstId'];
  var sk_id = req.params['symKeyId'];

  var dst_identity = JSON.parse( fs.readFileSync("people_" + dst_id + "_id.json") );
  dst_identity['private_key'] = req.body; // Already parsed into JSON
  var tv = JSON.parse( fs.readFileSync("people_" + dst_id + "_tv_" + sk_id + ".json") );
  // Decrypt the Transformed Value into plain text secret, and then get the sym key from it
  var args = [tv, dst_identity['private_key']];
  var pt = JSON.parse( decrypt(JSON.stringify(args)) );
  var sk = get_symmetric_key(Uint8Array.from(pt));

  // return value
  res.send(Buffer.from(sk).toString('hex'));
})

// app.use(express.static('people'))

app.listen(3000)
