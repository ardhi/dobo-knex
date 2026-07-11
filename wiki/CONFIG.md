# Config Object

| Key Name | Type | Default | Description |
| ------- | ---- | ----- | ----------- |
| ```connOptions``` | ```object``` || Common Knex options |
| &nbsp;&nbsp;&nbsp;&nbsp;```compileSqlOnError``` | ```boolean``` | ```false``` ||
| &nbsp;&nbsp;&nbsp;&nbsp;```...``` ||| See knex options |
| ```manticoresearch``` | ```object``` || Common manticoresearch options |
| &nbsp;&nbsp;&nbsp;&nbsp;```maxMatches``` | ```number``` | 1000 ||
| &nbsp;&nbsp;&nbsp;&nbsp;```...``` ||| See manticoresearch options |

## Adapter Specific Connection

These adapter specific connection objects should be used as your **Dobo connection** object's array written in your ```{dataDir}/config/dobo.json```, NOT in ```{dataDir}/config/doboKnex.json```.

See Dobo's Config Object for more info on this topic.

### General

| Key Name | Type | Default | Description |
| ------- | ---- | ----- | ----------- |
| ```name``` | ```string``` | ```default``` | Connection name |
| ```type``` | ```string``` || Connection's adapter type. See below |
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

### Adapter Types

Very similar to ```client``` option Knexjs's term, it should be one of:

- ```dbknex:better-sqlite3```, adapter: better-sqlite3
- ```dbknex:cockcrouchdb```, adapter: pg
- ```dbknex:mssql```, adapter: tedious
- ```dbknex:mysql```, adapter: mysql
- ```dbknex:mysql2```, adapter: mysql2
- ```dbknex:oracle```, adapter: oracle
- ```dbknex:oracledb```, adapter: oracledb
- ```dbknex:pg-native```, adapter: pg-native
- ```dbknex:postgres```, adapter: pg
- ```dbknex:redshift```, adapter: pg
- ```dbknex:sqlite3```, adapter: sqlite3
- ```dbknex:manticoresearch```, adapter: mysql
