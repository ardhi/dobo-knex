# Config Object

| Key Name | Type | Default | Description |
| ------- | ---- | ----- | ----------- |
| ```connOptions``` | ```object``` || Common Knex options |
| &nbsp;&nbsp;&nbsp;&nbsp;```compileSqlOnError``` | ```boolean``` | ```false``` ||
| &nbsp;&nbsp;&nbsp;&nbsp;```...``` ||| See knex options |
| ```manticoresearch``` | ```object``` || Common manticoresearch options |
| &nbsp;&nbsp;&nbsp;&nbsp;```maxMatches``` | ```number``` | 1000 ||
| &nbsp;&nbsp;&nbsp;&nbsp;```...``` ||| See manticoresearch options |

## Driver Specific Connection

These driver specific connection objects should be used as your **Dobo connection** object's array written in your ```{dataDir}/config/dobo.json```, NOT in ```{dataDir}/config/doboKnex.json```.

See Dobo's Config Object for more info on this topic.

### General

| Key Name | Type | Default | Description |
| ------- | ---- | ----- | ----------- |
| ```name``` | ```string``` | ```default``` | Connection name |
| ```type``` | ```string``` || Connection's driver type. See below |
| ```connection``` | ```object``` || Connection details |
| &nbsp;&nbsp;&nbsp;&nbsp;```host``` | ```string``` | ```127.0.0.1``` | Hostname/ip to connect to |
| &nbsp;&nbsp;&nbsp;&nbsp;```port``` | ```number``` || Defaults to DB's default port |
| &nbsp;&nbsp;&nbsp;&nbsp;```user``` | ```string``` || Username to connect as |
| &nbsp;&nbsp;&nbsp;&nbsp;```password``` | ```string``` || User's password |
| &nbsp;&nbsp;&nbsp;&nbsp;```database``` | ```string``` || Database name |
| &nbsp;&nbsp;&nbsp;&nbsp;```...``` ||| See knex *connection* config |
| ```useNullAsDefault``` | ```boolean``` | ```true``` | See knex options |
| ```...``` ||| See knex options |

### SQLite3

| Key Name | Type | Default | Description |
| ------- | ---- | ----- | ----------- |
| ```...``` ||| See knex options |
| ```connection``` | ```object``` || Connection details |
| &nbsp;&nbsp;&nbsp;&nbsp;```filename``` | ```string``` || Path to database file |
| ```...``` ||| See knex options |

Directory to database file, if not specifed, defaults to ```{dataDir}/plugins/dobo/db/{filename}```

if ```{filename}``` is ```:memory:```, it turns on SQLite3 memory database

Directory tokens are supported, it will be replaced by its respected values if any are found:
- ```{appDir}```
- ```{dataDir}```
- ```{tmp-dir}```

### Driver Types

Very similar to ```client``` option Knexjs's term, it should be one of:

- ```dbknex:better-sqlite3```, driver: better-sqlite3
- ```dbknex:cockcrouchdb```, driver: pg
- ```dbknex:mssql```, driver: tedious
- ```dbknex:mysql```, driver: mysql
- ```dbknex:mysql2```, driver: mysql2
- ```dbknex:oracle```, driver: oracle
- ```dbknex:oracledb```, driver: oracledb
- ```dbknex:pg-native```, driver: pg-native
- ```dbknex:postgres```, driver: pg
- ```dbknex:redshift```, driver: pg
- ```dbknex:sqlite3```, driver: sqlite3
- ```dbknex:manticoresearch```, driver: mysql
