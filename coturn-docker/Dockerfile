FROM ubuntu:20.04

RUN apt-get update && apt-get install -y coturn && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENV TURN_PORT 3478
ENV TURN_PORT_START 20000
ENV TURN_PORT_END 20020
ENV TURN_USER user:asdfasdf
ENV TURN_SERVER_NAME coturn
ENV TURN_REALM localhost

ADD start.sh start.sh
RUN chmod +x start.sh

CMD ["./start.sh"]
