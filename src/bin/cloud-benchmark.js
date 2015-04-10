#! /usr/bin/env node

import cluster from "cluster";

import cli from "../lib/cli";

cli(cluster);
