FROM iojs:1.6.4

RUN npm install -g cb-cloud-benchmark

CMD [ "/bin/bash -c \"while true; do sleep 1; done\"" ]
