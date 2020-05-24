# gongo-server

*Server(less) components for GongoJS fullstack data and auth*

Copyright (c) 2020 by Gadi Cohen.  MIT licensed.

## lib/serverless.db

## Environment variables

* `NO_ENSURE=1`

  By default, gongo will "ensure" some things in the database, like the admin
  user, oauth2 settings, etc.  This happens every time the server is launched.
  For busy sites, setting this option to true will skip these checks, which
  will slightly reduce load on your database server every time a lambda cold
  starts.
