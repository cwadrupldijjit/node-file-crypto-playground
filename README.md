# Simple Vanilla Node File Encryption

This repo is just a simple proof-of-concept that is a basis for how you can utilize the vanilla Node crypto package to encrypt data, particularly files, and send them across the wire.

This is by no means an extensive example, but there are annotations in the code that aid in understanding what each piece is for and how it works.  However, some of this requires some understanding of encryption, what it does for you, what it doesn't do for you, and how to use it properly.  This example also heavily utilizes streams instead of synchronously reading and writing files.  If you don't understand how those work, then this can be a project you can use to actually learn how they work or else you will be only very confused.

## To Use

Simply pull down the repo and then run `node index.js`--no install required!
