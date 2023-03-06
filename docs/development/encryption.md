---
sidebar_position: 5
---

# Encryption

Takaro needs to store certain sensitive data in the database which must be protected. The [pgcrypto PostgreSQL module](https://www.postgresql.org/docs/current/pgcrypto.html) is leveraged for this. This module will automatically get installed by `app-api` on boot up, if it is not already installed. Please note that if you are not using a standard PostgreSQL installation method, this module might not be available out-of-the-box for you.

:::caution

Because encryption-related actions happen inside the database, that means that sensitive data is transmitted in clear text between the application and the database. You should securely connect to your database (e.g. using TLS) to prevent this data from being intercepted.

:::

## Encryption/Decryption

Some data needs to be read after it has been stored (like connection info for servers). For these types of data, a key is used to encrypt the data before it is stored in the database. This key is stored in the `POSTGRES_ENCRYPTION_KEY` environment variable and is used to encrypt and decrypt the data. This functionality uses the `PGP_SYM_ENCRYPT` and `PGP_SYM_DECRYPT` functions from the `pgcrypto` module.

## Hashing

Other data needs to be hashed (like API keys or passwords) and we do not need to read the actual value after the initial write. We only need to verify that the values are the same as some input. For these, we use the functions `crypt()` and `gen_salt()`.