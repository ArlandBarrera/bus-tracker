FROM postgis/postgis:15-3.3

COPY ./db/init/*.sql /docker-entrypoint-initdb.d/

RUN chown -R postgres:postgres /var/lib/postgresql/data
