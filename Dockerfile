FROM jitesoft/lighttpd

ENV TAR1090_SOURCE_DIR="/run/readsb"
ARG SERVICE="tar1090"
ARG INSTANCE="tar1090"
ARG HTMLPATH="/usr/local/share/tar1090/html"
ENV PORT=8003

RUN apk add bash
RUN apk add jq

RUN mkdir -p /run/tar1090
RUN mkdir -p /run/readsb

COPY ./88-docker-tar1090.conf /usr/local/lighttpd.d/88-docker-tar1090.conf
RUN sed -i.orig -e "s?SOURCE_DIR?$TAR1090_SOURCE_DIR?g" -e "s?SERVICE?$SERVICE?g" -e "s?INSTANCE?$INSTANCE?g" -e "s?HTMLPATH?$HTMLPATH?g" /usr/local/lighttpd.d/88-docker-tar1090.conf

CMD nohup /usr/local/share/tar1090/tar1090.sh /run/tar1090 $TAR1090_SOURCE_DIR & entrypoint -D