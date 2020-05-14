# Use Recrypt-as-a-Service for Cryptographic Orthogonal Access Control

This is a [Mozilla Open Labs project](https://builders.mozilla.community/springlab/index.html).

The idea of Cryptographic Orthogonal Access Control is for individuals to control who can access their data without shared secrets or storing secrets (e.g., private keys) on a centralized service. Applications like Dropbox and Google Drive have shown that centralized repositories and permission management systems could dramatically improve the user experience for file sharing. Yet, storing plain text documents and/or encryption keys on those centralized services have profound privacy implications.

For example, in the age of COVID-19, there is great need for people to share their medical records remotely. Cryptographic Orthogonal Access Control empowers people to share with confidence that their privacy will be protected. While there are central services and repositories to faciliate sharing, it is mathematically impossible for those services to violate your privacy. As a user, you alone decides who and when sees your data.

## Requirements

1 All parties, including individuals, doctors, hospitals, employers etc., can create public identities on the service.

2 An individual, Alice, can grant access to her data to a list of other identities in the service. Let's say that Bob is granted access.

3 Alice can now publish encrypted data files. Since the files are encrypted, she can upload the data files to any public service.

4 Only the identities that are granted access in #2 (e.g., Bob) can generate decryption keys to decrypt and read those files.

5 Alice can grant access to more identities, say Charlie, at any time. Charlie, like Bob, will have access to all encrypted files from Alice.

6 Alice can revoke access to any identity. Let's say Bob's access s revoked. Bob will not be able to generate decryption keys for any Alice's files.

> It is still possible for Bob to retain some decryption keys before his access was revoked. It is best for Alice to use a new encryption key for each file or data update published.

> Traditional PKI requires Alice to create a different key for each person on her access list. It is a huge amount of work for Alice if she has a million files and a million people on the list. The recryption scheme only requires Alice to encrypt and upload her data files once. Bob and Charlie can create their own decryption keys as long as their access is not revoked.

## Use case scenario

Alice creates an identity on the service. She needs to save the returned UUID and private key values. She needs them later.

```
$ curl http://127.0.0.1:3000/create_identity
{"uuid":"f9d2ec5a-5f48-4e1b-a0b3-d52b0e0f521f","pk":[8,209,114,217,157,178,185,53,154,42,198,226,108,120,241,24,27,22,244,136,57,40,145,224,234,97,138,58,70,33,116,21]}

# {"uuid":"<Alice UUID>", "pk":"<Alice private key>"}
```

Bob, Charlie, and others each creates an identity on the service. They need to save the returned ID and private key values. Here is Bob's UUID and private key.

```
$ curl http://127.0.0.1:3000/create_identity
{"uuid":"e7a2fc4c-7220-4617-8721-4e67120c63a9","pk":[5,251,27,236,155,82,189,136,54,48,225,95,30,66,96,94,121,155,63,6,207,72,79,9,168,119,2,23,106,36,46,200]}

# {"uuid":"<Bob UUID>", "pk":"<Bob private key>"}
```

Now, Alice can grant Bob access to all her data. The request URL takes two parameters. The first is Alice's UUID and the second is Bob's UUID. The request body must be Alice's private key since she is authorizing access.

```
# curl -d "<Alice private key>" -H 'Content-Type: application/json' -X POST http://127.0.0.1:3000/grant_access/<Alice UUID>/<Bob UUID>
# { ... "signature":"<access signature>" ... }

$ curl -d "[8,209,114,217,157,178,185,53,154,42,198,226,108,120,241,24,27,22,244,136,57,40,145,224,234,97,138,58,70,33,116,21]" -H 'Content-Type: application/json' -X POST http://127.0.0.1:3000/grant_access/f9d2ec5a-5f48-4e1b-a0b3-d52b0e0f521f/e7a2fc4c-7220-4617-8721-4e67120c63a9
{"ephemeral_public_key_x":[142,76,226,11,212,245,148,129,225,44,88,208,126,92,66,176,192,157,223,21,99,115,86,183,224,129,1,217,130,213,92,222],"ephemeral_public_key_y":[40,251,199,159,149,56,226,154,187,148,30,237,19,122,202,107,206,249,99,203,135,8,59,12,234,201,45,111,54,71,49,18],"to_public_key_x":[80,143,189,85,42,60,53,255,133,239,241,247,78,149,122,68,3,47,200,76,194,160,219,129,228,110,127,213,108,36,183,176],"to_public_key_y":[50,171,33,216,135,120,219,87,253,189,243,7,160,166,251,42,3,71,214,84,96,56,212,145,186,93,226,6,252,139,31,9],"encrypted_temp_key":[78,170,176,103,24,77,116,55,125,206,85,141,118,46,30,192,39,92,120,187,95,177,38,114,106,171,126,208,87,159,242,175,93,14,133,209,240,61,89,182,174,115,44,121,141,245,114,123,63,98,29,165,112,68,126,163,159,206,22,212,101,192,172,16,129,103,128,44,107,103,167,80,204,161,167,155,177,162,239,1,239,174,84,14,125,227,21,175,239,22,71,223,162,253,43,6,29,70,0,150,252,28,184,233,44,137,199,153,34,24,247,199,134,255,158,54,98,55,0,201,172,242,58,198,34,68,223,149,139,95,26,0,252,93,5,138,180,232,255,200,61,70,233,0,201,251,201,233,13,63,4,65,89,179,152,72,12,26,187,87,30,242,94,48,84,107,126,175,162,199,171,241,27,4,63,250,41,118,95,228,222,215,132,241,234,193,147,31,106,42,80,28,104,32,17,189,141,172,148,124,207,57,215,92,243,99,207,113,185,38,206,6,108,243,67,116,220,29,13,159,123,152,39,170,77,103,106,16,70,31,92,23,4,241,200,211,87,95,84,120,199,204,83,205,68,127,100,132,76,109,117,74,177,168,99,176,75,66,123,4,6,105,125,219,81,202,104,113,204,8,38,167,214,239,157,153,143,211,125,54,66,252,63,83,181,127,99,101,99,231,241,62,206,221,67,24,187,185,139,212,191,247,230,30,154,180,245,76,161,110,0,208,186,86,118,72,127,243,133,84,32,234,17,3,82,99,190,204,68,123,239,202,30,228,226,177,7,144,231,4,133,23,126,100,14,212,227,56,177,3,67,33,67,134,161,86,92,157,184,245,238,148,29,186,127,239,144,68,111,232,199,79,17,151,198,183,63,168,167,130,31,113,83,19],"hashed_temp_key":[33,231,192,154,241,175,190,83,72,187,124,243,137,165,235,54,156,51,98,107,226,243,154,119,82,29,40,254,119,39,176,203,77,117,24,221,183,164,210,216,55,167,97,62,236,159,215,114,58,201,94,70,240,223,72,132,35,152,54,14,14,15,33,20,135,81,90,230,161,179,134,144,157,178,85,1,49,26,144,92,145,181,178,215,96,27,65,90,112,225,240,248,40,32,146,115,83,167,187,120,59,82,16,175,151,229,111,120,241,223,62,42,212,70,143,24,246,76,244,101,76,128,184,55,183,47,136,61],"public_signing_key":[55,207,227,73,96,69,180,100,80,166,176,196,93,187,117,83,199,97,127,73,0,58,102,145,110,61,241,244,164,162,77,67],"signature":[27,157,189,125,255,133,207,85,122,65,1,4,213,170,221,62,32,34,183,33,83,185,149,84,81,27,219,244,206,31,134,236,177,209,53,190,229,89,31,229,141,198,64,109,81,70,149,229,94,117,49,73,187,220,148,9,135,205,225,107,88,148,37,10]}
```

When Alice creates a confidential document, she can create a new AES encryption key to encrypt it. She generates the AES key as follows. Alice's UUID is in the URL since this AES key is generated by her and will shared to people Alice granted access to. Note down the key's UUID, and publish the UUID with the encrypted document.

```
# curl http://127.0.0.1:3000/create_sym_key/<Alice UUID>
# {"uuid":"<Key UUID>","sk":"<AES key in HEX>"}

$ curl http://127.0.0.1:3000/create_sym_key/f9d2ec5a-5f48-4e1b-a0b3-d52b0e0f521f
{"uuid":"9ebc843e-c82a-4c72-88b5-d8401f640cc7","sk":"83177a48b4c97ed4b0d8f0fd0f34f549b4d2987582d59397e67294566c481ad2"}
```

When Bob wants to decrypt the document, he asks for Alice's AES key. The URL has Bob's UUID, Alice's UUID, and the AES key's UUID. The request body is Bob's private key to prove this is really Bob. The return value is the AES key that can decrypt Alice's documents.

```
# curl -d "<Bob private key>" -H 'Content-Type: application/json' -X POST http://127.0.0.1:3000/get_sym_key/<Bob UUID>/<Alice UUID>/<Key UUID>
# <AES key in HEX>

$ curl -d "[5,251,27,236,155,82,189,136,54,48,225,95,30,66,96,94,121,155,63,6,207,72,79,9,168,119,2,23,106,36,46,200]" -H 'Content-Type: application/json' -X POST http://127.0.0.1:3000/get_sym_key/e7a2fc4c-7220-4617-8721-4e67120c63a9/f9d2ec5a-5f48-4e1b-a0b3-d52b0e0f521f/9ebc843e-c82a-4c72-88b5-d8401f640cc7
83177a48b4c97ed4b0d8f0fd0f34f549b4d2987582d59397e67294566c481ad2
```

Now Bob received Alice's AES key and decrypt her documents. Now Alice can creates more documents and more AES keys. She shares the key UUID to everyone she `grant_access` to and they will all be able to retrieve the key themselves. If Alice does not `grant_access` to Charlie, the above `get_sym_key` operaton from Charlie's UUID and private key will fail. 

Finally, Alice can revoke access for Bob. She does so by posting the `signature` from `grant_access` to a `revoke_access` call.

```
# curl -d "<access signature>" -H 'Content-Type: application/json' -X POST http://127.0.0.1:3000/revoke_access/<Alice UUID>/<Bob UUID>

$ curl -d "[27,157,189,125,255,133,207,85,122,65,1,4,213,170,221,62,32,34,183,33,83,185,149,84,81,27,219,244,206,31,134,236,177,209,53,190,229,89,31,229,141,198,64,109,81,70,149,229,94,117,49,73,187,220,148,9,135,205,225,107,88,148,37,10]" -H 'Content-Type: application/json' -X POST http://127.0.0.1:3000/revoke_access/f9d2ec5a-5f48-4e1b-a0b3-d52b0e0f521f/e7a2fc4c-7220-4617-8721-4e67120c63a9
[Success]
```

Bob cannot get any of Alice's published AES key anymore.

```
# curl -d "<Bob private key>" -H 'Content-Type: application/json' -X POST http://127.0.0.1:3000/get_sym_key/<Bob UUID>/<Alice UUID>/<Key UUID>

$ curl -d "[5,251,27,236,155,82,189,136,54,48,225,95,30,66,96,94,121,155,63,6,207,72,79,9,168,119,2,23,106,36,46,200]" -H 'Content-Type: application/json' -X POST http://127.0.0.1:3000/get_sym_key/e7a2fc4c-7220-4617-8721-4e67120c63a9/f9d2ec5a-5f48-4e1b-a0b3-d52b0e0f521f/9ebc843e-c82a-4c72-88b5-d8401f640cc7
[Error]
```

## Running the service

### Prerequisite

```
$ sudo apt-get update
$ sudo apt-get -y upgrade
$ sudo apt install build-essential curl wget git vim libboost-all-dev

$ curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
$ source $HOME/.cargo/env

$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
$ export NVM_DIR="$HOME/.nvm"
$ [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
$ [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

$ nvm install v10.19.0
$ nvm use v10.19.0

$ npm install -g ssvmup # Append --unsafe-perm if permission denied
$ npm install ssvm
```

### Build the application

```
$ ssvmup build
```

### Start the service

```
$ cd node
$ node app.js
```

