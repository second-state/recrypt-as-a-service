const { create_identity, create_plain_text, encrypt, create_transform_key, transform, decrypt, get_symmetric_key } = require('../pkg/recrypt_as_a_service_lib.js');

// From https://nielsleenheer.com/articles/2017/the-case-for-console-hex/
console.hex = (d) => console.log((Object(d).buffer instanceof ArrayBuffer ? new Uint8Array(d.buffer) : typeof d === 'string' ? (new util.TextEncoder('utf-8')).encode(d) : new Uint8ClampedArray(d)).reduce((p, c, i, a) => p + (i % 16 === 0 ? i.toString(16).padStart(6, 0) + '  ' : ' ') + c.toString(16).padStart(2, 0) + (i === a.length - 1 || i % 16 === 15 ?  ' '.repeat((15 - i % 16) * 3) + Array.from(a).splice(i - i % 16, 16).reduce((r, v) => r + (v > 31 && v < 127 || v > 159 ? String.fromCharCode(v) : '.'), '  ') + '\n' : ''), ''));

// Client-side: The org user generates this locally. The org user gets the symmetric key, and encrypts his document.
var plain_text = JSON.parse(create_plain_text());
console.log("The randomly generated secret");
var plain_text_u8 = Uint8Array.from(plain_text);
console.hex(plain_text_u8);

// Client-side: The org user generates this locally, and uploads ev to the server.
var args = [plain_text, org_identity['public_key_x'], org_identity['public_key_y'], org_identity['signing_key_pair']];
var ev = JSON.parse( encrypt(JSON.stringify(args)) );
// console.log(ev);

// Client-side: The dst user asks for the key. The org user generates this and uploads tk to the server.
var args = [org_identity['private_key'], dst_identity['public_key_x'], dst_identity['public_key_y'], org_identity['signing_key_pair']];
var tk = JSON.parse( create_transform_key(JSON.stringify(args)) );
// console.log(tk);

// Server-side: The server creates tv and gives it to the dst user.
var args = [ev, tk, org_identity['signing_key_pair']];
var tv = JSON.parse( transform(JSON.stringify(args)) );
// console.log(tv);

// Client-side: The dst user decrypts the secret, gets the symmetric key, and decrypts the document.
var args = [tv, dst_identity['private_key']];
var pt = JSON.parse( decrypt(JSON.stringify(args)) );
console.log("The decrypted secret");
var pt_u8 = Uint8Array.from(pt);
console.hex(pt_u8);

// Utility to get symmetric key from the random generated secret
var key_u8 = get_symmetric_key(pt_u8);
console.log("The symmetric key from the secret");
console.hex(key_u8);


const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const express = require('express')
const app = express()

app.get('/', function (req, res) {
  res.send('Recrypt as a Service')
})

app.get('/create_identity', function (req, res) {
  var identity = JSON.parse(create_identity());
  var result = {};
  result.uuid = uuidv4();
  result.pk = identity.private_key;
  delete identity.private_key;

  // Store the public keys
  fs.writeFileSync("people/" + result.uuid + "id.json", JSON.stringify(identity));

  // Give the user the private key and UUID
  res.send( JSON.stringify(result) );
})

app.get('/create_sym_key/:peopleId', function (req, res) {
  var people_id = req.params['peopleId'];
  var plain_text = JSON.parse(create_plain_text());
  var identity = JSON.parse ( fs.readFileSync("people/" + people_id + "/id.json") );

  var args = [plain_text, identity['public_key_x'], identity['public_key_y'], identity['signing_key_pair']];
  // var ev = JSON.parse( encrypt(JSON.stringify(args)) );

  var sym_key_uuid = uuidv4();
  // Store the encrypted sym key
  fs.writeFileSync("people/" + people_id + "/" + sym_key_uuid + ".json", encrypt(JSON.stringify(args)));
  res.send( sym_key_uuid );
})

app.use(express.static('people'))

app.listen(3000)
