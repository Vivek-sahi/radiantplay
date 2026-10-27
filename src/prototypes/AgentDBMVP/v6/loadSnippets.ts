import { ENDPOINT_HOST, LOAD_PORT, SQL_PORT } from './data';

/**
 * Load settings for each way of loading (Vivek, 27 Oct): one table or many, filled in for the
 * chosen key, database and tables. Every way ends in Stream Load (HTTP, one request per table
 * per batch) except DataX's JDBC check. Option names follow each tool's Doris connector docs;
 * check them against the version you run. The load address is a placeholder until engineering
 * settles the public HTTPS address (open question).
 */

export type LoadWay = 'any' | 'curl' | 'shell' | 'python' | 'seatunnel' | 'flinkcdc' | 'kafka' | 'datax';

export const LOAD_WAYS: { id: LoadWay; label: string; many: boolean; hint: string }[] = [
  { id: 'curl', label: 'curl', many: false, hint: 'Test one file by hand. One command per table.' },
  { id: 'shell', label: 'Shell script', many: true, hint: 'One file per table, loaded in a loop. Fits cron or an Airflow task.' },
  { id: 'python', label: 'Python', many: true, hint: 'The same loop in Python, with the reply checked.' },
  { id: 'seatunnel', label: 'SeaTunnel', many: true, hint: 'One job for all the tables. Pick the source in the job.' },
  { id: 'flinkcdc', label: 'Flink CDC', many: true, hint: 'Keeps tables in sync with a MySQL or Postgres database, continuously.' },
  { id: 'kafka', label: 'Kafka Connect', many: true, hint: 'Streams topics into tables. One topic per table.' },
  { id: 'datax', label: 'DataX', many: false, hint: 'One job per table, for batch copies.' },
];

export const LOAD_HOST = `${ENDPOINT_HOST}:${LOAD_PORT}`;
const BASE = `https://${LOAD_HOST}`;
const RUN = '$(date +%Y%m%d%H%M)';

const curlOne = (key: string, db: string, t: string) =>
  [
    `curl -u ${key}:$AGENTDB_KEY \\`,
    `  -H "label: ${t}-${RUN}" \\`,
    `  -H "format: csv" \\`,
    `  -H "column_separator: ," \\`,
    `  -H "skip_lines: 1" \\`,
    `  -H "compress_type: GZ" \\`,
    `  -H "Expect: 100-continue" \\`,
    `  -T ${t}.csv.gz \\`,
    `  "${BASE}/api/${db}/${t}/_stream_load"`,
  ].join('\n');

