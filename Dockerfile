FROM node:0.12.4

RUN npm install -g cb-cloud-benchmark

CMD [ "/bin/bash -c \"while true; do sleep 1; done\"" ]
