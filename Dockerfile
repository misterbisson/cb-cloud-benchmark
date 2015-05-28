FROM node:0.12.4

RUN npm install -g cb-cloud-benchmark

ADD ./bin /bin

ADD ./data /data

CMD [ "/bin/bash -c \"while true; do sleep 1; done\"" ]