export const snippet = (way: LoadWay, key: string, db: string, tables: string[]): string => {
  const ts = tables.length ? tables : ['<table>'];
  switch (way) {
    case 'any':
      return '';
    case 'curl':
      return ts.map((t) => `# ${db}.${t}\n${curlOne(key, db, t)}`).join('\n\n');

    case 'shell':
      return `#!/usr/bin/env bash
# Loads <table>.csv.gz into ${db}.<table>, one request per table.
# The label makes each run's batch unique, so a retry never loads twice.
set -euo pipefail
: "\${AGENTDB_KEY:?Set AGENTDB_KEY to the secret of ${key}}"
RUN="${RUN}"

for t in ${ts.join(' ')}; do
  curl -sS --fail -u ${key}:"$AGENTDB_KEY" \\
    -H "label: \${t}-\${RUN}" \\
    -H "format: csv" -H "column_separator: ," -H "skip_lines: 1" \\
    -H "compress_type: GZ" -H "Expect: 100-continue" \\
    -T "\${t}.csv.gz" \\
    "${BASE}/api/${db}/\${t}/_stream_load"
  echo
done`;

    case 'python':
      return `import os, time, requests

KEY = ("${key}", os.environ["AGENTDB_KEY"])
TABLES = [${ts.map((t) => `"${t}"`).join(', ')}]
RUN = time.strftime("%Y%m%d%H%M")

for t in TABLES:
    with open(f"{t}.csv.gz", "rb") as f:
        r = requests.put(
            f"${BASE}/api/${db}/{t}/_stream_load",
            auth=KEY,
            data=f,
            headers={"label": f"{t}-{RUN}", "format": "csv", "column_separator": ",",
                     "skip_lines": "1", "compress_type": "GZ", "Expect": "100-continue"},
        )
    reply = r.json()
    print(t, reply["Status"], reply.get("NumberLoadedRows"), reply.get("ErrorURL", ""))`;

    case 'seatunnel':
      return `env {
  job.mode = "BATCH"          # STREAMING for a CDC source
}

source {
  # Your source goes here: Jdbc, MySQL-CDC, Postgres-CDC, S3File…
  # For many tables, list them in the source; each keeps its name.
}

sink {
  Doris {
    fenodes  = "${LOAD_HOST}"
    query-port = ${SQL_PORT}
    username = "${key}"
    password = "\${AGENTDB_KEY}"
    database = "${db}"
    table    = ${ts.length > 1 ? '"${table_name}"      # each source table goes to the table of the same name' : `"${ts[0]}"`}
    sink.label-prefix = "${ts.length > 1 ? `${db}-bulk` : ts[0]}"   # one prefix per job
    sink.enable-2pc   = "true"   # exactly-once
    doris.config { format = "json", read_json_by_line = "true" }
  }
}
${ts.length > 1 ? `# Tables in this job: ${ts.join(', ')}` : ''}`;

    case 'flinkcdc':
      return `source:
  type: mysql                  # or postgres
  hostname: <source-host>
  port: 3306
  username: <source-user>
  password: <source-password>
  tables: <source_db>.(${ts.join('|')})

sink:
  type: doris
  fenodes: ${LOAD_HOST}
  username: ${key}
  password: \${AGENTDB_KEY}

route:
${ts.map((t) => `  - source-table: <source_db>.${t}\n    sink-table: ${db}.${t}`).join('\n')}

pipeline:
  name: Sync to AgentDB
  parallelism: 2`;

    case 'kafka':
      return JSON.stringify(
        {
          name: `agentdb-${db}`,
          config: {
            'connector.class': 'org.apache.doris.kafka.connector.DorisSinkConnector',
            topics: ts.join(','),
            'doris.topic2table.map': ts.map((t) => `${t}:${t}`).join(','),
            'doris.urls': ENDPOINT_HOST,
            'doris.http.port': LOAD_PORT,
            'doris.query.port': SQL_PORT,
            'doris.user': key,
            'doris.password': '${AGENTDB_KEY}',
            'doris.database': db,
            'buffer.flush.time': '10',
            'key.converter': 'org.apache.kafka.connect.storage.StringConverter',
            'value.converter': 'org.apache.kafka.connect.json.JsonConverter',
            'value.converter.schemas.enable': 'false',
          },
        },
        null,
        2,
      );

    case 'datax':
      return ts
        .map((t) =>
          JSON.stringify(
            {
              job: {
                content: [
                  {
                    reader: { name: '<your reader, e.g. mysqlreader>', parameter: {} },
                    writer: {
                      name: 'doriswriter',
                      parameter: {
                        loadUrl: [LOAD_HOST],
                        username: key,
                        password: '${AGENTDB_KEY}',
                        column: ['*'],
                        connection: [{ jdbcUrl: `jdbc:mysql://${ENDPOINT_HOST}:${SQL_PORT}/${db}`, selectedDatabase: db, table: [t] }],
                        loadProps: { format: 'json', strip_outer_array: true },
                      },
                    },
                  },
                ],
                setting: { speed: { channel: 1 } },
              },
            },
            null,
            2,
          ),
        )
        .join('\n\n');
  }
};

/** The contract every loader follows, for tools with no Doris connector or for your own code. */
export const httpContract = (key: string, db: string, t: string): string =>
  `PUT ${BASE}/api/${db}/${t}/_stream_load
Authorization: Basic base64("${key}:<secret>")
label: <unique per batch, e.g. ${t}-202610270600>
format: csv | json
column_separator: ,          (csv)
skip_lines: 1                (csv with a header row)
read_json_by_line: true      (json, one object per line)
Expect: 100-continue
<body: the file>

Success reply (200):
{ "Status": "Success", "NumberLoadedRows": 120004, "NumberFilteredRows": 0 }
Anything else: read "Message", and "ErrorURL" for the rows that failed.
"Label Already Exists": this batch was already loaded; don't resend.`;
